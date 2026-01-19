/**
 * FatSecret API Integration Service
 * Provides OAuth2 authenticated access to FatSecret's food and recipe database
 */

export interface SearchResult<T> {
    page_number: number;
    max_results: number;
    total_results: number;
    results: T[];
}

export interface FatSecretFood {
    food_id: string;
    food_name: string;
    food_type: string;
    food_description?: string;
    brand_name?: string;
    food_images?: { food_image: { image_url: string }[] | { image_url: string } };
    [key: string]: unknown;
}

export interface FatSecretRecipe {
    recipe_id: string;
    recipe_name: string;
    recipe_description?: string;
    recipe_images?: { recipe_image: string | string[] };
    ingredients?: { ingredient: { food_name: string; measurement_description: string; description?: string }[] };
    serving_sizes?: { serving: Record<string, any> | Record<string, any>[] };
    directions?: { direction: { direction_description: string }[] };
    preparation_time_min?: string | number;
    [key: string]: unknown;
}

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

class FatSecretService {
    private token: string | null = null;
    private tokenExpiry: number | null = null;

    private readonly baseUrl = 'https://platform.fatsecret.com/rest';
    private readonly tokenUrl = 'https://oauth.fatsecret.com/connect/token';

    private get clientId(): string {
        return process.env.FATSECRET_CLIENT_ID || '';
    }

    private get clientSecret(): string {
        return process.env.FATSECRET_CLIENT_SECRET || '';
    }

    /**
     * Get OAuth2 access token, refreshing if needed
     */
    private async getAuthToken(): Promise<string> {
        // Return cached token if still valid
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        if (!this.clientId || !this.clientSecret) {
            console.warn('[FatSecret] Missing credentials (FATSECRET_CLIENT_ID/SECRET)');
            return '';
        }

        try {
            const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials&scope=premier',
            });

            if (!response.ok) {
                throw new Error(`Token request failed: ${response.status}`);
            }

            const data = await response.json() as TokenResponse;
            this.token = data.access_token;
            // Expire 1 minute early to avoid edge cases
            this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

            return this.token;
        } catch (error) {
            console.error('[FatSecret] Failed to get token:', error);
            return '';
        }
    }

    /**
     * Make an authenticated request to FatSecret API
     */
    private async request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
        try {
            const token = await this.getAuthToken();
            if (!token) return null;

            const url = new URL(`${this.baseUrl}${endpoint}`);
            Object.entries({ ...params, format: 'json' }).forEach(([key, value]) => {
                url.searchParams.set(key, String(value));
            });

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            return await response.json() as T;
        } catch (error) {
            console.error(`[FatSecret] Request to ${endpoint} failed:`, error);
            return null;
        }
    }

    /**
     * Search for foods in the FatSecret database
     */
    async searchFoods(query: string, page = 0, maxResults = 20, foodType?: 'Brand' | 'Generic'): Promise<SearchResult<FatSecretFood>> {
        const emptyResult: SearchResult<FatSecretFood> = {
            page_number: 0,
            max_results: maxResults,
            total_results: 0,
            results: [],
        };

        try {
            const params: Record<string, string | number> = {
                search_expression: query,
                page_number: page,
                max_results: maxResults,
            };

            if (foodType) {
                params.food_type = foodType;
            }

            const data = await this.request<{ foods_search?: Record<string, unknown>; foods?: Record<string, unknown> }>(
                '/foods/search/v4',
                params
            );

            if (!data) return emptyResult;

            const searchData = data.foods_search || data.foods;
            if (!searchData) return emptyResult;

            // Handle the nested FatSecret response structure
            type SearchDataShape = {
                results?: { food?: FatSecretFood | FatSecretFood[] };
                food?: FatSecretFood | FatSecretFood[];
                page_number?: string | number;
                max_results?: string | number;
                total_results?: string | number;
            };
            const typedData = searchData as SearchDataShape;

            const rawList = typedData.results?.food || typedData.food;
            const foods = rawList ? (Array.isArray(rawList) ? rawList : [rawList]) : [];

            return {
                page_number: parseInt(String(typedData.page_number)) || 0,
                max_results: parseInt(String(typedData.max_results)) || maxResults,
                total_results: parseInt(String(typedData.total_results)) || 0,
                results: foods as FatSecretFood[],
            };
        } catch (error) {
            console.error(`[FatSecret] Search foods failed for "${query}":`, error);
            return emptyResult;
        }
    }

    /**
     * Get detailed information about a specific food item
     */
    async getFoodDetails(foodId: string): Promise<Record<string, unknown> | null> {
        try {
            return await this.request<Record<string, unknown>>('/food/v5', {
                food_id: foodId,
                include_sub_categories: 'true',
            });
        } catch (error) {
            console.error(`[FatSecret] Get food details failed for ${foodId}:`, error);
            return null;
        }
    }


    /**
     * Search recipes with granular nutrient and type filtering (V3)
     */
    async searchNutrientLimitedRecipes(options: {
        query?: string;
        page?: number;
        maxResults?: number;
        calories?: { min?: number; max?: number };
        carbsPercentage?: { min?: number; max?: number };
        proteinPercentage?: { min?: number; max?: number };
        fatPercentage?: { min?: number; max?: number };
        recipeTypes?: string[];
        mustHaveImages?: boolean;
    }) {
        try {
            const params: Record<string, string | number> = {
                page_number: options.page || 0,
                max_results: options.maxResults || 20,
            };

            if (options.query) params.search_expression = options.query;
            if (options.mustHaveImages) params.must_have_images = 'true';

            // Nutrient Filters
            if (options.calories?.min) params['calories.from'] = options.calories.min;
            if (options.calories?.max) params['calories.to'] = options.calories.max;

            if (options.carbsPercentage?.min) params['carb_percentage.from'] = options.carbsPercentage.min;
            if (options.carbsPercentage?.max) params['carb_percentage.to'] = options.carbsPercentage.max;

            if (options.proteinPercentage?.min) params['protein_percentage.from'] = options.proteinPercentage.min;
            if (options.proteinPercentage?.max) params['protein_percentage.to'] = options.proteinPercentage.max;

            if (options.fatPercentage?.min) params['fat_percentage.from'] = options.fatPercentage.min;
            if (options.fatPercentage?.max) params['fat_percentage.to'] = options.fatPercentage.max;

            // Recipe Types
            if (options.recipeTypes && options.recipeTypes.length > 0) {
                params.recipe_types = options.recipeTypes.join(',');
                // recipe_types_matchall defaults to false (match any), which is usually good
            }

            const data = await this.request<{ recipes: { recipe: FatSecretRecipe[] } }>(
                '/recipes/search/v3',
                params
            );

            return data || { recipes: { recipe: [] } };
        } catch (error) {
            console.error(`[FatSecret] Search nutrient recipes failed:`, error);
            return { recipes: { recipe: [] } };
        }
    }

    /**
     * Search for recipes in the FatSecret database
     */
    async searchRecipes(query: string, page = 0, maxResults = 20): Promise<{ recipes: { recipe: FatSecretRecipe[] } }> {
        try {
            const data = await this.request<{ recipes: { recipe: FatSecretRecipe[] } }>(
                '/recipes/search/v3',
                {
                    search_expression: query,
                    page_number: page,
                    max_results: maxResults,
                }
            );
            return data || { recipes: { recipe: [] } };
        } catch (error) {
            console.error(`[FatSecret] Search recipes failed for "${query}":`, error);
            return { recipes: { recipe: [] } };
        }
    }

    /**
     * Get detailed information about a specific recipe
     */
    async getRecipeDetails(recipeId: string): Promise<FatSecretRecipe | null> {
        try {
            const data = await this.request<{ recipe: FatSecretRecipe }>('/recipe/v2', {
                recipe_id: recipeId,
            });
            return data?.recipe || null;
        } catch (error) {
            console.error(`[FatSecret] Get recipe details failed for ${recipeId}:`, error);
            return null;
        }
    }
}

// Export singleton instance
export const fatSecretService = new FatSecretService();
