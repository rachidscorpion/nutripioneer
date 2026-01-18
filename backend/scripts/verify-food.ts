
import { foodService } from '../src/services/food.service';
import { plansService } from '../src/services/plans.service';

const MOCK_LIMITS = {
    daily_calories: { min: 1800, max: 2200 },
    nutrients: {
        NA: { max: 200, label: "Sodium" }, // Very low limit to trigger warning
        SUGAR: { max: 30 },
    },
    avoid_ingredients: ["high-fructose corn syrup"]
};

async function verify() {
    console.log("=== Verifying Food Search & Conflict Engine ===\n");

    // 1. Text Search (USDA)
    console.log("1. Testing Text Search (expecting USDA result):");
    try {
        const apple = await foodService.analyze("apple raw", MOCK_LIMITS);
        console.log("Result Source:", apple.source);
        console.log("Name:", apple.name);
        console.log("Conflict Check:", apple.bioavailability);
        if (apple.source !== 'USDA') console.warn("WARNING: Expected USDA source");
    } catch (e) {
        console.error("USDA Search Failed", e);
    }
    console.log("\n------------------------------------------------\n");

    // 2. Barcode Search (OFF)
    console.log("2. Testing Barcode Search (expecting OFF result for Nutella 3017620422003):");
    try {
        const nutella = await foodService.analyzeBarcode("3017620422003", MOCK_LIMITS);
        console.log("Result Source:", nutella.source);
        console.log("Name:", nutella.name);
        console.log("Conflict Check:", nutella.bioavailability);
        if (nutella.source !== 'OpenFoodFacts') console.warn("WARNING: Expected OFF source");
    } catch (e) {
        console.error("Barcode Search Failed", e);
    }
    console.log("\n------------------------------------------------\n");

    // 3. Text Search Fallback (Simulate fallback if USDA fails or returns empty)
    // Note: USDA usually returns something for generic queries.
    // Let's try a very specific branded item that USDA might miss but FatSecret needs token...
    // FatSecret integration requires credentials. If they are not set in env, this will fail.
    console.log("3. Testing Text Search Fallback (USDA -> FatSecret):");
    console.log("(Skipping explicit fallback test as it depends on API keys and data availability)");

    console.log("\n=== Verification Complete ===");
}

verify().catch(console.error);
