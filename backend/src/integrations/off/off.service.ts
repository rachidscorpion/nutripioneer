/**
 * Open Food Facts (OFF) API Integration Service
 * Provides access to the world's largest open food products database
 * Especially useful for barcode scanning and product lookups
 */

export interface OffNutriments {
    energy_kcal?: number;
    'energy-kcal'?: number;
    'energy-kcal_100g'?: number;
    proteins?: number;
    proteins_100g?: number;
    fat?: number;
    fat_100g?: number;
    carbohydrates?: number;
    carbohydrates_100g?: number;
    fiber?: number;
    fiber_100g?: number;
    sugars?: number;
    sugars_100g?: number;
    sodium?: number;
    sodium_100g?: number;
    salt?: number;
    salt_100g?: number;
    [key: string]: number | undefined;
}

export interface OffProduct {
    code: string;
    product_name: string;
    product_name_en?: string;
    brands?: string;
    categories_tags?: string[];
    serving_size?: string;
    serving_quantity?: number;
    nutriments?: OffNutriments;
    image_url?: string;
    image_small_url?: string;
    image_front_url?: string;
    nutriscore_grade?: string;
    nova_group?: number;
    ecoscore_grade?: string;
    ingredients_text?: string;
    allergens_tags?: string[];
    labels_tags?: string[];
    quantity?: string;
    [key: string]: unknown;
}

export interface OffSearchResult {
    count: number;
    page: number;
    page_count: number;
    page_size: number;
    products: OffProduct[];
}

class OffService {
    private readonly baseUrl = 'https://world.openfoodfacts.org/api/v2';
    private readonly searchUrl = 'https://world.openfoodfacts.org/cgi/search.pl';
    private readonly userAgent = 'NutriPioneerApp/1.0 (Backend Integration)';

    /**
     * Helper to make requests with proper User-Agent
     */
    private async request<T>(url: string): Promise<T> {
        const response = await fetch(url, {
            headers: {
                'User-Agent': this.userAgent,
            },
        });

        if (!response.ok) {
            throw new Error(`OFF request failed: ${response.status}`);
        }

        return await response.json() as T;
    }

    /**
     * Get product by barcode (EAN/UPC)
     * This is the primary method for barcode scanning
     */
    async getProductByBarcode(barcode: string): Promise<OffProduct | null> {
        if (!barcode || !barcode.trim()) {
            return null;
        }

        try {
            const fields = [
                'code',
                'product_name',
                'product_name_en',
                'brands',
                'categories_tags',
                'image_url',
                'image_small_url',
                'nutriments',
                'serving_size',
                'serving_quantity',
                'nutriscore_grade',
                'nova_group',
                'ecoscore_grade',
                'ingredients_text',
                'allergens_tags',
                'labels_tags',
                'quantity',
            ].join(',');

            const url = `${this.baseUrl}/product/${barcode}?fields=${fields}`;
            const response = await this.request<{ status: number; product?: OffProduct }>(url);

            if (response.status === 1 && response.product) {
                return response.product;
            }

            return null;
        } catch (error) {
            console.error(`[OFF] Error fetching product ${barcode}:`, error);
            return null;
        }
    }

    /**
     * Search products by text query
     */
    async searchProducts(query: string, page = 1, pageSize = 20): Promise<OffProduct[]> {
        try {
            const params = new URLSearchParams({
                search_terms: query,
                search_simple: '1',
                action: 'process',
                json: '1',
                page: String(page),
                page_size: String(pageSize),
                fields: 'code,product_name,brands,image_small_url,nutriments,serving_size,nutriscore_grade',
            });

            const url = `${this.searchUrl}?${params.toString()}`;
            const response = await this.request<OffSearchResult>(url);

            return response.products || [];
        } catch (error) {
            console.error(`[OFF] Search failed for "${query}":`, error);
            return [];
        }
    }

    /**
     * Get products by category
     */
    async getProductsByCategory(category: string, page = 1, pageSize = 20): Promise<OffProduct[]> {
        try {
            const url = `https://world.openfoodfacts.org/category/${encodeURIComponent(category)}.json?page=${page}&page_size=${pageSize}`;
            const response = await this.request<OffSearchResult>(url);
            return response.products || [];
        } catch (error) {
            console.error(`[OFF] Category lookup failed for "${category}":`, error);
            return [];
        }
    }

    /**
     * Get products by brand
     */
    async getProductsByBrand(brand: string, page = 1, pageSize = 20): Promise<OffProduct[]> {
        try {
            const url = `https://world.openfoodfacts.org/brand/${encodeURIComponent(brand)}.json?page=${page}&page_size=${pageSize}`;
            const response = await this.request<OffSearchResult>(url);
            return response.products || [];
        } catch (error) {
            console.error(`[OFF] Brand lookup failed for "${brand}":`, error);
            return [];
        }
    }

    /**
     * Normalize nutriment values to per-100g basis
     */
    normalizeNutriments(nutriments: OffNutriments | undefined): {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
        fiber: number;
        sugar: number;
        sodium: number;
    } {
        if (!nutriments) {
            return { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, sodium: 0 };
        }

        return {
            calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || nutriments.energy_kcal || 0,
            protein: nutriments.proteins_100g || nutriments.proteins || 0,
            fat: nutriments.fat_100g || nutriments.fat || 0,
            carbs: nutriments.carbohydrates_100g || nutriments.carbohydrates || 0,
            fiber: nutriments.fiber_100g || nutriments.fiber || 0,
            sugar: nutriments.sugars_100g || nutriments.sugars || 0,
            sodium: (nutriments.sodium_100g || nutriments.sodium || 0) * 1000, // Convert g to mg
        };
    }
}

// Export singleton instance
export const offService = new OffService();
