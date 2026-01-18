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
