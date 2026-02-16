
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (Make sure to set GEMINI_API_KEY in your env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    conditions: string[]; // e.g., ["ckd-3b-5", "htn"]
    medications: any[];   // Your existing med objects
    biometrics: {
        weight: number;   // 82
        height: number;   // 160
        age: number;      // 23
        gender: string;   // Male
    };
    nutritionLimits: ComputedLimits;
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

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
        throw new Error("Gemini returned empty content for condition profile");
    }

    const parsed = JSON.parse(content) as ConditionProfile;

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

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
        throw new Error("Gemini returned empty content");
    }

    return JSON.parse(content);
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
        const parsed = JSON.parse(content);

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
