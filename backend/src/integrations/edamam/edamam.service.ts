
/**
 * Edamam Food Database API Integration Service
 * Provides access to food search, nutrition analysis, and autocomplete.
 */

export interface EdamamFood {
    foodId: string;
    label: string;
    knownAs: string;
    nutrients: {
        ENERC_KCAL: number;
        PROCNT: number;
        FAT: number;
        CHOCDF: number;
        FIBTG: number;
        [key: string]: number;
    };
    category: string;
    categoryLabel: string;
    image?: string;
    brand?: string;
    servingSizes?: Array<{
        uri: string;
        label: string;
        quantity: number;
    }>;
}

export interface EdamamMeasure {
    uri: string;
    label: string;
    weight: number;
}

export interface EdamamHint {
    food: EdamamFood;
    measures: EdamamMeasure[];
}

export interface EdamamParseResponse {
    text: string;
    parsed: Array<{
        food: EdamamFood;
        quantity: number;
        measure: EdamamMeasure;
    }>;
    hints: EdamamHint[];
    _links?: {
        next?: {
            title: string;
            href: string;
        };
    };
}

export interface EdamamNutrientsRequest {
    ingredients: Array<{
        quantity: number;
        measureURI: string;
        foodId: string;
    }>;
}

export interface EdamamNutrientsResponse {
    uri: string;
    calories: number;
    totalWeight: number;
    dietLabels: string[];
    healthLabels: string[];
    cautions: string[];
    totalNutrients: Record<string, { label: string; quantity: number; unit: string }>;
    totalDaily: Record<string, { label: string; quantity: number; unit: string }>;
    ingredients?: Array<{
        parsed?: Array<{
            quantity: number;
            measure: string;
            food: string;

            foodId: string;
            weight: number;
            retainedWeight: number;
            nutrientInfo: any;
            measureURI: string;
            status: string;
        }>;
    }>;
}

export interface EdamamRecipe {
    uri: string;
    label: string;
    image: string;
    source: string;
    url: string;
    yield: number;
    dietLabels: string[];
    healthLabels: string[];
    cautions: string[];
    ingredientLines: string[];
    ingredients: any[];
    calories: number;
    totalWeight: number;
    totalTime: number;
    cuisineType: string[];
    mealType: string[];
    dishType: string[];
    totalNutrients: any;
    totalDaily: any;
    digest: any[];
}

export interface EdamamRecipeResponse {
    from: number;
    to: number;
    count: number;
    _links: any;
    hits: Array<{
        recipe: EdamamRecipe;
        _links: any;
    }>;
}

export interface EdamamShoppingListRequest {
    entries: Array<{
        item: string; // Recipe URI
        quantity: number;
        measure?: string; // Optional, default is per recipe yield if omitted, or 'http://www.edamam.com/ontologies/edamam.owl#Measure_serving'
    }>;
}

export interface EdamamShoppingListResponse {
    entries: Array<{
        foodId: string;
        food: string;
        quantities: Array<{
            quantity: number;
            measure: string;
            weight: number;
        }>;
    }>;
}

export interface EdamamMealPlanRequest {
    size: number;
    plan: {
        accept: {
            all: Array<{
                health?: string[];
                dish?: string[];
                meal?: string[];
            }>;
        };
        fit?: {
            ENERC_KCAL?: { min?: number; max?: number };
            [key: string]: any;
        };
        sections?: Record<string, {
            accept?: {
                all: Array<{
                    dish?: string[];
                    meal?: string[];
                }>;
            };
            fit?: {
                ENERC_KCAL?: { min?: number; max?: number };
                [key: string]: any;
            };
        }>;
    };
}

export interface EdamamMealPlanResponse {
    status: string;
    selection: Array<{
        sections: Record<string, {
            assigned: string; // Recipe URI
            _links?: {
                recipe: {
                    title: string;
                    href: string;
                }
            }
        }>;
    }>;
}

export interface RecipeSearchOptions {
    mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    random?: boolean;
}

class EdamamService {
    private readonly mealPlannerAppId: string;
    private readonly mealPlannerAppKey: string;
    private readonly mealPlannerBaseUrl: string;
    private readonly foodDatabaseAppId: string;
    private readonly foodDatabaseAppKey: string;
    private readonly foodDatabaseBaseUrl: string;

    constructor() {
        this.mealPlannerAppId = 'de58ebc2';
        this.mealPlannerAppKey = 'cefbcac30abb3b358ca61db3b53cd87d';
        this.mealPlannerBaseUrl = 'https://api.edamam.com';
        this.foodDatabaseAppId = 'f07eb1e0';
        this.foodDatabaseAppKey = '3d102f0ec17499a25351c6f08d424474';
        this.foodDatabaseBaseUrl = 'https://api.edamam.com';
    }

    /**
     * Make a request to Edamam API
     */
    private async request<T>(
        endpoint: string,
        params: Record<string, string | number> = {},
        method: 'GET' | 'POST' = 'GET',
        body?: any,
        apiType: 'food' | 'meal' = 'food',
        userId: string = 'nutripioneer_user'
    ): Promise<T> {
        // Correct endpoint construction: baseUrl + endpoint
        const baseUrl = apiType === 'meal' ? this.mealPlannerBaseUrl : this.foodDatabaseBaseUrl;
        const appId = apiType === 'meal' ? this.mealPlannerAppId : this.foodDatabaseAppId;
        const appKey = apiType === 'meal' ? this.mealPlannerAppKey : this.foodDatabaseAppKey;

        const url = new URL(`${baseUrl}${endpoint}`);

        // Meal Planner API usually passes credentials in the URL query params too,
        // similar to Food API.
        url.searchParams.append('app_id', appId);
        url.searchParams.append('app_key', appKey);

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        }


        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (apiType === 'meal') {
            options.headers = {
                ...options.headers,
                'Edamam-Account-User': userId
            };
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Edamam request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json() as T;
    }

    /**
     * Search for food (Parser API)
     * Handles text search for foods as well as filters
     */
    async searchFood(query: string, limit: number = 20): Promise<EdamamParseResponse> {
        return await this.request<EdamamParseResponse>('/api/food-database/v2/parser', {
            ingr: query
        }, 'GET', undefined, 'food');
    }

    /**
     * Get nutrients for specific food quantities (Nutrients API)
     */
    async getNutrients(request: EdamamNutrientsRequest): Promise<EdamamNutrientsResponse> {
        return await this.request<EdamamNutrientsResponse>('/api/food-database/v2/nutrients', {}, 'POST', request, 'food');
    }

    /**
     * Autocomplete for food search
     */
    async autocomplete(query: string, limit: number = 10): Promise<string[]> {
        return await this.request<string[]>('/auto-complete', {
            q: query,
            limit
        }, 'GET', undefined, 'food');
    }


    /**
     * Generate a Meal Plan
     * @param request The meal plan criteria
     * @param userId The user ID for Edamam tracking
     */

    async generateMealPlan(request: EdamamMealPlanRequest, userId: string = 'test_user'): Promise<EdamamMealPlanResponse> {
        // Endpoint structure: /api/meal-planner/v1/{app_id}/select
        const endpoint = `/api/meal-planner/v1/${this.mealPlannerAppId}/select`;
        return await this.request<EdamamMealPlanResponse>(endpoint, {}, 'POST', request, 'meal', userId);
    }

    /**
     * Get Recipe by URI
     * @param uri The recipe URI (e.g. http://www.edamam.com/ontologies/edamam.owl#recipe_...)
     */
    async getRecipeByUri(uri: string): Promise<EdamamRecipe | undefined> {

        const response = await this.request<EdamamRecipeResponse>('/api/recipes/v2/by-uri', {
            type: 'public',
            uri: uri
        }, 'GET', undefined, 'meal');


        if (response?.hits?.length > 0) {
            return response.hits[0]?.recipe;
        }


        throw new Error('Recipe not found for URI: ' + uri);
    }

    /**
     * Generate Shopping List
     * @param request The shopping list items (recipes and quantities)
     * @param userId The user ID for Edamam tracking
     */
    async generateShoppingList(request: EdamamShoppingListRequest, userId: string = 'test_user'): Promise<EdamamShoppingListResponse> {
        return await this.request<EdamamShoppingListResponse>('/api/shopping-list/v2', {}, 'POST', request, 'meal', userId);
    }

    /**
     * Search for recipes based on user profile and criteria
     */
    async searchRecipes(userProfile: any, options: RecipeSearchOptions = {}) {
        // 1. Determine the divider for daily limits (Default to 3 meals if not specified)
        const mealsPerDay = 5;

        // 2. Base Params - let request() handle app_id/app_key
        const params = new URLSearchParams({
            type: 'public',
        });

        // 3. Map Cuisines (favCuisines)
        try {
            const onboarding = typeof userProfile.onboardingData === 'string'
                ? JSON.parse(userProfile.onboardingData)
                : userProfile.onboardingData;

            if (onboarding?.dietary?.favCuisines?.length > 0) {
                // Strategy: Search for all favorite cuisines
                onboarding.dietary.favCuisines.forEach((c: string) => {
                    params.append('cuisineType', c);
                });
            }
        } catch (e) {
            console.error('Error parsing onboarding data', e);
        }

        // 4. Map Nutrients (CRITICAL STEP)
        try {
            const limits = typeof userProfile.nutritionLimits === 'string'
                ? JSON.parse(userProfile.nutritionLimits)
                : userProfile.nutritionLimits;

            if (limits && limits.nutrients) {
                const nutrients = limits.nutrients;

                // Helper to add range if it exists
                const addNutrient = (code: string, min: number | undefined, max: number | undefined) => {
                    let val = '';
                    // We allow a buffer (e.g. 10%) or strict division. Here we do strict / 3.
                    const mealMin = min ? Math.round(min / mealsPerDay) : '';
                    const mealMax = max ? Math.round(max / mealsPerDay) : '';

                    if (mealMin && mealMax) val = `${mealMin}-${mealMax}`;
                    else if (mealMin) val = `${mealMin}+`;
                    else if (mealMax) val = `${mealMax}`;

                    if (val) params.append(`nutrients[${code}]`, val);
                };

                // Map the specific keys from your profile to Edamam codes
                if (nutrients.NA) addNutrient('NA', 0, nutrients.NA.max); // Sodium
                if (nutrients.PROCNT) addNutrient('PROCNT', nutrients.PROCNT.min, nutrients.PROCNT.max); // Protein
                if (nutrients.CHOCDF) addNutrient('CHOCDF', nutrients.CHOCDF.min, nutrients.CHOCDF.max); // Carbs
                if (nutrients.SUGAR) addNutrient('SUGAR', 0, nutrients.SUGAR.max); // Sugar
                if (nutrients.FIBTG) addNutrient('FIBTG', nutrients.FIBTG.min, undefined); // Fiber

                // Calories
                if (limits.daily_calories) {
                    addNutrient('ENERC_KCAL', limits.daily_calories.min, limits.daily_calories.max);
                }
            }
        } catch (e) {
            console.error('Error parsing nutrition limits', e);
        }

        // 5. Health Labels & Exclusions
        // Force alcohol-free due to Tylenol/Liver warning in profile
        params.append('health', 'alcohol-free');

        // 6. Meal Type
        if (options.mealType) {
            params.append('mealType', options.mealType);
        }

        if (options.random) {
            params.append('random', 'true');
            // Request more candidates for better randomness/variety
            params.append('to', '50');
        } else {
            // Defaults if not random, or allow override
            params.append('to', '20');
        }

        // Execute Request
        const endpoint = `/api/recipes/v2?${params.toString()}`;

        // Using your existing request wrapper
        // Note: we pass empty params object because we constructed the query string manually in endpoint
        return await this.request<EdamamRecipeResponse>(endpoint, {}, 'GET', undefined, 'meal');
    }
}

export const edamamService = new EdamamService();
