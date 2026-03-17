export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    createdAt: string;
    updatedAt: string;
    age?: number;
    conditions?: string;
    primaryAnchor?: string;
    onboardingData?: string;
    nutritionLimits?: string;
    preferences?: string;
    polarCustomerId?: string;
    polarSubscriptionId?: string;
    subscriptionStatus?: string;
}

export interface Recipe {
    id: string;
    externalId?: string;
    sourceAPI?: string;
    name: string;
    description?: string;
    instructions: string;
    prepTime?: number;
    category?: string;
    image?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
    sugar?: number;
    fiber?: number;
    servingSize?: number;
    servingSizeUnit?: string;
    tags: string;
    ingredients: string;
}

export interface Plan {
    id: string;
    userId: string;
    date: string;
    breakfastStatus: string;
    lunchStatus: string;
    dinnerStatus: string;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
    workoutTime: string;
    breakfastId?: string;
    lunchId?: string;
    dinnerId?: string;
    restaurantId?: string;
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    isCompleted: boolean;
}

export interface GroceryItem {
    id: string;
    userId: string;
    name: string;
    isChecked: boolean;
    category?: string;
    createdAt: string;
}

export interface MetricLog {
    id: string;
    userId: string;
    createdAt: string;
    type: 'GLUCOSE' | 'BP' | 'WEIGHT' | 'WATER';
    value1?: number;
    value2?: number;
    tag?: string;
}

export interface Condition {
    id: string;
    slug: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    icdCode?: string;
    icdUri?: string;
    nutritionalFocus?: string;
    allowedIngredients?: string;
    excludedIngredients?: string;
}

export interface NutrientLimit {
    id: string;
    conditionId: string;
    nutrient: string;
    limitType: 'MAX' | 'MIN' | 'RANGE' | 'TEXT';
    limitValue: string;
    unit?: string;
    notes?: string;
}

export interface IngredientExclusion {
    id: string;
    conditionId: string;
    additiveCategory: string;
    ingredientRegex: string;
    riskCategory: string;
    severity: 'CRITICAL_AVOID' | 'LIMIT';
    source?: string;
}

export interface MenuScanResult {
    items: {
        name: string;
        description: string;
        status: 'SAFE' | 'CAUTION' | 'AVOID';
        reasoning: string;
        modification?: string;
    }[];
    summary: string;
}

export interface FoodAnalysis {
    source: string;
    name: string;
    brand?: string;
    image?: string;
    nutrition: {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
        sodium: number;
        sugar?: number;
        fiber?: number;
        potassium?: number;
        phosphorus?: number;
    };
    bioavailability?: {
        score: number;
        color: 'Green' | 'Yellow' | 'Red';
        reasoning: string;
    };
}

export interface DrugInfo {
    name: string;
    rxcui: string;
    ingredients: string[];
    interactions: string;
    pharmClass: string[];
    warnings?: string[];
    purpose?: string[];
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    price?: number;
    features?: string[];
}

export interface AuthResponse {
    user: User;
    session?: {
        token: string;
        expiresAt: string;
    };
}

export interface OnboardingData {
    name: string;
    email: string;
    conditions: string[];
    biometrics: {
        height: number;
        weight: number;
        waist?: number;
        age: number;
        gender: string;
        unit: 'metric' | 'imperial';
    };
    medical: {
        insulin: boolean;
        medications: DrugInfo[];
    };
    dietary: {
        favorites: string[];
        dislikes: string[];
        favCuisines: string[];
        dislikeCuisines: string[];
    };
}

export interface NutritionLimits {
    daily_calories: {
        min: number;
        max: number;
        label: string;
    };
    nutrients: {
        NA?: { max?: number; label: string; unit: string };
        K?: { max?: number; label: string; unit: string };
        P?: { max?: number; label: string; unit: string };
        PROCNT?: { min?: number; max?: number; label: string; unit: string };
        CHOCDF?: { min?: number; max?: number; label: string; unit: string };
        SUGAR?: { max?: number; label: string; unit: string };
        FIBTG?: { min?: number; label: string; unit: string };
        CHOLE?: { max?: number; label: string; unit: string };
    };
    avoid_ingredients?: string[];
    reasoning?: string;
}
