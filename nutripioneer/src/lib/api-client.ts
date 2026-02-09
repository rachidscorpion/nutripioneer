// public-api-url: https://5-78-150-159.sslip.io

import axios from 'axios';


const isServer = typeof window === 'undefined';

// Server-side: Use internal backend URL (for Docker networking or localhost)
// Client-side: Use public API URL from environment or current origin
const API_URL = isServer
    ? process.env.BACKEND_URL
    : process.env.NEXT_PUBLIC_API_URL;

// Validate that API_URL is set
if (!API_URL) {
    const errorMsg = isServer
        ? '❌ BACKEND_URL environment variable is not set. Please check your .env file.'
        : '❌ NEXT_PUBLIC_API_URL environment variable is not set. Please check your .env file.';
    throw new Error(errorMsg);
}

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 API Configuration (${isServer ? 'server' : 'client'}):`, {
        API_URL,
        isServer,
        BACKEND_URL: process.env.BACKEND_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
    });
}




const apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Send cookies (Better Auth session)
});

// Auth uses httpOnly cookies automatically for requests


export const api = {
    auth: {
        login: (credentials: any) => apiClient.post('/auth/login', credentials),
        register: (data: any) => apiClient.post('/auth/register', data),
        logout: () => apiClient.post('/auth/sign-out'),
        signInSocial: (provider: string) => apiClient.post('/auth/sign-in/social', {
            provider,
            callbackURL: typeof window !== 'undefined' ? `${window.location.origin}/home` : '/home'
        }),
    },
    user: {
        getProfile: () => apiClient.get('/users/profile'),
        updateProfile: (data: any) => apiClient.patch('/users/profile', data),
        deleteTestUser: () => apiClient.delete('/users/test-account'), // Hypothetical
        // Nutrition Limits
        getNutritionLimits: () => apiClient.get('/users/profile/nutrition-limits'),
        updateNutritionLimits: (data: any) => apiClient.put('/users/profile/nutrition-limits', data),
        generateNutritionLimits: () => apiClient.post('/users/profile/generate-limits', {}, {
            timeout: 60000 // 60 seconds
        }),
    },
    plans: {
        getDaily: (date: string) => apiClient.get(`/plans/daily?date=${date}`),
        generate: (date: string) => apiClient.post('/plans/generate', { date }),
        updateStatus: (id: string, type: string, status: string) => apiClient.patch(`/plans/${id}/status`, { type, status }),
        update: (id: string, data: any) => apiClient.patch(`/plans/${id}`, data),
        delete: (date: string) => apiClient.delete(`/plans/daily?date=${date}`),
        addExternalMeal: (data: any) => apiClient.post('/plans/external-meal', data),
        removeMeal: (planId: string, type: string) => apiClient.delete(`/plans/${planId}/meals/${type}`), // Add this
    },
    meals: {
        swap: (planId: string, type: string) => apiClient.post(`/plans/${planId}/meals/${type}/swap`, {}),
    },
    recipes: {
        regenerateAll: () => apiClient.post('/recipes/regenerate-all'),
        deleteAll: () => apiClient.delete('/recipes/storage/all'),
    },
    items: {
        // Placeholder if needed for specific item actions
    },
    food: {
        analyze: (query: string, type?: 'Brand' | 'Generic') => apiClient.get(`/food/analyze?q=${query}${type ? `&type=${type}` : ''}`),
        search: (query: string, type?: 'Brand' | 'Generic') => apiClient.get(`/food/search?q=${query}${type ? `&type=${type}` : ''}`),
        analyzeBarcode: (code: string) => apiClient.get(`/food/barcode/${code}`),
    },
    grocery: {
        list: () => apiClient.get('/grocery'),
        add: (name: string) => apiClient.post('/grocery', { name }),
        toggle: (id: string, isChecked: boolean) => apiClient.patch(`/grocery/${id}/toggle`, { isChecked }),
        remove: (id: string) => apiClient.delete(`/grocery/${id}`),
        clear: () => apiClient.delete('/grocery/all'), // Assumed endpoint
        seed: () => apiClient.post('/grocery/seed', {}), // Assumed endpoint
        addIngredients: (ingredients: string[]) => apiClient.post('/grocery/ingredients', { ingredients }),
        generateShoppingList: (entries: any[]) => apiClient.post('/grocery/generate', { entries }),
    },
    conditions: {
        list: () => apiClient.get('/conditions'),
        search: (query: string) => apiClient.get(`/conditions/search?q=${encodeURIComponent(query)}`),
        onboard: (data: any) => apiClient.post('/conditions/onboard', data),
        getById: (id: string) => apiClient.get(`/conditions/${id}`),
    },
    metrics: {
        log: (data: any) => apiClient.post('/metrics', data),
        history: () => apiClient.get('/metrics'),
    },
    drugs: {
        search: (query: string) => apiClient.get(`/drugs/search?q=${query}`),
        details: (name: string, rxcui: string) => apiClient.get(`/drugs/details?name=${name}&rxcui=${rxcui}`),
    },
    products: {
        list: () => apiClient.get('/products'),
        get: (id: string) => apiClient.get(`/products/${id}`),
    },
    menu: {
        scan: (image: File) => {
            const formData = new FormData();
            formData.append('image', image);
            return apiClient.post('/menu/scan', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
    },
};

export default apiClient;
