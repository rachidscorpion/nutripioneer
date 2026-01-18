export interface OffProduct {
    _id: string;
    code: string;
    product_name: string;
    product_name_en?: string;
    brands?: string;
    brands_tags?: string[];
    categories_tags?: string[];
    image_url?: string;
    image_small_url?: string;
    image_front_url?: string;
    image_front_small_url?: string;
    nutriments?: OffNutriments;
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    ingredients_text?: string; // Often available even if not in the sample
    ingredients_text_en?: string;
    labels?: string;
    labels_tags?: string[];
    quantity?: string;
    serving_size?: string;
    serving_quantity?: string;
}

export interface OffNutriments {
    energy?: number;
    "energy-kcal"?: number;
    "energy-kcal_100g"?: number;
    "energy-kcal_unit"?: string;
    "energy-kcal_value"?: number;

    carbohydrates?: number;
    carbohydrates_100g?: number;
    carbohydrates_unit?: string;
    carbohydrates_value?: number;

    fat?: number;
    fat_100g?: number;
    fat_unit?: string;
    fat_value?: number;

    "saturated-fat"?: number;
    "saturated-fat_100g"?: number;
    "saturated-fat_unit"?: string;
    "saturated-fat_value"?: number;

    proteins?: number;
    proteins_100g?: number;
    proteins_unit?: string;
    proteins_value?: number;

    salt?: number;
    salt_100g?: number;
    salt_unit?: string;
    salt_value?: number;

    sodium?: number;
    sodium_100g?: number;
    sodium_unit?: string;
    sodium_value?: number;

    sugars?: number;
    sugars_100g?: number;
    sugars_unit?: string;
    sugars_value?: number;

    fiber?: number;
    fiber_100g?: number;
    fiber_unit?: string;
    fiber_value?: number;

    // Add more as needed, OFF returns dynamic keys often
    [key: string]: number | string | undefined;
}

export interface OffProductResponse {
    code: string;
    product?: OffProduct;
    status: number;
    status_verbose: string;
}

export interface OffSearchResponse {
    count: number;
    page: number;
    page_count: number;
    page_size: number;
    products: OffProduct[];
}

const BASE_URL_V2 = "https://world.openfoodfacts.org/api/v2";
// V1 Search is still the standard for full text search
const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";

// User-Agent is required by OpenFoodFacts policies
const USER_AGENT = "NutriPioneerApp/1.0 (Integration; +https://example.com)";

/**
 * Fetch a product by its barcode.
 * @param barcode The product barcode (EAN/UPC)
 * @returns The product data or null if not found.
 */
export async function getProductByBarcode(barcode: string): Promise<OffProduct | null> {
    if (!barcode) return null;

    try {
        const url = `${BASE_URL_V2}/product/${barcode}?fields=code,product_name,product_name_en,brands,brands_tags,categories_tags,image_url,image_small_url,image_front_url,image_front_small_url,nutriments,nutriscore_grade,ecoscore_grade,ingredients_text,ingredients_text_en,labels,labels_tags,quantity,serving_size,serving_quantity`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
            },
        });

        if (!response.ok) {
            throw new Error(`OFF API error: ${response.statusText}`);
        }

        const data: OffProductResponse = await response.json();

        if (data.status === 1 && data.product) {
            return data.product;
        }

        return null;
    } catch (error) {
        console.error("Error fetching product from OFF:", error);
        return null;
    }
}

/**
 * Search for products by name or keywords.
 * @param query The search query string
 * @param page Page number (default 1)
 * @param pageSize Products per page (default 20)
 * @returns List of products matches
 */
export async function searchProducts(query: string, page = 1, pageSize = 20): Promise<OffProduct[]> {
    if (!query) return [];

    try {
        // Construct search URL
        // search_terms: the query
        // search_simple: 1 (basic search)
        // action: process
        // json: 1 (to get JSON response)
        const params = new URLSearchParams({
            search_terms: query,
            search_simple: "1",
            action: "process",
            json: "1",
            page: page.toString(),
            page_size: pageSize.toString(),
            fields: "code,product_name,product_name_en,brands,image_small_url,nutriments,nutriscore_grade"
        });

        const url = `${SEARCH_URL}?${params.toString()}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
            },
        });

        if (!response.ok) {
            throw new Error(`OFF Search error: ${response.statusText}`);
        }

        const data: OffSearchResponse = await response.json();
        return data.products || [];

    } catch (error) {
        console.error("Error searching products on OFF:", error);
        return [];
    }
}
