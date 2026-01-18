// Custom API Error class for structured error handling
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Common response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    details?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Parsed ingredient type (matching schema)
export interface ParsedIngredient {
    item: string;
    measure: string;
    meta?: string;
}

// Condition with relations for detailed view
export interface ConditionWithRelations {
    id: string;
    slug: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    nutritionalFocus: unknown;
    allowedIngredients: unknown;
    excludedIngredients: unknown;
    nutrientLimits: {
        id: string;
        nutrient: string;
        limitType: string;
        limitValue: string;
        unit: string | null;
        notes: string | null;
    }[];
    ingredientExclusions: {
        id: string;
        additiveCategory: string;
        ingredientRegex: string;
        riskCategory: string;
        severity: string;
        source: string | null;
    }[];
    foodTiers: {
        id: string;
        category: string;
        tier: number;
        tierLabel: string;
        foodItems: string;
        notes: string | null;
    }[];
}

// Plan with recipes for detailed view
export interface PlanWithRelations {
    id: string;
    userId: string;
    date: Date;
    breakfastStatus: string;
    lunchStatus: string;
    dinnerStatus: string;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
    workoutTime: string;
    breakfastId: string | null;
    lunchId: string | null;
    dinnerId: string | null;
    restaurantId: string | null;
    isCompleted: boolean;
    breakfast: RecipeSummary | null;
    lunch: RecipeSummary | null;
    dinner: RecipeSummary | null;
    restaurant: RestaurantSummary | null;
}

export interface RecipeSummary {
    id: string;
    name: string;
    image: string | null;
    calories: number | null;
    category: string | null;
}

export interface RestaurantSummary {
    id: string;
    chainName: string;
    itemName: string;
    notes: string;
}
