import { usdaService, offService, fatSecretService } from '@/integrations';

interface NutritionLimits {
    daily_calories?: { min: number; max: number };
    nutrients?: Record<string, { max?: number; min?: number; unit?: string }>;
    avoid_ingredients?: string[];
}

interface Bioavailability {
    score: number;
    color: 'Red' | 'Yellow' | 'Green';
    reasoning: string;
}

export class FoodService {
    /**
     * Analyze food by search query with fallback strategy
     * 1. USDA
     * 2. FatSecret
     */
    async analyze(query: string, limits?: NutritionLimits | null, type?: 'Brand' | 'Generic') {
        try {
            // 1. Try FatSecret Search
            const fsResults = await fatSecretService.searchFoods(query, 0, 5, type);
            if (fsResults.results && fsResults.results.length > 0) {
                const fsFoodSummary = fsResults.results[0]!;
                // We need detailed nutrition, search result only has summary
                // Fetch full details
                const fsFoodDetails = await fatSecretService.getFoodDetails(fsFoodSummary.food_id);

                if (fsFoodDetails && fsFoodDetails.food) {
                    const food: any = fsFoodDetails.food; // Type assertion as FS response is loosely typed in current service

                    // Normalize FatSecret nutrition (servings are usually in an array or single object)
                    const servings = food.servings?.serving;
                    const serving = Array.isArray(servings) ? servings[0] : (servings || {});

                    const nutrition = {
                        calories: parseFloat(serving.calories) || 0,
                        protein: parseFloat(serving.protein) || 0,
                        fat: parseFloat(serving.fat) || 0,
                        carbs: parseFloat(serving.carbohydrate) || 0,
                        sugar: parseFloat(serving.sugar) || 0,
                        fiber: parseFloat(serving.fiber) || 0,
                        sodium: parseFloat(serving.sodium) || 0, // usually mg
                        servingSize: parseFloat(serving.metric_serving_amount),
                        servingSizeUnit: serving.metric_serving_unit,
                        addedSugar: 0,
                    };

                    let image = null;
                    if (food.food_images?.food_image) {
                        const imgs = food.food_images.food_image;
                        if (Array.isArray(imgs)) image = imgs[0]?.image_url;
                        else if (imgs) image = (imgs as any).image_url;
                    }

                    const bioavailability = limits ? this.checkConflicts(nutrition, food.food_name, limits) : null;

                    return {
                        source: 'FatSecret',
                        name: food.food_name,
                        brand: food.brand_name || null,
                        category: food.food_type || null,
                        image,
                        nutrition,
                        bioavailability,
                        originalId: food.food_id,
                    };
                }
            }

            console.log(`[FoodService] No FatSecret results for "${query}", falling back to USDA`);

            // 2. Fallback to USDA Search
            const usdaResults = await usdaService.searchFoods(query, { pageSize: 5 });
            if (usdaResults.foods && usdaResults.foods.length > 0) {
                const food = usdaResults.foods[0]!;
                const nutrition = {
                    ...usdaService.getNormalizedNutrition(food),
                    addedSugar: 0 // Default, USDA might differ
                };

                const bioavailability = limits ? this.checkConflicts(nutrition, food.description, limits) : null;

                return {
                    source: 'USDA',
                    name: food.description,
                    brand: food.brandName || food.brandOwner || null,
                    category: food.foodCategory?.description || null,
                    nutrition,
                    bioavailability,
                    message: bioavailability ? undefined : 'No user limits found for conflict check',
                    // Pass along data needed for adding to plan later
                    originalId: food.fdcId,
                    alternatives: usdaResults.foods.slice(1).map((f) => ({
                        name: f.description,
                        fdcId: f.fdcId,
                    })),
                };
            }

            return {
                source: null,
                message: 'No results found',
                query,
            };
        } catch (error) {
            console.error('Food analyze error:', error);
            throw error;
        }
    }

    /**
     * Search for foods (lightweight suggestion)
     */
    async search(query: string, type?: 'Brand' | 'Generic') {
        try {
            // 1. FatSecret Search
            const fsResults = await fatSecretService.searchFoods(query, 0, 10, type);

            return fsResults.results.map(f => {
                let image = null;
                if (f.food_images?.food_image) {
                    const imgs = f.food_images.food_image;
                    if (Array.isArray(imgs)) image = imgs[0]?.image_url;
                    else if (imgs) image = (imgs as any).image_url;
                }

                return {
                    name: f.food_name,
                    brand: f.brand_name || null,
                    type: f.food_type,
                    id: f.food_id,
                    source: 'FatSecret',
                    image
                };
            });
        } catch (error) {
            console.error('Food search error:', error);
            return [];
        }
    }

    /**
     * Analyze food by barcode with fallback strategy
     * 1. Open Food Facts
     * 2. USDA (Search by GTIN/Barcode)
     */
    async analyzeBarcode(code: string, limits?: NutritionLimits | null) {
        try {
            // 1. Try Open Food Facts
            const product = await offService.getProductByBarcode(code);

            if (product) {
                const nutrition = {
                    calories: product.nutriments?.['energy-kcal_100g'] || 0,
                    fat: product.nutriments?.fat_100g || 0,
                    saturatedFat: product.nutriments?.['saturated-fat_100g'] || 0,
                    carbs: product.nutriments?.carbohydrates_100g || 0,
                    sugar: product.nutriments?.sugars_100g || 0,
                    protein: product.nutriments?.proteins_100g || 0,
                    salt: product.nutriments?.salt_100g || 0,
                    sodium: (product.nutriments?.salt_100g || 0) * 400, // Roughly convert salt g to sodium mg if salt is g. OFF stores sodium_100g too usually
                    fiber: product.nutriments?.fiber_100g || 0,
                    addedSugar: 0,
                };

                // OFF usually has sodium_100g in Unit: g or mg? 
                // schema says nutriments stores value generally.
                // Let's use sodium_100g if available directly as it's more accurate than salt conversion
                if (product.nutriments?.sodium_100g !== undefined) {
                    // sodium_100g in OFF is usually in grams, but we need mg for consistency with USDA usually?
                    // USDA standard acts like mg for sodium. 
                    // Wait, OFF 'sodium_100g' is in grams. 1g = 1000mg.
                    nutrition.sodium = product.nutriments.sodium_100g * 1000;
                }

                const bioavailability = limits ? this.checkConflicts(nutrition, product.product_name, limits) : null;

                return {
                    source: 'OpenFoodFacts',
                    name: product.product_name,
                    brand: product.brands,
                    image: product.image_url,
                    nutrition,
                    bioavailability,
                    ingredients: product.ingredients_text,
                    allergens: product.allergens_tags,
                    nutriscore: product.nutriscore_grade,
                    originalId: code,
                };
            }

            // 2. Fallback to USDA Search (using barcode as query)
            // USDA supports searching by GTIN
            console.log(`[FoodService] No OFF results for barcode "${code}", falling back to USDA`);
            return this.analyze(code, limits);

        } catch (error) {
            console.error('Barcode analyze error:', error);
            throw error;
        }
    }

    /**
     * Conflict Engine: Evaluate food against user nutrition limits
     */
    private checkConflicts(
        nutrition: { sodium: number; sugar: number;[key: string]: any },
        foodName: string,
        limits: NutritionLimits
    ): Bioavailability {
        let score = 100;
        const reasons: string[] = [];
        let color: Bioavailability['color'] = 'Green';

        // 1. Check Avoid Ingredients
        // Simple string check (case insensitive)
        if (limits.avoid_ingredients && limits.avoid_ingredients.length > 0) {
            const nameLower = foodName.toLowerCase();
            const hit = limits.avoid_ingredients.find(i => nameLower.includes(i.toLowerCase()));
            if (hit) {
                return {
                    score: 0,
                    color: 'Red',
                    reasoning: `Contains avoided ingredient: ${hit}`,
                };
            }
        }

        // 2. Check Nutrient Limits (Sodium, Sugar, etc.)
        // We compare PER SERVING (or per 100g if that's what we have) against Daily Max
        // Heuristic: If one serving is > 40% of daily max, it's Caution. > 75% is Avoid (Red).

        if (limits.nutrients) {
            // Sodium
            const maxSodium = limits.nutrients['NA']?.max; // Sodium in mg
            if (maxSodium && nutrition.sodium > 0) {
                const pct = (nutrition.sodium / maxSodium) * 100;
                if (pct > 75) {
                    score -= 50;
                    reasons.push(`Very high sodium (${Math.round(nutrition.sodium)}mg) - ${Math.round(pct)}% of daily limit`);
                } else if (pct > 30) {
                    score -= 20;
                    reasons.push(`High sodium (${Math.round(nutrition.sodium)}mg)`);
                }
            }

            // Sugar
            const maxSugar = limits.nutrients['SUGAR']?.max; // Sugar in g
            if (maxSugar && nutrition.sugar > 0) {
                const pct = (nutrition.sugar / maxSugar) * 100;
                if (pct > 75) {
                    score -= 40;
                    reasons.push(`Very high sugar (${Math.round(nutrition.sugar)}g)`);
                } else if (pct > 40) {
                    score -= 15;
                    reasons.push(`High sugar (${Math.round(nutrition.sugar)}g)`);
                }
            }

            // Potassium
            const maxK = limits.nutrients['K']?.max;
            if (maxK && nutrition.potassium > 0) { // Using generic check, assume mapping
                const pct = (nutrition.potassium / maxK) * 100;
                if (pct > 75) { score -= 30; reasons.push('High potassium'); }
            }

            // Check Phosphorus if available
            const maxP = limits.nutrients['P']?.max;
            if (maxP && nutrition.phosphorus > 0) {
                const pct = (nutrition.phosphorus / maxP) * 100;
                if (pct > 75) { score -= 30; reasons.push('High phosphorus'); }
            }
        }

        // Determine Final Status
        if (score <= 50) color = 'Red';
        else if (score < 85) color = 'Yellow'; // < 85 is caution

        // If no specific reasons but score is high, generic message
        let reasoning = reasons.join('. ');
        if (!reasoning) {
            reasoning = 'Fits within your nutrition limits.';
        }

        return {
            score: Math.max(0, score),
            color,
            reasoning,
        };
    }
}

export const foodService = new FoodService();
