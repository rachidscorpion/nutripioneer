/**
 * API Integrations Barrel Export
 * 
 * This module provides unified access to external nutrition and recipe APIs:
 * - FatSecret: Comprehensive food and recipe database with detailed nutrition
 * - MealDB: Recipe database with cooking instructions and categorization
 * - Open Food Facts (OFF): Open source food product database, great for barcodes
 * - USDA: Official US government food composition database
 * - ICD-11: WHO medical classification database for disease onboarding
 */

// FatSecret API
export {
    fatSecretService,
    type SearchResult,
    type FatSecretFood,
    type FatSecretRecipe,
} from './fatsecret/fatsecret.service';

// TheMealDB API
export {
    mealDBService,
    type Meal,
    type MealCategory,
    type MealArea,
    type MealIngredient,
} from './mealdb/mealdb.service';


// Open Food Facts API
export {
    offService,
    type OffProduct,
    type OffNutriments,
    type OffSearchResult,
} from './off/off.service';

// USDA FoodData Central API
export {
    usdaService,
    USDA_NUTRIENT_IDS,
    type USDAFood,
    type USDANutrient,
    type USDASearchResult,
} from './usda/usda.service';

// Edamam Food Database API
export {
    edamamService,
    type EdamamFood,
    type EdamamHint,
    type EdamamMeasure,
    type EdamamNutrientsRequest,
    type EdamamNutrientsResponse,
    type EdamamParseResponse,
} from './edamam/edamam.service';

// WHO ICD-11 API
export {
    icdService,
    type ICDTokenResponse,
    type ICDDiseaseResult,
    type ICDSearchResponse,
} from './icd/icd.service';
