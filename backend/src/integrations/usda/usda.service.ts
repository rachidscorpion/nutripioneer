/**
 * USDA FoodData Central API Integration Service
 * Provides access to the United States Department of Agriculture's food composition database
 * 
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

import { offService, type OffProduct } from '../off/off.service';

export interface USDANutrient {
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
    derivationCode?: string;
    derivationDescription?: string;
}

export interface USDAFood {
    fdcId: number;
    description: string;
    dataType: string;
    publicationDate?: string;
    brandOwner?: string;
    brandName?: string;
    ingredients?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients: USDANutrient[];
    foodCategory?: {
        description: string;
    };
    [key: string]: unknown;
}

export interface USDASearchResult {
    totalHits: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    foods: USDAFood[];
}

// Common nutrient IDs in USDA database
export const USDA_NUTRIENT_IDS = {
    ENERGY_KCAL: 1008,
    PROTEIN: 1003,
    TOTAL_FAT: 1004,
    CARBOHYDRATES: 1005,
    FIBER: 1079,
    SUGARS: 2000,
    SODIUM: 1093,
    CHOLESTEROL: 1253,
    SATURATED_FAT: 1258,
    VITAMIN_A: 1106,
    VITAMIN_C: 1162,
    CALCIUM: 1087,
    IRON: 1089,
    POTASSIUM: 1092,
} as const;

class USDAService {
    private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

    private get apiKey(): string {
        // DEMO_KEY has limited requests but works for testing
        return process.env.USDA_API_KEY || 'DEMO_KEY';
    }

    /**
     * Make a GET request to USDA API
     */
    private async get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.set('api_key', this.apiKey);

        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, String(value));
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
    }

    /**
     * Make a POST request to USDA API
     */
    private async post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.set('api_key', this.apiKey);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
    }

    /**
     * Get detailed information about a specific food by FDC ID
     */
    async getFood(fdcId: string | number): Promise<USDAFood | null> {
        try {
            return await this.get<USDAFood>(`/food/${fdcId}`);
        } catch (error) {
            console.error(`[USDA] Failed to get food ${fdcId}:`, error);
            return null;
        }
    }

    /**
     * Get multiple foods by FDC IDs
     */
    async getFoods(fdcIds: (string | number)[]): Promise<USDAFood[]> {
        try {
            const response = await this.post<USDAFood[]>('/foods', {
                fdcIds: fdcIds.map(id => Number(id)),
            });
            return response || [];
        } catch (error) {
            console.error('[USDA] Failed to get foods:', error);
            return [];
        }
    }

    /**
     * Search for foods in the USDA database
     */
    async searchFoods(
        query: string,
        options: {
            pageSize?: number;
            pageNumber?: number;
            dataType?: ('Foundation' | 'SR Legacy' | 'Branded' | 'Survey (FNDDS)')[];
            sortBy?: 'dataType.keyword' | 'description' | 'fdcId' | 'publishedDate';
            sortOrder?: 'asc' | 'desc';
        } = {}
    ): Promise<USDASearchResult> {
        const emptyResult: USDASearchResult = {
            totalHits: 0,
            currentPage: 1,
            totalPages: 0,
            pageSize: 20,
            foods: [],
        };

        try {
            const body: Record<string, unknown> = {
                query,
                pageSize: options.pageSize || 20,
                pageNumber: options.pageNumber || 1,
                dataType: options.dataType || ['Foundation', 'SR Legacy', 'Branded'],
            };

            if (options.sortBy) {
                body.sortBy = options.sortBy;
                body.sortOrder = options.sortOrder || 'asc';
            }

            return await this.post<USDASearchResult>('/foods/search', body);
        } catch (error) {
            console.error(`[USDA] Search failed for "${query}":`, error);
            return emptyResult;
        }
    }

    /**
     * Get nutrition information from a barcode
     * Falls back to Open Food Facts since USDA doesn't have barcode lookup
     */
    async getNutritionFromBarcode(barcode: string): Promise<OffProduct | null> {
        return offService.getProductByBarcode(barcode);
    }

    /**
     * Extract a specific nutrient value from a food item
     */
    getNutrientValue(food: USDAFood, nutrientId: number): number {
        const nutrient = food.foodNutrients.find(n => n.nutrientId === nutrientId);
        return nutrient?.value ?? 0;
    }

    /**
     * Get common macronutrients in a standardized format
     */
    getNormalizedNutrition(food: USDAFood): {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
        fiber: number;
        sugar: number;
        sodium: number;
        servingSize?: number;
        servingSizeUnit?: string;
    } {
        return {
            calories: this.getNutrientValue(food, USDA_NUTRIENT_IDS.ENERGY_KCAL),
            protein: this.getNutrientValue(food, USDA_NUTRIENT_IDS.PROTEIN),
            fat: this.getNutrientValue(food, USDA_NUTRIENT_IDS.TOTAL_FAT),
            carbs: this.getNutrientValue(food, USDA_NUTRIENT_IDS.CARBOHYDRATES),
            fiber: this.getNutrientValue(food, USDA_NUTRIENT_IDS.FIBER),
            sugar: this.getNutrientValue(food, USDA_NUTRIENT_IDS.SUGARS),
            sodium: this.getNutrientValue(food, USDA_NUTRIENT_IDS.SODIUM),
            servingSize: food.servingSize,
            servingSizeUnit: food.servingSizeUnit,
        };
    }
}

// Export singleton instance
export const usdaService = new USDAService();
