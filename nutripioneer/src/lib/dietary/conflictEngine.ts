
export interface NutritionData {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    addedSugar: number;
    fiber: number;
    sodium: number;
    potassium: number;
    phosphorus: number;
    fattyAcidsSat: number;
    fattyAcidsTrans: number;
    cholesterol: number;
    calcium: number;
    iron: number;
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
}

export interface FoodItem extends NutritionData {
    name: string;
    ingredients: string; // Crucial for additive scanning
}

export interface UserProfile {
    conditions: ('t2d' | 'hypertension' | 'ckd' | 'pcos' | 'high_cholesterol')[];
    ckdStage?: number; // 1-5
    gender: 'male' | 'female';
    goal: 'weight_loss' | 'maintenance';
}

export interface AnalysisResult {
    status: 'Safe' | 'Caution' | 'Avoid';
    reason: string;
    modification: string;
    nutrition: FoodItem;
}

export function runConflictEngine(
    food: FoodItem,
    user: UserProfile
): AnalysisResult {
    let status: 'Safe' | 'Caution' | 'Avoid' = 'Safe';
    let reasons: string[] = [];
    let mods: string[] = [];

    // --- PHASE 1: INGREDIENT SAFETY SCAN ---
    const lowerIngredients = food.ingredients.toLowerCase();

    const isCKD = user.conditions.includes('ckd');
    const isT2D = user.conditions.includes('t2d');
    const isHypertension = user.conditions.includes('hypertension');
    const isPCOS = user.conditions.includes('pcos');
    const isHighCholesterol = user.conditions.includes('high_cholesterol');

    // CKD: Hidden Killers
    if (isCKD) {
        // Phosphorus Additives
        if (/(phos)/i.test(lowerIngredients)) {
            return {
                status: 'Avoid',
                reason: 'Contains inorganic Phosphorus additives (100% absorption).',
                modification: 'Strictly avoid.',
                nutrition: food
            };
        }
        // Potassium Additives
        if (/(potassium chloride|potassium lactate)/i.test(lowerIngredients)) {
            return {
                status: 'Avoid',
                reason: 'Contains hidden potassium preservatives/salts.',
                modification: 'Strictly avoid.',
                nutrition: food
            };
        }
    }

    // Trans Fats (All users, especially high cholesterol)
    if (/(partially hydrogenated)/i.test(lowerIngredients)) {
        status = 'Avoid';
        reasons.push('Contains heart-damaging trans fats.');
        mods.push('Select a different product.');
    }

    // Sugar Aliases (T2D or PCOS)
    if (isT2D || isPCOS) {
        if (/(dextrose|maltodextrin|corn syrup|high fructose)/i.test(lowerIngredients)) {
            if (status !== 'Avoid') status = 'Caution';
            reasons.push('Contains high-GI hidden sugars.');
        }
    }

    // --- PHASE 2: DYNAMIC THRESHOLD CALCULATION ---
    let sodiumLimit = 2300 / 3; // Default ~766mg per meal
    if (isHypertension) sodiumLimit = 750;
    if (isCKD && isHypertension) sodiumLimit = 500;

    let carbLimit = 60; // Default
    if (user.gender === 'female') carbLimit = user.goal === 'weight_loss' ? 45 : 60;
    if (user.gender === 'male') carbLimit = user.goal === 'weight_loss' ? 60 : 75;

    // --- PHASE 3: EVALUATION (THE MATRIX) ---

    // Sodium Check
    if (food.sodium > sodiumLimit) {
        status = 'Avoid';
        reasons.push(`Sodium (${Math.round(food.sodium)}mg) exceeds meal limit of ${Math.round(sodiumLimit)}mg`);
        mods.push('Avoid adding salt', 'Drink water');
    }

    // Diabetes Logic Block
    if (isT2D) {
        if (food.carbs > carbLimit) {
            if (food.fiber > 10) {
                if (status !== 'Avoid') status = 'Caution';
                reasons.push('High carbs buffered by fiber (Nuanced Compromise).');
            } else {
                status = 'Avoid';
                reasons.push(`Carbs (${Math.round(food.carbs)}g) exceed metabolic target of ${carbLimit}g.`);
                mods.push('Eat half portion', 'Walk after eating');
            }
        } else if (food.carbs > 40 && food.fiber < 3) {
            // Standard high carb warning
            if (status !== 'Avoid') status = 'Caution';
            reasons.push('Moderate Carbs');
        }
    }

    // Potassium Logic Block (Scenario A)
    if (isCKD) {
        if (food.potassium > 200) {
            // CKD Rules Prevail
            if (status !== 'Avoid') status = 'Caution'; // Or Avoid if extreme
            reasons.push('Kidney Potassium Load - Kidneys may struggle to filter.');
            mods.push('Limit portion', 'Leach vegetables if possible');

            if (food.potassium > 350) {
                status = 'Avoid'; // Stricter if very high
                reasons.push('Very High Potassium load.');
            }
        }
    } else if (isHypertension && !isCKD) {
        // Bonus for HTN if NOT CKD
        if (food.potassium > 300 && food.sodium < 400 && status === 'Safe') {
            reasons.push('Good Potassium source (DASH) for blood pressure.');
        }
    }

    // PCOS Modifiers (Scenario C)
    if (isPCOS) {
        if (food.addedSugar > 10 || /(nitrates|nitrites)/i.test(lowerIngredients)) {
            status = 'Avoid';
            reasons.push('Inflammatory trigger (Sugar/Additives) - drives PCOS pathology.');
            mods.push('Swap for unsweetened version');
        }

        // Low fat check override
        if (isHighCholesterol && food.fat < 5 && food.addedSugar > 10) {
            status = 'Avoid';
            reasons.push('Low fat content does not excuse high sugar load (PCOS Check).');
        }
    }

    // Scenario B: T2D + CKD (Whole Grains - Phosphorus/Fiber)
    if (isT2D && isCKD && food.fiber > 5 && food.phosphorus > 200) {
        if (status !== 'Avoid') status = 'Caution';
        reasons.push('High Fiber is good for T2D, but Phosphorus is high for CKD.');
        mods.push('Eat a smaller portion to manage phosphorus load while getting fiber benefits.');
    }

    // Default Good News
    if (status === 'Safe' && reasons.length === 0) {
        reasons.push('Green light! Fits your complex profile.');
    }

    return {
        status,
        reason: reasons.join('. '),
        modification: mods.join('. '),
        nutrition: food
    };
}
