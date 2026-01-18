import axios from 'axios';
import { getProductByBarcode } from '../off/off';

const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const usdaClient = axios.create({
    baseURL: BASE_URL,
    params: {
        api_key: USDA_API_KEY
    }
});

// --- Types ---

export type DataType = 'Branded' | 'Foundation' | 'Survey (FNDDS)' | 'SR Legacy';
export type SortOrder = 'asc' | 'desc';
export type SortBy = 'dataType' | 'publishedDate' | 'fdcId' | 'score';

export interface SearchFoodsParams {
    query: string;
    dataType?: DataType[];
    pageSize?: number;
    pageNumber?: number;
    sortBy?: SortBy;
    sortOrder?: SortOrder;
    brandOwner?: string;
    tradeChannel?: string[];
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
}

export interface ListFoodsParams {
    dataType?: DataType[];
    pageSize?: number;
    pageNumber?: number;
    sortBy?: SortBy;
    sortOrder?: SortOrder;
}

// Minimal shape of Food result (expand as needed)
export interface Food {
    fdcId: number;
    description: string;
    dataType: string;
    publicationDate?: string;
    foodCode?: string;
    foodNutrients?: FoodNutrient[];
    brandOwner?: string;
    brandName?: string;
    foodCategory?: string;
    ingredients?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    totalSugar?: number;
    // ... other fields
}

export interface FoodNutrient {
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
    // ...
}

export interface SearchResult {
    totalHits: number;
    currentPage: number;
    totalPages: number;
    pageList: number[];
    foodSearchCriteria: SearchFoodsParams;
    foods: Food[];
}

// --- Helper Functions ---

/**
 * Retrieves details for a specific food by FDC ID.
 * GET /food/{fdcId}
 */
export const getFood = async (fdcId: number | string): Promise<Food> => {
    try {
        const response = await usdaClient.get(`/food/${fdcId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching food ${fdcId}:`, error);
        throw error;
    }
};

/**
 * Retrieves details for multiple foods by FDC IDs.
 * POST /foods
 */
export const getFoods = async (fdcIds: (number | string)[], format: 'abridged' | 'full' = 'full'): Promise<Food[]> => {
    try {
        const response = await usdaClient.post('/foods', {
            fdcIds,
            format
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching multiple foods:', error);
        throw error;
    }
};

/**
 * Returns a list of foods.
 * POST /foods/list
 */
export const listFoods = async (params: ListFoodsParams = {}): Promise<Food[]> => {
    try {
        const response = await usdaClient.post('/foods/list', params);
        return response.data;
    } catch (error) {
        console.error('Error listing foods:', error);
        throw error;
    }
};

/**
 * Search for foods using keywords and filters.
 * POST /foods/search
 */
export const searchFoods = async (params: SearchFoodsParams): Promise<SearchResult> => {
    try {
        // POST request is recommended for search to handle complex criteria
        const response = await usdaClient.post('/foods/search', params);
        return response.data;
    } catch (error) {
        console.error('Error searching foods:', error);
        throw error;
    }
};

/**
 * Searches for a food item by barcode (gtinUpc).
 */
// Helper: Generate all likely variations of a barcode (UPC, EAN-13, GTIN-14)
// This solves the issue where the scanner reads 13 digits but the API has 12, or vice versa.
const getBarcodeVariations = (barcode: string): string[] => {
    const cleanCode = barcode.replace(/[^0-9]/g, ''); // Remove non-numeric chars
    const variations = new Set<string>();

    // 1. Add the scanned code
    variations.add(cleanCode);

    // 2. If it's EAN-13 (13 digits) and starts with 0, add the UPC version (12 digits)
    if (cleanCode.length === 13 && cleanCode.startsWith('0')) {
        variations.add(cleanCode.substring(1));
    }

    // 3. If it's UPC (12 digits), add the EAN-13 version (pad with 0)
    if (cleanCode.length === 12) {
        variations.add(`0${cleanCode}`);
    }

    // 4. Add GTIN-14 (standard 14-digit format used in many DBs)
    if (cleanCode.length < 14) {
        variations.add(cleanCode.padStart(14, '0'));
    }

    return Array.from(variations);
};

export const getNutritionFromBarcode = async (barcode: string) => {
    try {
        console.log("Fetching product from OpenFoodFacts for barcode:", barcode);
        const offProduct = await getProductByBarcode(barcode);

        if (offProduct) {
            console.log("✅ Found in OpenFoodFacts:", offProduct.product_name);
            const nutriments = offProduct.nutriments || {};
            return {
                name: offProduct.product_name || offProduct.product_name_en || "Unknown Product",
                brand: offProduct.brands || "Unknown Brand",
                brandOwner: offProduct.brands,
                brandName: offProduct.brands,
                foodCategory: (offProduct.categories_tags || []).join(", "),
                // User requested to use 'energy' value (typically kJ) instead of 'calories' (kcal) 
                // or just the field named 'energy'.
                calories: nutriments.energy || 0,
                protein: nutriments.proteins || 0,
                fat: (nutriments.fat?.toFixed(2)) || 0,
                carbs: (nutriments.carbohydrates?.toFixed(2)) || 0,
                sugar: (nutriments.sugars?.toFixed(2)) || 0,
                addedSugar: 0,
                // OFF returns sodium in grams, we convert to mg
                sodium: (nutriments.sodium || 0) * 1000,

                potassium: 0,
                cholesterol: 0,
                fattyAcidsTrans: 0,
                fattyAcidsSat: (nutriments["saturated-fat"]?.toFixed(2)) || 0,
                fiber: (nutriments.fiber?.toFixed(2)) || 0,
                calcium: 0,
                iron: 0,
                vitaminD: 0,
                vitaminA: 0,
                vitaminC: 0,
                phosphorus: 0,
                servingSize: offProduct.serving_size || offProduct.quantity || "100g",
                image: offProduct.image_url || offProduct.image_front_url || "",
                rawProduct: offProduct
            };
        }

        console.warn(`No product found in OpenFoodFacts for: ${barcode}`);
        return null;

    } catch (error) {
        console.error('OpenFoodFacts API Error (Barcode):', error);
        throw error;
    }
};
