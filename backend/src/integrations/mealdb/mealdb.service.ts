/**
 * TheMealDB API Integration Service
 * Provides access to meal recipes, categories, and filtering options
 */

export interface MealCategory {
    idCategory: string;
    strCategory: string;
    strCategoryThumb: string;
    strCategoryDescription: string;
}

export interface MealArea {
    strArea: string;
}

export interface MealIngredient {
    idIngredient: string;
    strIngredient: string;
    strDescription: string | null;
    strType: string | null;
}

export interface Meal {
    idMeal: string;
    strMeal: string;
    strCategory?: string;
    strArea?: string;
    strInstructions?: string;
    strMealThumb?: string;
    strTags?: string;
    strYoutube?: string;
    strSource?: string;
    [key: string]: string | undefined;
}

interface CategoriesResponse {
    categories: MealCategory[];
}

interface AreasResponse {
    meals: MealArea[];
}

interface IngredientsResponse {
    meals: MealIngredient[];
}

interface MealsResponse {
    meals: Meal[] | null;
}

class MealDBService {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor() {
        // Use environment variable or fallback to the test API key
        this.apiKey = process.env.MEALDB_API_KEY || '1'; // '1' is the test API key
        this.baseUrl = `https://www.themealdb.com/api/json/v2/${this.apiKey}`;
    }

    /**
     * Make a request to TheMealDB API
     */
    private async request<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}/${endpoint}`);

        if (!response.ok) {
            throw new Error(`MealDB request failed: ${response.status}`);
        }

        return await response.json() as T;
    }

    /**
     * Get all meal categories
     */
    async getCategories(): Promise<CategoriesResponse> {
        try {
            return await this.request<CategoriesResponse>('categories.php');
        } catch (error) {
            console.error('[MealDB] Failed to get categories:', error);
            return { categories: [] };
        }
    }

    /**
     * Get all meal areas/cuisines (Italian, American, etc.)
     */
    async getAreas(): Promise<AreasResponse> {
        try {
            return await this.request<AreasResponse>('list.php?a=list');
        } catch (error) {
            console.error('[MealDB] Failed to get areas:', error);
            return { meals: [] };
        }
    }

    /**
     * Get all available ingredients
     */
    async getIngredients(): Promise<IngredientsResponse> {
        try {
            return await this.request<IngredientsResponse>('list.php?i=list');
        } catch (error) {
            console.error('[MealDB] Failed to get ingredients:', error);
            return { meals: [] };
        }
    }

    /**
     * Search meals by name
     */
    async searchMealByName(name: string): Promise<MealsResponse> {
        try {
            return await this.request<MealsResponse>(`search.php?s=${encodeURIComponent(name)}`);
        } catch (error) {
            console.error(`[MealDB] Search failed for "${name}":`, error);
            return { meals: null };
        }
    }

    /**
     * Get a specific meal by its ID
     */
    async getMealById(id: string): Promise<MealsResponse> {
        try {
            return await this.request<MealsResponse>(`lookup.php?i=${id}`);
        } catch (error) {
            console.error(`[MealDB] Lookup failed for ID ${id}:`, error);
            return { meals: null };
        }
    }

    /**
     * Get a random meal
     */
    async getRandomMeal(): Promise<MealsResponse> {
        try {
            return await this.request<MealsResponse>('random.php');
        } catch (error) {
            console.error('[MealDB] Random meal failed:', error);
            return { meals: null };
        }
    }

    /**
     * Get a random selection of meals (10 meals)
     */
    async getRandomSelection(): Promise<MealsResponse> {
        try {
            return await this.request<MealsResponse>('randomselection.php');
        } catch (error) {
            console.error('[MealDB] Random selection failed:', error);
            return { meals: null };
        }
    }

    /**
     * Filter meals by ingredient
     */
    async filterByIngredient(ingredient: string): Promise<MealsResponse> {
        try {
            return await this.request<MealsResponse>(`filter.php?i=${encodeURIComponent(ingredient)}`);
        } catch (error) {
            console.error(`[MealDB] Filter by ingredient "${ingredient}" failed:`, error);
            return { meals: null };
        }
    }

    /**
     * Filter meals by category
     */
    async filterByCategory(category: string): Promise<MealsResponse> {
        try {
            return await this.request<MealsResponse>(`filter.php?c=${encodeURIComponent(category)}`);
        } catch (error) {
            console.error(`[MealDB] Filter by category "${category}" failed:`, error);
            return { meals: null };
        }
    }

    /**
     * Filter meals by area/cuisine
     */
    async filterByArea(area: string): Promise<MealsResponse> {
        try {
            return await this.request<MealsResponse>(`filter.php?a=${encodeURIComponent(area)}`);
        } catch (error) {
            console.error(`[MealDB] Filter by area "${area}" failed:`, error);
            return { meals: null };
        }
    }

    /**
     * Parse meal ingredients and measures from a meal object
     * MealDB stores ingredients as strIngredient1-20 and strMeasure1-20
     */
    parseMealIngredients(meal: Meal): Array<{ ingredient: string; measure: string }> {
        const ingredients: Array<{ ingredient: string; measure: string }> = [];

        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];

            if (ingredient && ingredient.trim()) {
                ingredients.push({
                    ingredient: ingredient.trim(),
                    measure: measure?.trim() || '',
                });
            }
        }

        return ingredients;
    }
}

// Export singleton instance
export const mealDBService = new MealDBService();
