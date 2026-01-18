import { z } from 'zod';

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    age: z.number().int().positive().optional(),
    conditions: z.array(z.string()).optional(),
    primaryAnchor: z.string().optional(),
    onboardingData: z.string().optional(),
});

export const biometricsSchema = z.object({
    height: z.number().optional(),
    weight: z.number().optional(),
    waist: z.number().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
});

export const medicationItemSchema = z.object({
    name: z.string(),
    rxnorm_rxcui: z.string(),
    openfda_rxcui: z.union([z.string(), z.array(z.string())]),
    ingredients: z.array(z.string()).optional(),
    interactions: z.string().optional(),
    pharm_class: z.array(z.string()).optional(),
    // New fields
    warnings: z.array(z.string()).optional(),
    purpose: z.array(z.string()).optional(),
    pregnancy_or_breast_feeding: z.array(z.string()).optional(),
    substance_name: z.array(z.string()).optional(),
});

export const medicalSchema = z.object({
    insulin: z.boolean().optional(),
    medications: z.array(medicationItemSchema).optional(),
});

export const dietarySchema = z.object({
    favorites: z.array(z.string()).optional(),
    dislikes: z.array(z.string()).optional(),
    favCuisines: z.array(z.string()).optional(),
    dislikeCuisines: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    age: z.number().int().positive().optional(),
    conditions: z.array(z.string()).optional(),
    primaryAnchor: z.string().optional(),
    onboardingData: z.string().optional(),
    image: z.string().url().optional(),
    // New structured data fields
    biometrics: biometricsSchema.optional(),
    medical: medicalSchema.optional(),
    dietary: dietarySchema.optional(),
    nutritionLimits: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
});

// ============================================
// Recipe Schemas
// ============================================

export const ingredientSchema = z.object({
    item: z.string(),
    measure: z.string(),
    meta: z.string().optional(),
});

export const createRecipeSchema = z.object({
    name: z.string().min(1, 'Recipe name is required'),
    description: z.string().optional(),
    instructions: z.string().min(1, 'Instructions are required'),
    prepTime: z.number().int().positive().optional(),
    category: z.string().optional(),
    image: z.string().url().optional(),
    calories: z.number().int().nonnegative().optional(),
    protein: z.number().int().nonnegative().optional(),
    carbs: z.number().int().nonnegative().optional(),
    fat: z.number().int().nonnegative().optional(),
    sodium: z.number().int().nonnegative().optional(),
    sugar: z.number().int().nonnegative().optional(),
    fiber: z.number().int().nonnegative().optional(),
    servingSize: z.number().positive().optional(),
    servingSizeUnit: z.string().optional(),
    tags: z.array(z.string()),
    ingredients: z.array(ingredientSchema),
    externalId: z.string().optional(),
    sourceAPI: z.string().optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial();

// ============================================
// Plan Schemas
// ============================================

export const mealStatusSchema = z.enum(['PENDING', 'COMPLETED', 'SKIPPED', 'SWAPPED']);

export const createPlanSchema = z.object({
    userId: z.string().cuid(),
    date: z.string().datetime().or(z.date()),
    breakfastId: z.string().cuid().optional(),
    lunchId: z.string().cuid().optional(),
    dinnerId: z.string().cuid().optional(),
    restaurantId: z.string().cuid().optional(),
    breakfastTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    lunchTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    dinnerTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    workoutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const updatePlanSchema = z.object({
    breakfastId: z.string().cuid().nullable().optional(),
    lunchId: z.string().cuid().nullable().optional(),
    dinnerId: z.string().cuid().nullable().optional(),
    restaurantId: z.string().cuid().nullable().optional(),
    breakfastStatus: mealStatusSchema.optional(),
    lunchStatus: mealStatusSchema.optional(),
    dinnerStatus: mealStatusSchema.optional(),
    breakfastTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    lunchTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    dinnerTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    workoutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    isCompleted: z.boolean().optional(),
});

// ============================================
// Metric Schemas
// ============================================

export const metricTypeSchema = z.enum(['GLUCOSE', 'BP', 'WEIGHT', 'WATER']);

export const createMetricSchema = z.object({
    userId: z.string().cuid(),
    type: metricTypeSchema,
    value1: z.number().int().optional(),
    value2: z.number().int().optional(),
    tag: z.string().optional(),
});

// ============================================
// Grocery Schemas
// ============================================

export const createGroceryItemSchema = z.object({
    userId: z.string().cuid(),
    name: z.string().min(1, 'Item name is required'),
    category: z.string().optional(),
    isChecked: z.boolean().optional(),
});

export const updateGroceryItemSchema = z.object({
    name: z.string().min(1).optional(),
    category: z.string().optional(),
    isChecked: z.boolean().optional(),
});

// ============================================
// Condition Schemas
// ============================================

export const createConditionSchema = z.object({
    slug: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    nutritionalFocus: z.string().optional(),
    allowedIngredients: z.string().optional(),
    excludedIngredients: z.string().optional(),
});

// ============================================
// Query Schemas
// ============================================

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const searchSchema = z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(), // comma-separated
});

// Type exports
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type CreateRecipe = z.infer<typeof createRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;
export type CreatePlan = z.infer<typeof createPlanSchema>;
export type UpdatePlan = z.infer<typeof updatePlanSchema>;
export type CreateMetric = z.infer<typeof createMetricSchema>;
export type CreateGroceryItem = z.infer<typeof createGroceryItemSchema>;
export type UpdateGroceryItem = z.infer<typeof updateGroceryItemSchema>;
export type CreateCondition = z.infer<typeof createConditionSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
