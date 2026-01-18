import axios from "axios";

const apiKey = "65232507";

const mealDBAPI = axios.create({
    baseURL: `https://www.themealdb.com/api/json/v2/${apiKey}/`,
});

export const getCategories = async () => {
    const response = await mealDBAPI.get("categories.php");
    return response.data;
}

export const getAreas = async () => {
    const response = await mealDBAPI.get("list.php?a=list");
    return response.data;
}

export const getIngredients = async () => {
    const response = await mealDBAPI.get("list.php?i=list");
    return response.data;
}

// Search
export const searchMealByName = async (name: string) => {
    const response = await mealDBAPI.get(`search.php?s=${name}`);
    return response.data;
};

export const listMealsByFirstLetter = async (letter: string) => {
    const response = await mealDBAPI.get(`search.php?f=${letter}`);
    return response.data;
};

// Lookup
export const getMealById = async (id: string) => {
    const response = await mealDBAPI.get(`lookup.php?i=${id}`);
    return response.data;
};

export const getRandomMeal = async () => {
    const response = await mealDBAPI.get("random.php");
    return response.data;
};

export const getRandomSelection = async () => {
    const response = await mealDBAPI.get("randomselection.php");
    return response.data;
};

export const getLatestMeals = async () => {
    const response = await mealDBAPI.get("latest.php");
    return response.data;
};

// List
export const getCategoryList = async () => {
    const response = await mealDBAPI.get("list.php?c=list");
    return response.data;
};

// Filter
export const filterByIngredient = async (ingredient: string) => {
    const response = await mealDBAPI.get(`filter.php?i=${ingredient}`);
    return response.data;
};

export const filterByMultiIngredient = async (ingredients: string[]) => {
    const response = await mealDBAPI.get(`filter.php?i=${ingredients.join(",")}`);
    return response.data;
};

export const filterByCategory = async (category: string) => {
    const response = await mealDBAPI.get(`filter.php?c=${category}`);
    return response.data;
};

export const filterByArea = async (area: string) => {
    const response = await mealDBAPI.get(`filter.php?a=${area}`);
    return response.data;
};