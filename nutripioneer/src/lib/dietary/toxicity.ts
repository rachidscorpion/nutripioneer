
// Logic for Ingredient Toxicity and Bioavailability Tiers
import { PHOSPHATE_ADDITIVES, POTASSIUM_ADDITIVES, HIDDEN_SUGARS, getFoundAdditives } from './additives';

export interface ScannerResult {
    hasAdditives: boolean;
    dangerousIngredients: string[];
    safetyMessage: string;
}


/**
 * ABSOLUTE CONTRAINDICATIONS
 * Foods that are strictly toxic or dangerous for specific conditions.
 */
export const ABSOLUTE_CONTRAINDICATIONS: Record<string, string[]> = {
    CKD: ['starfruit', 'carambola', 'averrhoa'], // Neurotoxin for CKD
    // Add interactions if needed: e.g. Grapefruit for Statins (handled elsewhere?)
};

/**
 * Bioavailability Tiers for Grains/Plant Foods
 * Based on Phytate-bound phosphorus absorption rates.
 */
export enum BioavailabilityTier {
    OPTIMAL = 1, // Tier 1: 40-50% Phos absorption (Bulgur, Barley, Buckwheat)
    MODERATE = 2, // Tier 2: Brown Rice, Steel-cut Oats, Quinoa
    CONDITIONAL = 3, // Tier 3: White Rice (Low phos, but high GI and low nutrient)
    AVOID = 4 // Processed/High-Risk
}

/**
 * Determine the Bioavailability Tier of a grain/ingredient.
 * Defaults to MODERATE for unrecognized whole foods.
 */
export function getGrainTier(ingredientName: string): BioavailabilityTier {
    const lower = ingredientName.toLowerCase();

    // TIER 1: Optimal (Low availability Phos, High Fiber)
    if (
        lower.includes('bulgur') ||
        lower.includes('barley') ||
        lower.includes('buckwheat') ||
        lower.includes('couscous') || // Generally lower phos burden than brown rice
        lower.includes('millet')
    ) {
        return BioavailabilityTier.OPTIMAL;
    }

    // TIER 2: Moderate (Good, but watch load if severe)
    if (
        lower.includes('brown rice') ||
        lower.includes('wild rice') ||
        lower.includes('oat') ||
        lower.includes('oatmeal') ||
        lower.includes('quinoa') ||
        lower.includes('amaranth')
    ) {
        return BioavailabilityTier.MODERATE;
    }

    // TIER 3: Conditional (Low PO4, but High GI - specific use case for end-stage CKD w/ Hyperkalemia)
    if (
        lower.includes('white rice') ||
        lower.includes('white bread') ||
        lower.includes('refined')
    ) {
        return BioavailabilityTier.CONDITIONAL;
    }

    // Default to MODERATE for things like "Whole Wheat Bread" if not explicitly Tier 1
    if (lower.includes('whole') || lower.includes('grain')) {
        return BioavailabilityTier.MODERATE;
    }

    return BioavailabilityTier.AVOID; // If it's none of the above, treating as specific unknown. 
    // Actually, returning MODERATE is safer for general produce, but for "Grains" specifically, strictness helps.
    // Let's stick to returning MODERATE as a safe fallback for "Vegetables" passed here by accident, 
    // but the function is named `getGrainTier`.
}

/**
 * Check if an ingredient is strictly contraindicated for a condition.
 */
export function isContraindicated(ingredientName: string, conditionSlug: string): boolean {
    const prohibited = ABSOLUTE_CONTRAINDICATIONS[conditionSlug.toUpperCase()];
    if (!prohibited) return false;


    return prohibited.some(toxicItem => ingredientName.toLowerCase().includes(toxicItem.toLowerCase()));
}

/**
 * Scan an ingredient text blob for hidden additives and return a safety analysis.
 */
export function scanForAdditives(ingredientText: string, userConditions: string[] = []): ScannerResult {
    const foundIngredients: string[] = [];
    let safetyMessage = "Safe";
    let hasAdditives = false;

    if (!ingredientText) {
        return { hasAdditives: false, dangerousIngredients: [], safetyMessage: "No ingredients provided" };
    }

    // 1. Phosphate Additives (Critical, especially for CKD)
    const phosphates = getFoundAdditives(ingredientText, PHOSPHATE_ADDITIVES);
    if (phosphates.length > 0) {
        foundIngredients.push(...phosphates);
        hasAdditives = true;

        // CKD Specific Logic
        if (userConditions.some(c => c.toLowerCase().includes('ckd') || c.toLowerCase().includes('kidney'))) {
            safetyMessage = "CRITICAL ALERT: Phosphate additives detected. Highly dangerous for CKD.";
        } else if (safetyMessage === "Safe") {
            safetyMessage = "Warning: Phosphate additives detected.";
        }
    }

    // 2. Potassium Additives (Lethal Risk for CKD)
    const potassiums = getFoundAdditives(ingredientText, POTASSIUM_ADDITIVES);
    if (potassiums.length > 0) {
        foundIngredients.push(...potassiums);
        hasAdditives = true;

        if (userConditions.some(c => c.toLowerCase().includes('ckd') || c.toLowerCase().includes('kidney'))) {
            // Override previous message as this is immediate lethal risk
            safetyMessage = "LETHAL RISK: Potassium additives detected. Strictly Prohibited for CKD.";
        } else if (safetyMessage === "Safe" || safetyMessage.startsWith("Warning")) {
            // If not CKD, it's still worth noting but maybe less critical than phosphates depending on context
            // But for general health, we can append or just set warning.
            // Let's prioritize the most severe message.
            if (!safetyMessage.includes("CRITICAL")) {
                safetyMessage = "Warning: Potassium additives detected.";
            }
        }
    }

    // 3. Hidden Sugars (T2D / PCOS)
    const sugars = getFoundAdditives(ingredientText, HIDDEN_SUGARS);
    if (sugars.length > 0) {
        foundIngredients.push(...sugars);
        hasAdditives = true;

        if (userConditions.some(c => ['t2d', 'diabetes', 'pcos', 'insulin resistance'].some(term => c.toLowerCase().includes(term)))) {
            if (safetyMessage === "Safe") {
                safetyMessage = "Warning: Hidden sugars detected. May spike insulin/glucose.";
            } else if (!safetyMessage.includes("CRITICAL") && !safetyMessage.includes("LETHAL")) {
                // Append if not already occupied by a more critical message
                safetyMessage += " Also contains hidden sugars.";
            }
        }
    }

    return {
        hasAdditives,
        dangerousIngredients: Array.from(new Set(foundIngredients)), // Dedupe
        safetyMessage
    };
}
