
import { runConflictEngine, FoodItem, UserProfile } from '../lib/dietary/conflictEngine';

const mockNutrition = {
    calories: 100, carbs: 10, protein: 5, fat: 5, sugar: 2, addedSugar: 0,
    fiber: 2, sodium: 10, potassium: 100, phosphorus: 50,
    fattyAcidsSat: 0, fattyAcidsTrans: 0, cholesterol: 0,
    calcium: 0, iron: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0
};

function runTest(name: string, food: Partial<FoodItem>, user: UserProfile, expectedStatus: string, expectedReasonKeyword: string) {
    const fullFood: FoodItem = { ...mockNutrition, name: 'Test Food', ingredients: '', ...food } as FoodItem;
    console.log(`Running Test: ${name}`);
    const result = runConflictEngine(fullFood, user);

    const statusMatch = result.status === expectedStatus;
    const reasonMatch = result.reason.toLowerCase().includes(expectedReasonKeyword.toLowerCase());

    if (statusMatch && reasonMatch) {
        console.log(`✅ PASS`);
    } else {
        console.log(`❌ FAIL`);
        console.log(`   Expected Status: ${expectedStatus}, Got: ${result.status}`);
        console.log(`   Expected Reason should contain: "${expectedReasonKeyword}"`);
        console.log(`   Got Reason: "${result.reason}"`);
    }
    console.log('---');
}

// 7.1 Scenario A: Hypertension + CKD + Avocado
runTest(
    'Scenario A: Avocado (Low Sodium, High Potassium) for HTN+CKD',
    {
        name: 'Avocado',
        sodium: 10,
        potassium: 600, // Very high
        ingredients: 'Avocado'
    },
    { conditions: ['hypertension', 'ckd'], gender: 'female', goal: 'maintenance' },
    'Caution', // Or Avoid if strictly implemented as >350
    'Kidney Potassium Load'
);

// 7.2 Scenario B: T2D + CKD + Bran Cereal
runTest(
    'Scenario B: Bran Cereal (High Fiber, High Phos) for T2D+CKD',
    {
        name: 'Bran Cereal',
        carbs: 30,
        fiber: 12,
        phosphorus: 250,
        ingredients: 'Bran, Sugar'
    },
    { conditions: ['t2d', 'ckd'], gender: 'male', goal: 'maintenance' },
    'Caution',
    'Phosphorus'
);

// 7.3 Scenario C: High Cholesterol + PCOS + Low-Fat Sweet Yogurt
runTest(
    'Scenario C: Sweet Yogurt (Low Fat, High Sugar) for High Chol + PCOS',
    {
        name: 'Low Fat Yogurt',
        fat: 1,
        addedSugar: 15,
        ingredients: 'Milk, Sugar, Flavor'
    },
    { conditions: ['high_cholesterol', 'pcos'], gender: 'female', goal: 'maintenance' },
    'Avoid',
    'Inflammatory trigger' // or 'Sugar'
);

// Ingredient Scan: CKD + Phosphate Additive
runTest(
    'Ingredient Scan: Phosphate Additive for CKD',
    {
        ingredients: 'Water, Sodium Phosphate, Salt'
    },
    { conditions: ['ckd'], gender: 'male', goal: 'maintenance' },
    'Avoid',
    'inorganic Phosphorus'
);

// Ingredient Scan: CKD + Potassium Additive
runTest(
    'Ingredient Scan: Potassium Additive for CKD',
    {
        ingredients: 'Water, Potassium Chloride'
    },
    { conditions: ['ckd'], gender: 'male', goal: 'maintenance' },
    'Avoid',
    'preservatives/salts'
);

// Ingredient Scan: Trans Fats
runTest(
    'Ingredient Scan: Trans Fats',
    {
        ingredients: 'Partially Hydrogenated Soybean Oil'
    },
    { conditions: [], gender: 'male', goal: 'maintenance' },
    'Avoid',
    'trans fats'
);
