import {
    searchRecipes,
    searchFoods,
    getFoodDetails,
    getRecipeDetails,
    findFoodByBarcode,
    performNLPSearch
} from '../src/lib/fatsecret/fatsecret';

// Mock environment variables if running locally without .env loaded by Next.js
// Ideally, the user runs this with `dotenv` or similar if vars aren't set globally.
// But usually npx tsx should pick up .env if we configure it, or we rely on the user having them set.
// Let's assume the environment is set up or we can load it.
import fs from 'fs';
import path from 'path';

// Manually load .env
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.warn('Failed to load .env file manually:', e);
}
async function verify() {
    console.log('--- Verifying FatSecret API Helpers ---');

    try {
        // 1. Search Recipes
        console.log('\n1. Searching for "Chicken"...');
        const recipes = await searchRecipes('Chicken', 0, 3);
        console.log(`Found ${recipes.total_results} recipes.`);
        if (recipes.results.length > 0) {
            console.log('First recipe:', recipes.results[0].recipe_name);

            // 2. Get Recipe Details
            const recipeId = recipes.results[0].recipe_id;
            console.log(`\n2. Fetching details for recipe ID: ${recipeId}...`);
            const recipeDetails = await getRecipeDetails(recipeId);
            console.log('Recipe details fetched:', recipeDetails.recipe_name);
        }

        // 3. Search Foods
        console.log('\n3. Searching for "Banana"...');
        const foods = await searchFoods('Banana', 0, 3);
        console.log(`Found ${foods.total_results} foods.`);
        if (foods.results.length > 0) {
            console.log('First food:', foods.results[0].food_name);

            // 4. Get Food Details
            const foodId = foods.results[0].food_id;
            console.log(`\n4. Fetching details for food ID: ${foodId}...`);
            const foodDetails = await getFoodDetails(foodId);
            console.log('Food details fetched:', foodDetails.food_name);
        }

        // 5. Barcode Search (using a common one, e.g. Coke Zero or similar if valid, or just testing fail case)
        // 5449000000996 is Coca Cola 500ml (common EAN-13)
        console.log('\n5. Searching Barcode (5449000000996 - Coca Cola)...');
        const barcodeFood = await findFoodByBarcode('5449000000996');
        if (barcodeFood) {
            console.log('Barcode matched:', barcodeFood.food_name);
        } else {
            console.log('Barcode not found (expected if strictly US database or limit).');
        }

        // 6. NLP
        console.log('\n6. Testing NLP with "I ate 2 eggs and toast"...');
        const nlpResult = await performNLPSearch('I ate 2 eggs and toast');
        console.log('NLP Result:', JSON.stringify(nlpResult, null, 2).substring(0, 200) + '...');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
    }
}

verify();
