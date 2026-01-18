import axios from 'axios';

// --- Configuration ---
// Env vars are read lazily in getAuthToken
const BASE_URL = 'https://platform.fatsecret.com/rest';
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';

// --- Types ---

export interface FatSecretToken {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface FatSecretImage {
    image_url: string;
    image_type?: string;
}

// Minimal Shape for Food
export interface FatSecretFood {
    food_id: string;
    food_name: string;
    food_type: string;
    food_url?: string;
    brand_name?: string;
    food_description?: string; // Often contains "Per 100g - Calories: 123kcal | Fat: 2.00g..."
    food_images?: {
        food_image: FatSecretImage[];
    };
    servings?: {
        serving: FatSecretServing[];
    };
}

export interface FatSecretServing {
    serving_id: string;
    serving_description: string;
    serving_url?: string;
    metric_serving_amount?: string;
    metric_serving_unit?: string;
    number_of_units?: string;
    measurement_description?: string;
    calories?: string;
    carbohydrate?: string;
    protein?: string;
    fat?: string;
    satiated_fat?: string; // Note: FatSecret tends to use 'saturated_fat' usually, checking docs... let's map loosely
    saturated_fat?: string;
    polyunsaturated_fat?: string;
    monounsaturated_fat?: string;
    trans_fat?: string;
    cholesterol?: string;
    sodium?: string;
    potassium?: string;
    fiber?: string;
    sugar?: string;
    added_sugars?: string;
    vitamin_a?: string;
    vitamin_c?: string;
    calcium?: string;
    iron?: string;
}

// Minimal Shape for Recipe
export interface FatSecretRecipe {
    recipe_id: string;
    recipe_name: string;
    recipe_description?: string;
    recipe_image?: string; // Sometimes present, sometimes not
    recipe_url?: string;
    ingredients?: {
        ingredient: FatSecretIngredient[];
    };
    directions?: {
        direction: FatSecretDirection[];
    };
    cooking_time_min?: string;
    preparation_time_min?: string;
    rating?: string;
    serving_sizes?: {
        serving: {
            serving_size_id: string;
            calories: string;
            carbohydrate: string;
            protein: string;
            fat: string;
            // ... add micros if needed
            sugar?: string;
            fiber?: string;
            sodium?: string;
            cholesterol?: string;
            trans_fat?: string;
            saturated_fat?: string;
            vitamin_a?: string; // often '16' (percent?)
            vitamin_c?: string;
            calcium?: string;
            iron?: string;
        };
    };
}

export interface FatSecretIngredient {
    food_id: string;
    food_name: string;
    ingredient_description: string;
    measurement_description: string;
    number_of_units: string;
}

export interface FatSecretDirection {
    direction_number: string;
    direction_description: string;
}

export interface SearchResult<T> {
    page_number: number;
    max_results: number;
    total_results: number;
    results: T[];
}

// --- Auth Manager ---
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

const getAuthToken = async (): Promise<string> => {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const clientId = process.env.FAT_SECRET_CLIENT_ID || process.env.FATSECRET_CLIENT_ID;
    const clientSecret = process.env.FAT_SECRET_CLIENT_SECRET || process.env.FATSECRET_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing FATSECRET_CLIENT_ID or FATSECRET_CLIENT_SECRET environment variables.');
    }

    try {
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await axios.post(
            TOKEN_URL,
            'grant_type=client_credentials&scope=premier', // Testing premier scope only
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const data = response.data as FatSecretToken;
        cachedToken = data.access_token;
        // Set expiry 5 minutes before actual expiry to be safe
        tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);
        return cachedToken;
    } catch (error) {
        console.error('Error fetching FatSecret token:', error);
        throw error;
    }
};

// --- API Client ---
const apiClient = axios.create({
    baseURL: BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// --- Helper Functions ---

const checkApiError = (data: any) => {
    if (data && data.error) {
        throw new Error(`FatSecret API Error ${data.error.code}: ${data.error.message}`);
    }
};

/**
 * Search for recipes.
 * GET /recipes/search/v3
 */
export const searchRecipes = async (
    searchExpression: string,
    pageNumber: number = 0,
    maxResults: number = 20
): Promise<SearchResult<FatSecretRecipe>> => {
    try {
        const response = await apiClient.get('/recipes/search/v3', {
            params: {
                search_expression: searchExpression,
                page_number: pageNumber,
                max_results: maxResults,
                format: 'json'
            }
        });

        checkApiError(response.data);


        const data = response.data.recipes;
        if (!data) {
            return { page_number: 0, max_results: maxResults, total_results: 0, results: [] };
        }
        const recipes = data.recipe ? (Array.isArray(data.recipe) ? data.recipe : [data.recipe]) : [];

        return {
            page_number: parseInt(data.page_number) || 0,
            max_results: parseInt(data.max_results) || maxResults,
            total_results: parseInt(data.total_results) || 0,
            results: recipes
        };
    } catch (error) {
        console.error('Error searching recipes:', error);
        throw error;
    }
};

/**
 * Get detailed recipe information.
 * GET /recipe/v2
 */
export const getRecipeDetails = async (recipeId: string): Promise<FatSecretRecipe> => {
    try {
        const response = await apiClient.get('/recipe/v2', {
            params: {
                recipe_id: recipeId,
                format: 'json'
            }
        });
        checkApiError(response.data);
        return response.data.recipe;
    } catch (error) {
        console.error(`Error fetching recipe ${recipeId}:`, error);
        throw error;
    }
};

/**
 * Search for foods/ingredients.
 * GET /foods/search/v4
 */
export const searchFoods = async (
    searchExpression: string,
    pageNumber: number = 0,
    maxResults: number = 20
): Promise<SearchResult<FatSecretFood>> => {
    try {
        const response = await apiClient.get('/foods/search/v4', {
            params: {
                search_expression: searchExpression,
                page_number: pageNumber,
                max_results: maxResults,
                format: 'json'
            }
        });

        checkApiError(response.data);

        // console.log('DEBUG: foods search response', JSON.stringify(response.data, null, 2));
        const data = response.data.foods_search || response.data.foods;
        if (!data) {
            console.warn("Unexpected response structure", response.data);
            return { page_number: 0, max_results: maxResults, total_results: 0, results: [] };
        }
        // v4 Premier uses 'foods_search.results.food'
        // v1 Basic uses 'foods.food'
        const rawList = data.results?.food || data.food || data.results;
        const foods = rawList ? (Array.isArray(rawList) ? rawList : [rawList]) : [];

        return {
            page_number: parseInt(data.page_number) || 0,
            max_results: parseInt(data.max_results) || maxResults,
            total_results: parseInt(data.total_results) || 0,
            results: foods
        };
    } catch (error) {
        console.error('Error searching foods:', error);
        throw error;
    }
};

/**
 * Get detailed food information.
 * GET /food/v5
 */
export const getFoodDetails = async (foodId: string): Promise<FatSecretFood> => {
    try {
        const response = await apiClient.get('/food/v5', {
            params: {
                food_id: foodId,
                format: 'json',
                include_sub_categories: 'true' // Helpful for generic foods
            }
        });
        return response.data.food;
    } catch (error) {
        console.error(`Error fetching food ${foodId}:`, error);
        throw error;
    }
};

/**
 * Find food by barcode.
 * GET /food/barcode/find-by-id/v2
 */
export const findFoodByBarcode = async (barcode: string): Promise<FatSecretFood | null> => {
    try {
        const response = await apiClient.get('/food/barcode/find-by-id/v2', {
            params: {
                barcode: barcode,
                format: 'json'
            }
        });

        // This endpoint returns a food_id, which we then need to fetch details for
        const foodId = response.data.food_id?.value;
        if (foodId && foodId !== '0') {
            return await getFoodDetails(foodId);
        }
        return null;
    } catch (error) {
        // 404 means not found usually, but let's log safe errors
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        console.error(`Error finding barcode ${barcode}:`, error);
        throw error;
    }
};

/**
 * Natural Language Processing to find foods in text.
 * POST /natural-language-processing/v1
 * Note: Requires 'nlp' scope support on the key.
 */
export const performNLPSearch = async (query: string): Promise<any> => {
    try {
        // This is a Premier endpoint, checking availablity
        const response = await apiClient.post('/natural-language-processing/v1?format=json', {
            user_input: query,
            include_food_data: true
        });
        checkApiError(response.data);
        return response.data;
    } catch (error) {
        // Fallback if NLP isn't enabled or fails
        console.warn("NLP API call failed, falling back to standard search.", error);
        // Return a mocked NLP-like structure using standard search for the first term
        const searchRes = await searchFoods(query, 0, 5);
        return {
            is_fallback: true,
            foods: searchRes.results
        };
    }
};
