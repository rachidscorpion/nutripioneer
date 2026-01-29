import prisma from '@/db/client';
import type { CreateRecipe, UpdateRecipe } from '@/schemas';
import { ApiError } from '@/types';
import { edamamService } from '@/integrations/edamam/edamam.service';
import { fatSecretService } from '@/integrations/fatsecret/fatsecret.service';

export class RecipesService {
    /**
     * Get all recipes with optional filtering and pagination
     */
    async getAll(options: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        tags?: string[];
    } = {}) {
        const { page = 1, limit = 20, search, category, tags } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
            ];
        }

        if (category) {
            where.category = category;
        }

        // Filter by tags (stored as JSON string)
        // This is a basic contains check - for production, consider a separate tags table
        if (tags && tags.length > 0) {
            where.AND = tags.map(tag => ({
                tags: { contains: tag },
            }));
        }

        const [recipes, total] = await Promise.all([
            prisma.recipe.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    image: true,
                    category: true,
                    prepTime: true,
                    calories: true,
                    protein: true,
                    carbs: true,
                    fat: true,
                    tags: true,
                },
            }),
            prisma.recipe.count({ where }),
        ]);

        // Parse tags JSON for response
        const parsedRecipes = recipes.map(r => ({
            ...r,
            tags: JSON.parse(r.tags) as string[],
        }));

        return {
            recipes: parsedRecipes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get recipe by ID with full details
     */
    async getById(id: string) {
        const recipe = await prisma.recipe.findUnique({
            where: { id },
        });

        if (!recipe) {
            throw new ApiError(404, 'Recipe not found');
        }

        return {
            ...recipe,
            tags: JSON.parse(recipe.tags) as string[],
            ingredients: JSON.parse(recipe.ingredients) as { item: string; measure: string; meta?: string }[],
        };
    }

    /**
     * Get recipe by external ID (e.g., MealDB ID)
     */
    async getByExternalId(externalId: string) {
        const recipe = await prisma.recipe.findUnique({
            where: { externalId },
        });

        if (!recipe) {
            return null;
        }

        return {
            ...recipe,
            tags: JSON.parse(recipe.tags) as string[],
            ingredients: JSON.parse(recipe.ingredients) as { item: string; measure: string }[],
        };
    }

    /**
     * Create a new recipe
     */
    async create(data: CreateRecipe) {
        // Check for duplicate external ID if provided
        if (data.externalId) {
            const existing = await prisma.recipe.findUnique({
                where: { externalId: data.externalId },
            });
            if (existing) {
                throw new ApiError(400, 'Recipe with this external ID already exists');
            }
        }

        return prisma.recipe.create({
            data: {
                ...data,
                tags: JSON.stringify(data.tags),
                ingredients: JSON.stringify(data.ingredients),
            },
        });
    }

    /**
     * Update recipe by ID
     */
    async update(id: string, data: UpdateRecipe) {
        const existing = await prisma.recipe.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Recipe not found');
        }

        const updateData: Record<string, unknown> = { ...data };
        if (data.tags) {
            updateData.tags = JSON.stringify(data.tags);
        }
        if (data.ingredients) {
            updateData.ingredients = JSON.stringify(data.ingredients);
        }

        return prisma.recipe.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Delete recipe by ID
     */
    async delete(id: string) {
        const existing = await prisma.recipe.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Recipe not found');
        }

        await prisma.recipe.delete({
            where: { id },
        });

        return { deleted: true };
    }

    /**
     * Get all unique categories
     */
    async getCategories() {
        const recipes = await prisma.recipe.findMany({
            where: { category: { not: null } },
            select: { category: true },
            distinct: ['category'],
        });

        return recipes.map(r => r.category).filter(Boolean);
    }
    /**
     * Delete all recipes
     */
    async deleteAll() {
        await prisma.recipe.deleteMany({});
        return { success: true };
    }

    /**
     * Regenerate all recipes
     */
    async regenerateAll() {
        const mockUser = {
            onboardingData: {},
            nutritionLimits: {}
        };

        const results = [];
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'] as const;

        for (const mealType of mealTypes) {
            // Generate multiple recipes for each meal type to populate the DB
            for (let i = 0; i < 5; i++) {
                try {
                    const recipe = await this.findOrCreateFromEdamam(mockUser, mealType);
                    if (recipe) {
                        results.push(recipe);
                    }
                } catch (error) {
                    console.error(`Failed to generate ${mealType} recipe:`, error);
                }
            }
        }

        return { count: results.length, recipes: results };
    }

    /**
     * Helper to find or create a recipe from FatSecret result
     */
    async findOrCreateFromFatSecret(user: any, mealType: 'Breakfast' | 'Lunch' | 'Dinner', excludeExternalId?: string) {
        try {
            // 1. Calculate limits
            const mealsPerDay = 4;
            let limits: any = {};
            try {
                if (user.nutritionLimits) {
                    limits = typeof user.nutritionLimits === 'string'
                        ? JSON.parse(user.nutritionLimits)
                        : user.nutritionLimits;
                }
            } catch (e) {
                console.error('Error parsing nutrition limits', e);
            }

            // Map Nutrients to Percentages (approximate)
            // Default 2000 kcal diet if no limits
            const dailyCalories = limits.daily_calories?.max || 2000;
            const mealCalories = Math.round(dailyCalories / mealsPerDay);

            // Define calorie range
            const calorieRange = {
                min: limits.daily_calories?.min ? Math.round(limits.daily_calories.min / mealsPerDay) : Math.round(mealCalories * 0.7),
                max: Math.round(mealCalories * 1.3)
            };

            // Map mealType to FatSecret recipe types
            let recipeTypes: string[] = [];
            if (mealType === 'Breakfast') recipeTypes = ['Breakfast'];
            else recipeTypes = ['Main Dish']; // Use Main Dish for Lunch/Dinner

            // Search Options
            const opts: any = {
                page: Math.floor(Math.random() * 3), // Randomize page (0-2)
                maxResults: 20,
                calories: calorieRange,
                recipeTypes: recipeTypes,
                mustHaveImages: true,
            };

            // Simple Percentage Estimations if limits exist
            if (limits.nutrients) {
                if (limits.nutrients.PROCNT?.min) {
                    const dailyProteinMin = limits.nutrients.PROCNT.min;
                    // Fix: Compare daily minimum (divided by meals) to MEAL calories
                    // Math: ((DailyProteinMin / MealsPerDay) * 4 cal/g) / MealCalories
                    const proteinCalories = (dailyProteinMin / mealsPerDay) * 3;
                    const pct = Math.round((proteinCalories / mealCalories) * 100);

                    if (pct > 5 && pct < 100) opts.proteinPercentage = { min: pct };
                }
            }

            // Call FatSecret
            console.log(`Searching FatSecret for ${mealType}...`, JSON.stringify(opts));
            const searchResult = await fatSecretService.searchNutrientLimitedRecipes(opts);

            let hits = searchResult?.recipes?.recipe || [];
            console.log(`FatSecret returned ${hits.length} hits for ${mealType}`);

            // Filter
            if (excludeExternalId) {
                hits = hits.filter((h: any) => h.recipe_id !== excludeExternalId);
            }

            if (hits.length === 0) return null;

            // Pick Random
            const randomIndex = Math.floor(Math.random() * hits.length);
            const hitSummary = hits[randomIndex];

            // Get Full Details
            if (!hitSummary) return null;
            const fullRecipe = await fatSecretService.getRecipeDetails(hitSummary.recipe_id);
            if (!fullRecipe) return null;

            // Check local
            const externalId = fullRecipe.recipe_id;
            const existingRecipe = await prisma.recipe.findUnique({
                where: { externalId },
            });
            if (existingRecipe) return existingRecipe;

            // Parse Ingredients
            const ingredients = (fullRecipe.ingredients?.ingredient || []).map((ing: any) => ({
                item: ing.food_name + (ing.measurement_description ? ` (${ing.measurement_description})` : ''),
                measure: 'serving',
                meta: ing.description
            }));

            // Extract Nutrients
            // Handle union type (single object or array)
            let serving: any = {};
            if (fullRecipe.serving_sizes?.serving) {
                if (Array.isArray(fullRecipe.serving_sizes.serving)) {
                    serving = fullRecipe.serving_sizes.serving[0];
                } else {
                    serving = fullRecipe.serving_sizes.serving;
                }
            }
            const nut = serving || {};

            // Helper
            const getN = (key: string) => Math.round(Number(nut[key] || 0));

            // Handle Image (string or array)
            let image: any = '';
            if (fullRecipe.recipe_images?.recipe_image) {
                if (Array.isArray(fullRecipe.recipe_images.recipe_image)) {
                    image = fullRecipe.recipe_images.recipe_image[0] || '';
                } else {
                    image = fullRecipe.recipe_images.recipe_image;
                }
            }

            return await prisma.recipe.upsert({
                where: { externalId },
                update: {
                    name: fullRecipe.recipe_name,
                    description: fullRecipe.recipe_description || `Source: FatSecret`,
                    instructions: fullRecipe.directions?.direction?.map((d: any) => d.direction_description).join('\n') || '',
                    image: image || null,
                    category: mealType,
                    prepTime: Number(fullRecipe.preparation_time_min) || 30,
                    calories: getN('calories'),
                    protein: getN('protein'),
                    carbs: getN('carbohydrate'),
                    fat: getN('fat'),
                    sodium: getN('sodium'),
                    sugar: getN('sugar'),
                    fiber: getN('fiber'),
                    tags: JSON.stringify(['FatSecret', mealType]),
                    ingredients: JSON.stringify(ingredients),
                    externalId: externalId,
                    sourceAPI: 'FatSecret'
                },
                create: {
                    name: fullRecipe.recipe_name,
                    description: fullRecipe.recipe_description || `Source: FatSecret`,
                    instructions: fullRecipe.directions?.direction?.map((d: any) => d.direction_description).join('\n') || '',
                    image: image || null,
                    category: mealType,
                    prepTime: Number(fullRecipe.preparation_time_min) || 30,
                    calories: getN('calories'),
                    protein: getN('protein'),
                    carbs: getN('carbohydrate'),
                    fat: getN('fat'),
                    sodium: getN('sodium'),
                    sugar: getN('sugar'),
                    fiber: getN('fiber'),
                    tags: JSON.stringify(['FatSecret', mealType]),
                    ingredients: JSON.stringify(ingredients),
                    externalId: externalId,
                    sourceAPI: 'FatSecret'
                }
            });

        } catch (error) {
            console.error(`Error fetching ${mealType} from FatSecret:`, error);
            return null;
        }
    }

    /**
     * Helper to find or create a recipe from Edamam result
     * Adapted from PlansService
     */
    async findOrCreateFromEdamam(user: any, mealType: 'Breakfast' | 'Lunch' | 'Dinner', excludeExternalId?: string) {
        try {
            // Call Edamam
            let searchResult;
            try {
                searchResult = await edamamService.searchRecipes(user, {
                    mealType,
                    random: true,
                });
            } catch (err) {
                console.warn(`Initial Edamam search failed for ${mealType}: ${err instanceof Error ? err.message : String(err)}`);
                console.log('Retrying without cuisine preferences...');
                searchResult = await edamamService.searchRecipes(user, {
                    mealType,
                    random: true,
                    ignoreCuisines: true
                });
            }

            console.log(`Edamam returned ${searchResult?.hits?.length || 0} hits for ${mealType}`);

            if ((!searchResult?.hits || searchResult.hits.length === 0)) {
                console.log(`Edamam returned 0 hits for ${mealType}. Retrying without cuisine preferences...`);
                searchResult = await edamamService.searchRecipes(user, {
                    mealType,
                    random: true,
                    ignoreCuisines: true
                });
                console.log(`Edamam retry returned ${searchResult?.hits?.length || 0} hits for ${mealType}`);
            }

            let hits = searchResult?.hits || [];

            // Filter out excluded recipe
            if (excludeExternalId) {
                hits = hits.filter(h => {
                    const uri = h?.recipe?.uri;
                    if (!uri) return false;
                    const extId = uri.split('#recipe_')[1] || uri;
                    return extId !== excludeExternalId;
                });
            }

            // Filter out unwanted sources (e.g. recipeofhealth.com)
            hits = hits.filter(h => {
                const url = h?.recipe?.url;
                return !url?.includes('recipeofhealth.com');
            });

            if (hits.length > 0) {
                // Pick a random hit from the results
                const randomIndex = Math.floor(Math.random() * hits.length);
                const hitWrapper = hits[randomIndex];

                if (!hitWrapper || !hitWrapper.recipe) {
                    console.error('Hit or recipe is missing');
                    return null;
                }

                const hit = hitWrapper.recipe;
                console.log(`Selected hit index ${randomIndex}: ${hit.label}`);

                const externalId = hit.uri.split('#recipe_')[1] || hit.uri;

                // Check if we have it locally
                const existingRecipe = await prisma.recipe.findUnique({
                    where: { externalId },
                });

                if (existingRecipe) {
                    return existingRecipe;
                }

                // Map Edamam Recipe to our Schema

                // Extract nutrients
                const getNutrient = (code: string) => hit.totalNutrients?.[code]?.quantity || 0;

                const ingredients = (hit.ingredientLines || []).map((line: string) => ({
                    item: line,
                    measure: 'serving'
                }));

                return await prisma.recipe.upsert({
                    where: { externalId },
                    update: {
                        name: hit.label,
                        description: `Source: ${hit.source}`,
                        instructions: hit.url,
                        image: hit.image,
                        category: mealType,
                        prepTime: hit.totalTime || 30, // Default to 30 if 0
                        calories: Math.round(hit.calories / hit.yield), // Per serving
                        protein: Math.round(getNutrient('PROCNT') / hit.yield),
                        carbs: Math.round(getNutrient('CHOCDF') / hit.yield),
                        fat: Math.round(getNutrient('FAT') / hit.yield),
                        sodium: Math.round(getNutrient('NA') / hit.yield),
                        sugar: Math.round(getNutrient('SUGAR') / hit.yield),
                        fiber: Math.round(getNutrient('FIBTG') / hit.yield),
                        tags: JSON.stringify((hit.healthLabels || []).concat(hit.dietLabels || [])),
                        ingredients: JSON.stringify(ingredients),
                        externalId: externalId,
                        sourceAPI: 'Edamam'
                    },
                    create: {
                        name: hit.label,
                        description: `Source: ${hit.source}`,
                        instructions: hit.url,
                        image: hit.image,
                        category: mealType,
                        prepTime: hit.totalTime || 30, // Default to 30 if 0
                        calories: Math.round(hit.calories / hit.yield), // Per serving
                        protein: Math.round(getNutrient('PROCNT') / hit.yield),
                        carbs: Math.round(getNutrient('CHOCDF') / hit.yield),
                        fat: Math.round(getNutrient('FAT') / hit.yield),
                        sodium: Math.round(getNutrient('NA') / hit.yield),
                        sugar: Math.round(getNutrient('SUGAR') / hit.yield),
                        fiber: Math.round(getNutrient('FIBTG') / hit.yield),
                        tags: JSON.stringify((hit.healthLabels || []).concat(hit.dietLabels || [])),
                        ingredients: JSON.stringify(ingredients),
                        externalId: externalId,
                        sourceAPI: 'Edamam'
                    }
                });
            } else {
                console.log('No hits remaining after filtering');
                // Fall through to local fallback
            }
        } catch (error) {
            console.error(`Error fetching ${mealType} from Edamam:`, error);
        }

        console.log('Falling back to local random recipe');
        // Fallback: Local Random
        const count = await prisma.recipe.count({
            where: { tags: { contains: mealType } }
        });

        let recipes;
        if (count > 0) {
            const skip = Math.floor(Math.random() * count);
            recipes = await prisma.recipe.findMany({
                where: { tags: { contains: mealType } },
                take: 1,
                skip
            });
        } else {
            // No tagged recipes, random from all
            const total = await prisma.recipe.count();
            const skip = Math.floor(Math.random() * total);
            recipes = await prisma.recipe.findMany({ take: 1, skip });
        }

        return recipes[0] || null;
    }
}

export const recipesService = new RecipesService();
