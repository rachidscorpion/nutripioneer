
import { getNutritionFromBarcode } from './usda';

async function verifyFallback() {
    console.log("--- Testing USDA Fallback to OpenFoodFacts ---");

    // Barcode that is likely NOT in USDA but IS in OFF
    // Using the SunButter one from the prompt: 0737539194022
    // USDA usually doesn't have every specific branded item, or matching might fail.
    // If USDA has it, we might need a European product that USDA definitely won't have.
    // Let's try the SunButter implementation first, if it finds it in USDA, we'll try another.

    const barcode = "0737539194022";
    console.log(`\nTesting barcode: ${barcode}`);

    try {
        const result = await getNutritionFromBarcode(barcode);

        if (result) {
            console.log("\n✅ Product Found!");
            console.log("Name:", result.name);
            console.log("Brand:", result.brand);
            console.log("Source:", result.rawProduct.code ? "OpenFoodFacts (likely)" : "USDA (likely)");

            // Check specific fallback field
            if (result.rawProduct.code) {
                console.log("Verified: Result came from OpenFoodFacts fallback.");
            } else {
                console.log("Note: Result came from USDA. Trying another barcode for fallback test...");
                // Try a French product: Nutella (French jar) - 3017620422003
                await testFallback("3017620422003");
            }
        } else {
            console.log("❌ Product not found in either service.");
        }

    } catch (error) {
        console.error("Error during test:", error);
    }
}

async function testFallback(barcode: string) {
    console.log(`\nTesting barcode: ${barcode} (Force Fallback check)`);
    const result = await getNutritionFromBarcode(barcode);
    if (result) {
        console.log("\n✅ Product Found!");
        console.log("Name:", result.name);
        console.log("Brand:", result.brand);
        if (result.rawProduct.code) {
            console.log("Verified: Result came from OpenFoodFacts fallback.");
        } else {
            console.log("Result still from USDA? That is unexpected for this barcode.");
        }
    } else {
        console.log("❌ Product not found in either service.");
    }
}

verifyFallback();
