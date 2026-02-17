
// import { FoodNutrient } from '@/lib/usda/usda';

export interface FoodNutrient {
    nutrientNumber: string;
    value: number;
}

export function getNutrient(nutrients: FoodNutrient[] | undefined, number: string): number {
    const n = nutrients?.find(x => x.nutrientNumber === number);
    return n ? Math.round(n.value) : 0;
}

export function extractIngredients(meal: any): { name: string, measure: string }[] {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const item = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (item && item.trim()) {
            ingredients.push({ name: item.trim(), measure: measure?.trim() || '' });
        }
    }
    return ingredients;
}

export function isMealExcluded(meal: any, dietary: any, excludedIngredients: string[], ingredientsList: { name: string }[]) {
    const { dislikes, dislikeCuisines } = dietary;

    if (dislikeCuisines?.includes(meal.strArea)) {
        return true;
    }

    const mealIngredientNames = ingredientsList.map(i => i.name.toLowerCase());

    if (dislikes?.some((d: string) =>
        mealIngredientNames.some(name => name.includes(d.toLowerCase()))
    )) {
        return true;
    }

    if (excludedIngredients.some(d =>
        mealIngredientNames.some(name => name.includes(d.toLowerCase()))
    )) {
        return true;
    }

    return false;
}

export function getRandomSlice(count: number) {
    const minGap = 0;
    const maxGap = 20;

    if (count < minGap) {
        return { randomSliceStart: 0, randomSliceEnd: count };
    }

    const validMaxGap = Math.min(count, maxGap);
    const randomLength = Math.floor(Math.random() * (validMaxGap - minGap + 1)) + minGap;
    const maxStart = count - randomLength;
    const randomSliceStart = Math.floor(Math.random() * (maxStart + 1));
    const randomSliceEnd = randomSliceStart + randomLength;

    return { randomSliceStart, randomSliceEnd };
}
