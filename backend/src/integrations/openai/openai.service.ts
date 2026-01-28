import OpenAI from 'openai';

// Initialize OpenAI (Make sure to set OPENAI_API_KEY in your env)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface HealthProfile {
    conditions: string[]; // e.g., ["ckd-3b-5", "htn"]
    medications: any[];   // Your existing med objects
    biometrics: {
        weight: number;   // 82
        height: number;   // 160
        age: number;      // 23
        gender: string;   // Male
    };
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

export async function calculateMedicalLimits(profile: HealthProfile): Promise<ComputedLimits> {
    const prompt = `
    You are a clinical renal dietitian. Analyze this user to set daily nutrition limits based on their medical profile.

    PATIENT DATA:
    - Conditions: ${JSON.stringify(profile.conditions)} 
      (Note: 'ckd-3b-5' means Stage 3b-5 Kidney Disease)
      (Note: 'htn' means Hypertension)
      (Note: 't2dm' means Type 2 Diabetes)
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
      "avoid_ingredients": ["string", "string"], <-- No sentences
      "reasoning": "Brief clinical explanation for these limits." <-- keep it short
    }
    `;
    const completion = await openai.chat.completions.create({
        model: "gpt-5-nano",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("OpenAI returned empty content");
    }

    return JSON.parse(content);
}

export async function analyzeMenuImage(imageBase64: string, profile: HealthProfile): Promise<MenuAnalysisResult> {
    const conditionDescriptions = {
        'ckd': 'Chronic Kidney Disease - restrict potassium, phosphorus, high-sodium foods, processed meats',
        'ckd-3b-5': 'Stage 3b-5 Kidney Disease - strict limits on potassium and phosphorus, limit protein intake',
        'htn': 'Hypertension - restrict high-sodium foods, processed foods, salty dishes',
        't2dm': 'Type 2 Diabetes - control blood sugar, limit high-carb and sugary foods, prioritize fiber',
        'hypertension': 'Hypertension - avoid high-sodium items and excessive salt',
        'diabetes': 'Diabetes - limit refined carbs and sugars, focus on fiber and protein',
        'pcos': 'PCOS - limit high-sugar foods, inflammatory ingredients, processed foods',
    };

    const conditionWarnings = profile.conditions
        .map((c) => conditionDescriptions[c as keyof typeof conditionDescriptions] || c)
        .join(', ');

    const prompt = `
You are a nutrition safety expert analyzing a restaurant menu for a patient with specific medical conditions.

PATIENT PROFILE:
- Conditions: ${profile.conditions.join(', ')}
- Condition Details: ${conditionWarnings}
- Medications: ${profile.medications.map((m) => m.name).join(', ')}
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

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: prompt
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Please analyze this restaurant menu image."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageBase64,
                            detail: "high"
                        }
                    }
                ]
            }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("OpenAI returned empty content for menu analysis");
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
        console.error('Failed to parse OpenAI response:', error);
        throw new Error('Failed to parse menu analysis results');
    }
}
