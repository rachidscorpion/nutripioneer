
import { GoogleGenerativeAI } from '@google/generative-ai';
// Lazy initialization to ensure env vars are loaded
function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    return new GoogleGenerativeAI(apiKey);
}

function parseGeminiJSON(content: string) {
    const match = content.match(/```(?:json)?([\s\S]*?)```/i);
    if (match && match[1]) {
        return JSON.parse(match[1].trim());
    }
    return JSON.parse(content.trim());
}

export interface ConditionProfile {
    label: string;
    description: string;
    icon: string;
    color: string;
    nutritionalFocus?: Record<string, unknown>;
    nutrientLimits: Array<{
        nutrient: string;
        limitType: string;
        limitValue: string;
        unit?: string;
        notes?: string;
    }>;
    ingredientExclusions: Array<{
        additiveCategory: string;
        ingredientRegex: string;
        riskCategory: string;
        severity: string;
    }>;
}

export interface HealthProfile {
    conditions: string[];
    medications: any[];
    biometrics: {
        weight: number;
        height: number;
        age: number;
        gender: string;
    };
    nutritionLimits?: ComputedLimits | Record<string, unknown>;
}

export interface ComputedLimits {
    daily_calories: { min: number; max: number };
    nutrients: {
        NA?: { max: number };      // Sodium (mg)
        K?: { max: number };       // Potassium (mg)
        P?: { max: number };       // Phosphorus (mg) - Critical for CKD
        PROCNT?: { min: number; max: number }; // Protein (g)
        SUGAR?: { max: number };   // Sugar (g)
    };
    avoid_ingredients: string[];   // e.g. "grapefruit", "starfruit"
    reasoning: string;             // Explanation for the UI
}

export interface MenuItem {
    name: string;
    description?: string;
    status: 'SAFE' | 'CAUTION' | 'AVOID';
    reasoning: string;
    modification?: string;
}

export interface MenuAnalysisResult {
    items: MenuItem[];
    summary: string;
}

export interface MealAnalysisNutrientCheck {
    nutrient: string;
    value: number;
    unit: string;
    limit: string;
    status: 'SAFE' | 'CAUTION' | 'AVOID';
    note: string;
}

export interface MealIngredientConcern {
    ingredient: string;
    risk: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
}

export interface MealModification {
    action: string;
    reason: string;
}

export interface MealAnalysisResult {
    status: 'SAFE' | 'CAUTION' | 'AVOID';
    overallScore: number;
    reasoning: string;
    nutritionalAnalysis: MealAnalysisNutrientCheck[];
    ingredientConcerns: MealIngredientConcern[];
    modifications: MealModification[];
    summary: string;
}

export interface RecipeData {
    name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
    sugar?: number;
    fiber?: number;
    servingSize?: number;
    servingSizeUnit?: string;
    ingredients?: string;
    prepTime?: number;
    tags?: string;
}

export async function generateConditionProfile(conditionName: string, icdDescription: string): Promise<ConditionProfile> {
    const prompt = `You are an expert clinical dietitian. Generate a strict JSON nutrition profile for the medical condition: ${conditionName}.

Context: ${icdDescription}

OUTPUT FORMAT (JSON ONLY):
{
  "label": "Human-readable label (max 100 chars)",
  "description": "Clear description of the condition and dietary implications (max 500 chars)",
  "icon": "Lucide icon name (single word from: heart, alert-triangle, activity, stethoscope, shield, zap, skull, leaf, apple, sun, moon)",
  "color": "Hex color code (e.g., #ef4444 for red, #f59e0b for yellow, #10b981 for green)",
  "nutritionalFocus": {
    "goals": ["Goal 1", "Goal 2"],
    "riskFactors": ["Risk 1", "Risk 2"]
  },
  "nutrientLimits": [
    {
      "nutrient": "Sodium",
      "limitType": "MAX|RANGE|MIN|TEXT",
      "limitValue": "2300|1500-2000|Minimize",
      "unit": "mg|g|% Cal",
      "notes": "Clinical reason for this limit"
    }
  ],
  "ingredientExclusions": [
    {
      "additiveCategory": "Phosphate Additives",
      "ingredientRegex": "phosphoric acid|sodium phosphate|calcium phosphate|hexametaphosphate",
      "riskCategory": "Rapid absorption; clinical risk explanation",
      "severity": "CRITICAL_AVOID|LIMIT"
    }
  ]
}

IMPORTANT RULES:
- ingredientRegex must be pipe-separated patterns for regex matching
- severity must be exactly "CRITICAL_AVOID" or "LIMIT"
- limitType must be exactly "MAX", "MIN", "RANGE", or "TEXT"
- Identify specific dangerous additives/ingredients relevant to this condition
- Define nutrient limits with clinical reasoning
- Choose an appropriate icon from the Lucide icon set
- Color should reflect severity (red for critical, yellow for moderate, green for safe)`;

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
        throw new Error("Gemini returned empty content for condition profile");
    }

    const parsed = parseGeminiJSON(content) as ConditionProfile;

    if (!parsed.label || !parsed.description || !parsed.icon || !parsed.color) {
        throw new Error("Invalid condition profile: missing required fields");
    }

    if (!parsed.nutrientLimits || !Array.isArray(parsed.nutrientLimits)) {
        parsed.nutrientLimits = [];
    }

    if (!parsed.ingredientExclusions || !Array.isArray(parsed.ingredientExclusions)) {
        parsed.ingredientExclusions = [];
    }

    return parsed;
}

export async function calculateMedicalLimits(profile: HealthProfile): Promise<ComputedLimits> {
    const prompt = `
    You are a clinical renal dietitian. Analyze this user to set daily nutrition limits based on their medical profile.

    PATIENT DATA:
    - Conditions: ${JSON.stringify(profile.conditions)} 
    - Biometrics: Age ${profile.biometrics.age}, Weight ${profile.biometrics.weight}kg, Gender ${profile.biometrics.gender}

    OUTPUT FORMAT (JSON ONLY):
    Returns nutrients using Edamam codes: 
    NA (Sodium), K (Potassium), P (Phosphorus), PROCNT (Protein), CHOCDF (Carbs), SUGAR (Sugar), ENERC_KCAL (Calories), FIBTG (Fiber).
    
    Structure:
    {
      "daily_calories": { "min": number, "max": number, "label": "Calories" },
      "nutrients": {
         "NA": { "max": number, "label": "Sodium", "unit": "mg" },
         "K": { "max": number, "label": "Potassium", "unit": "mg" },
         "P": { "max": number, "label": "Phosphorus", "unit": "mg" },
         "PROCNT": { "min": number, "max": number, "label": "Protein", "unit": "g" },
         "CHOCDF": { "min": number, "max": number, "label": "Carbohydrates", "unit": "g" },
         "SUGAR": { "max": number, "label": "Sugars", "unit": "g" },
         "FIBTG": { "min": number, "label": "Fiber", "unit": "g" },
         "CHOLE": { "max": number, "label": "Cholesterol", "unit": "mg" }
      },
       "avoid_ingredients": ["string", "string"],
       "reasoning": "Brief clinical explanation for these limits."
    }
    `;

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
        throw new Error("Gemini returned empty content");
    }

    return parseGeminiJSON(content);
}

export async function analyzeMenuImage(imageBase64: string, profile: HealthProfile): Promise<MenuAnalysisResult> {
    const prompt = `
You are a nutrition safety expert analyzing a restaurant menu for a patient with specific medical conditions.

PATIENT PROFILE:
- Conditions: ${profile.conditions.join(', ')}
- Medications: ${profile.medications.map((m) => m.name).join(', ')}
- Nutrition Limits: ${JSON.stringify(profile.nutritionLimits)}
- Biometrics: Age ${profile.biometrics.age}, ${profile.biometrics.gender}

YOUR TASK:
Analyze the provided menu image and identify each dish. For each dish, categorize it as SAFE, CAUTION, or AVOID based on the patient's conditions.

SAFETY CRITERIA:
- SAFE: Fits within patient's dietary restrictions with minimal/no modifications
- CAUTION: Can be eaten with simple modifications (e.g., "ask for sauce on side", "no salt added", "grilled instead of fried")
- AVOID: Contains harmful ingredients that cannot be modified (e.g., hidden phosphates, high-GI sugars, excessive sodium)

SPECIFIC CONSIDERATIONS:
- CKD Patients: Flag dishes with high potassium (bananas, potatoes, tomatoes), phosphorus additives (processed foods, cheese), high sodium
- HTN Patients: Flag salty dishes, processed meats, fried foods, sodium-heavy sauces
- T2DM Patients: Flag high-carb items, sugary beverages, desserts, white rice/bread
- PCOS Patients: Flag high-sugar items, inflammatory oils, processed foods

OUTPUT FORMAT (JSON ONLY):
{
  "items": [
    {
      "name": "Dish Name",
      "description": "Brief description of what it contains",
      "status": "SAFE" | "CAUTION" | "AVOID",
      "reasoning": "Why this item was categorized this way",
      "modification": "For CAUTION items: what to ask the server (e.g., 'ask for dressing on side')"
    }
  ],
  "summary": "Overall summary of how safe this menu is for the patient"
    }
    `;

    // Extract base64 details if it's a data URL
    let mimeType: string = 'image/jpeg';
    let data: string = imageBase64;

    // Check for standard data URI format
    const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3 && matches[1] && matches[2]) {
        mimeType = matches[1];
        data = matches[2];
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: data,
                mimeType: mimeType
            }
        }
    ]);

    const content = result.response.text();

    if (!content) {
        throw new Error("Gemini returned empty content for menu analysis");
    }

    try {
        const parsed = parseGeminiJSON(content);

        if (!parsed.items || !Array.isArray(parsed.items)) {
            throw new Error("Invalid response format: missing items array");
        }

        parsed.items.forEach((item: MenuItem) => {
            if (!['SAFE', 'CAUTION', 'AVOID'].includes(item.status)) {
                item.status = 'CAUTION';
            }
            if (!item.name) {
                item.name = 'Unknown Item';
            }
            if (!item.reasoning) {
                item.reasoning = 'Unable to determine reasoning';
            }
        });

        if (!parsed.summary) {
            parsed.summary = 'Menu analysis complete. Review each item carefully.';
        }

        return parsed as MenuAnalysisResult;
    } catch (error) {
        console.error('Failed to parse Gemini response:', error);
        throw new Error('Failed to parse menu analysis results');
    }
}

export async function analyzeMeal(recipeData: RecipeData, healthProfile: {
    conditions: string[];
    medications: any[];
    biometrics: {
        weight: number;
        height: number;
        age: number;
        gender: string;
    };
    nutritionLimits?: ComputedLimits | Record<string, unknown>;
    conditionProfiles?: Array<{
        label: string;
        nutrientLimits: Array<{ nutrient: string; limitType: string; limitValue: string; unit?: string; notes?: string }>;
        ingredientExclusions: Array<{ additiveCategory: string; ingredientRegex: string; severity: string }>;
    }>;
    recentMetrics?: Array<{ type: string; value1?: number; value2?: number; tag?: string; createdAt: string }>;
}): Promise<MealAnalysisResult> {
    const conditions = healthProfile.conditions.join(', ') || 'None specified';
    const medications = healthProfile.medications.map((m: any) => m.name).join(', ') || 'None';
    const biometrics = `Age ${healthProfile.biometrics.age}, Weight ${healthProfile.biometrics.weight}kg, Height ${healthProfile.biometrics.height}cm, Gender ${healthProfile.biometrics.gender}`;

    let conditionContext = '';
    if (healthProfile.conditionProfiles && healthProfile.conditionProfiles.length > 0) {
        const profiles = healthProfile.conditionProfiles.map(cp => {
            const limits = cp.nutrientLimits.map(l => `${l.nutrient}: ${l.limitType} ${l.limitValue}${l.unit || ''}`).join('; ');
            const exclusions = cp.ingredientExclusions.map(e => `${e.additiveCategory} (${e.severity})`).join('; ');
            return `  - ${cp.label}: Limits=[${limits}], Exclusions=[${exclusions}]`;
        }).join('\n');
        conditionContext = `\n\nDETAILED CONDITION PROFILES:\n${profiles}`;
    }

    let metricsContext = '';
    if (healthProfile.recentMetrics && healthProfile.recentMetrics.length > 0) {
        const metrics = healthProfile.recentMetrics.map(m => {
            if (m.type === 'GLUCOSE') return `Glucose: ${m.value1}mg/dL (${m.tag || 'no tag'})`;
            if (m.type === 'BP') return `BP: ${m.value1}/${m.value2}mmHg (${m.tag || 'no tag'})`;
            if (m.type === 'WEIGHT') return `Weight: ${m.value1} (${m.tag || 'no tag'})`;
            return `${m.type}: ${m.value1}`;
        }).join(', ');
        metricsContext = `\n\nRECENT HEALTH METRICS:\n${metrics}`;
    }

    let ingredientsList: string[] = [];
    if (recipeData.ingredients) {
        try {
            const parsed = typeof recipeData.ingredients === 'string' ? JSON.parse(recipeData.ingredients) : recipeData.ingredients;
            ingredientsList = parsed.map((i: any) => `${i.item}${i.measure ? ` (${i.measure})` : ''}`);
        } catch {
            ingredientsList = [recipeData.ingredients];
        }
    }

    const prompt = `You are an expert clinical dietitian and nutrition safety analyst. Analyze this meal/recipe against the patient's health profile.

PATIENT HEALTH PROFILE:
- Conditions: ${conditions}
- Medications: ${medications}
- Biometrics: ${biometrics}
- Nutrition Limits: ${JSON.stringify(healthProfile.nutritionLimits || 'Not set')}
${conditionContext}
${metricsContext}

MEAL TO ANALYZE:
- Name: ${recipeData.name}
- Calories: ${recipeData.calories || 'Unknown'} kcal
- Protein: ${recipeData.protein || 'Unknown'}g
- Carbs: ${recipeData.carbs || 'Unknown'}g
- Fat: ${recipeData.fat || 'Unknown'}g
- Sodium: ${recipeData.sodium || 'Unknown'}mg
- Sugar: ${recipeData.sugar || 'Unknown'}g
- Fiber: ${recipeData.fiber || 'Unknown'}g
- Serving Size: ${recipeData.servingSize || 'Unknown'}${recipeData.servingSizeUnit || 'g'}
- Prep Time: ${recipeData.prepTime || 'Unknown'} min
${ingredientsList.length > 0 ? `- Ingredients: ${ingredientsList.join(', ')}` : ''}
${recipeData.tags ? `- Tags: ${typeof recipeData.tags === 'string' ? recipeData.tags : JSON.stringify(recipeData.tags)}` : ''}

YOUR TASK:
Perform a comprehensive safety analysis of this meal for the patient. Consider:
1. How each nutrient value compares to the patient's daily limits (divide daily by 3 for per-meal)
2. Any ingredient interactions with the patient's medications
3. Condition-specific risks (CKD: phosphorus/potassium/sodium; HTN: sodium; T2DM: carbs/sugar; PCOS: sugar/inflammatory foods)
4. Ingredient exclusions from the patient's condition profiles
5. Whether recent health metrics suggest extra caution

SAFETY CRITERIA:
- SAFE (score 85-100): All nutrients well within limits, no risky ingredients, fits conditions
- CAUTION (score 51-84): Some nutrients approaching limits, may need modifications
- AVOID (score 0-50): Contains harmful ingredients or violates critical nutrient limits

OUTPUT FORMAT (JSON ONLY):
{
  "status": "SAFE" | "CAUTION" | "AVOID",
  "overallScore": number (0-100),
  "reasoning": "Detailed explanation of why this meal is rated as such (2-4 sentences)",
  "nutritionalAnalysis": [
    {
      "nutrient": "Calories",
      "value": 450,
      "unit": "kcal",
      "limit": "400-600",
      "status": "SAFE" | "CAUTION" | "AVOID",
      "note": "Brief explanation"
    }
  ],
  "ingredientConcerns": [
    {
      "ingredient": "ingredient name",
      "risk": "HIGH" | "MEDIUM" | "LOW",
      "reason": "Why this is concerning"
    }
  ],
  "modifications": [
    {
      "action": "What to change",
      "reason": "Why it helps"
    }
  ],
  "summary": "Brief 2-3 sentence summary the patient can quickly read"
}`;

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
        throw new Error("Gemini returned empty content for meal analysis");
    }

    try {
        const parsed = parseGeminiJSON(content);

        if (!['SAFE', 'CAUTION', 'AVOID'].includes(parsed.status)) {
            parsed.status = 'CAUTION';
        }

        if (typeof parsed.overallScore !== 'number' || parsed.overallScore < 0 || parsed.overallScore > 100) {
            parsed.overallScore = parsed.status === 'SAFE' ? 85 : parsed.status === 'CAUTION' ? 60 : 25;
        }

        if (!parsed.nutritionalAnalysis || !Array.isArray(parsed.nutritionalAnalysis)) {
            parsed.nutritionalAnalysis = [];
        }

        if (!parsed.ingredientConcerns || !Array.isArray(parsed.ingredientConcerns)) {
            parsed.ingredientConcerns = [];
        }

        if (!parsed.modifications || !Array.isArray(parsed.modifications)) {
            parsed.modifications = [];
        }

        if (!parsed.reasoning) {
            parsed.reasoning = 'Unable to determine reasoning for this meal.';
        }

        if (!parsed.summary) {
            parsed.summary = 'Meal analysis complete.';
        }

        return parsed as MealAnalysisResult;
    } catch (error) {
        console.error('Failed to parse Gemini meal analysis response:', error);
        throw new Error('Failed to parse meal analysis results');
    }
}
