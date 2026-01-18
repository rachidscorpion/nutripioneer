
// Logic for identifying "Red Flag" additives defined in CKM Research

/**
 * RED FLAG: Inorganic Phosphates
 * strictly prohibited for CKD (Stages 3-5).
 * "Phosphate additives are 90-100% absorbed."
 */
export const PHOSPHATE_ADDITIVES = [
    /phosphoric/i,
    /phosphate/i,
    /sodium\s?prep/i, // Often hides sodium phosphate
    /calcium\s?diphosphate/i,
    /hexametaphosphate/i,
    /tripolyphosphate/i,
    /monocalcium\s?phosphate/i,
    /dicalcium\s?phosphate/i,
    /sodium\s?polyphosphate/i
];

/**
 * RED FLAG: Potassium Additives
 * strictly monitored for CKD (Stages 3b-5) and specific drug interactions.
 * "Potassium additives are often used for preservation and sodium reduction."
 */
export const POTASSIUM_ADDITIVES = [
    /potassium\s?chloride/i,
    /potassium\s?lactate/i,
    /potassium\s?sorbate/i,
    /potassium\s?citrate/i,
    /potassium\s?benzoate/i,
    /acesulfame\s?potassium/i // Sweetener, often relevant
];

/**
 * SODIUM ADDITIVES
 * General restriction for HTN/CKD/CVD
 */
export const SODIUM_ADDITIVES = [
    /monosodium\s?glutamate/i,
    /sodium\s?benzoate/i,
    /sodium\s?nitrite/i,
    /sodium\s?bi\s?carbonate/i,
    /disodium\s?guanylate/i
];

/**
 * RED FLAG: Hidden Sugars
 * T2D/PCOS Users
 * "cane juice", "maltodextrin", "rice syrup"
 */
export const HIDDEN_SUGARS = [
    /cane\s?juice/i,
    /cane\s?sugar/i,
    /maltodextrin/i,
    /rice\s?syrup/i,
    /corn\s?syrup/i,
    /high\s?fructose\s?corn\s?syrup/i,
    /dextrose/i,
    /fructose/i
];

// Helper to check a string (ingredient list) against patterns
export function containsAdditive(text: string, patterns: RegExp[]): boolean {
    if (!text) return false;
    return patterns.some(p => p.test(text));
}

// Return the list of matches found (for debugging or UI feedback)
export function getFoundAdditives(text: string, patterns: RegExp[]): string[] {
    if (!text) return [];
    return patterns.filter(p => p.test(text)).map(p => p.source);
}
