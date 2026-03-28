import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.nutripioneer.com';

// Global reference to auth logout function
// This will be set by AuthContext to allow API client to trigger logout on 401
let authLogoutCallback: (() => Promise<void>) | null = null;

export const setAuthLogoutCallback = (callback: () => Promise<void>) => {
    authLogoutCallback = callback;
};

if (!API_URL) {
    throw new Error('❌ EXPO_PUBLIC_API_URL environment variable is not set. Please check your .env file.');
}

const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        // React Native fetch handles origins poorly, Better Auth requires an origin for CSRF
        'Origin': API_URL.includes('localhost') || API_URL.includes('127.0.0.1') ? API_URL : 'https://nutripioneer.com',
    },
    withCredentials: true,
});

apiClient.interceptors.request.use(
    async (config) => {
        if (!config.headers.Authorization) {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        // Prevent aggressive caching on iOS for GET requests
        if (config.method?.toLowerCase() === 'get') {
            config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            config.headers['Pragma'] = 'no-cache';
            config.headers['Expires'] = '0';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Clear token from storage
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');

            // Clear Authorization header
            delete apiClient.defaults.headers.common['Authorization'];

            // Trigger auth logout if callback is registered
            if (authLogoutCallback) {
                try {
                    await authLogoutCallback();
                } catch (logoutError) {
                    console.error('Error during auth logout:', logoutError);
                }
            }
        }
        return Promise.reject(error);
    }
);

export const api = {
    auth: {
        login: (credentials: { email: string; password: string }) =>
            apiClient.post('/auth/login', credentials),
        register: (data: { email: string; password: string; name: string }) =>
            apiClient.post('/auth/register', data),
        logout: () =>
            apiClient.post('/auth/sign-out'),
        sendOtp: (email: string, type: string) =>
            apiClient.post('/auth/send-otp', { email, type }),
        verifyOtp: (email: string, otp: string) =>
            apiClient.post('/auth/verify-otp', { email, otp }),
        signInSocial: (provider: string, callbackURL?: string) =>
            apiClient.post('/auth/sign-in/social', { provider, callbackURL }),
        signInWithGoogle: (idToken: string) =>
            apiClient.post('/auth/sign-in/google', { idToken }),
        signInWithApple: (idToken: string, user?: any) =>
            apiClient.post('/auth/sign-in/apple', { idToken, user }),
    },
    user: {
        getProfile: () => apiClient.get('/users/profile'),
        updateProfile: (data: any) => apiClient.patch('/users/profile', data),
        updatePreferences: (data: any) => apiClient.patch('/users/profile/preferences', data),
        deleteAccount: () => apiClient.delete('/users/account'),
        deleteTestUser: () => apiClient.delete('/users/test-account'),
        getNutritionLimits: () => apiClient.get('/users/profile/nutrition-limits'),
        updateNutritionLimits: (data: any) => apiClient.put('/users/profile/nutrition-limits', data),
        generateNutritionLimits: () => apiClient.post('/users/profile/generate-limits', {}, {
            timeout: 60000,
        }),
        validateReceipt: (data: { platform: string; receipt: string; productId: string; originalTransactionId?: string }) =>
            apiClient.post('/users/validate-receipt', data),
    },
    plans: {
        getDaily: (date: string) => apiClient.get(`/plans/daily?date=${date}`),
        generate: (date: string) => apiClient.post('/plans/generate', { date }),
        updateStatus: (id: string, type: string, status: string) =>
            apiClient.patch(`/plans/${id}/status`, { type, status }),
        update: (id: string, data: any) => apiClient.patch(`/plans/${id}`, data),
        delete: (date: string) => apiClient.delete(`/plans/daily?date=${date}`),
        addExternalMeal: (data: any) => apiClient.post('/plans/external-meal', data),
        removeMeal: (planId: string, type: string) =>
            apiClient.delete(`/plans/${planId}/meals/${type}`),
    },
    meals: {
        swap: (planId: string, type: string) =>
            apiClient.post(`/plans/${planId}/meals/${type}/swap`, {}),
    },
    recipes: {
        regenerateAll: () => apiClient.post('/recipes/regenerate-all'),
        deleteAll: () => apiClient.delete('/recipes/storage/all'),
        getInstructions: (url: string) => apiClient.get(`/recipe?url=${encodeURIComponent(url)}`),
    },
    items: {},
    food: {
        analyze: (query: string, type?: 'Brand' | 'Generic') =>
            apiClient.get(`/food/analyze?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`),
        search: (query: string, type?: 'Brand' | 'Generic') =>
            apiClient.get(`/food/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`),
        analyzeBarcode: (code: string) => apiClient.get(`/food/barcode/${code}`),
    },
    grocery: {
        list: () => apiClient.get('/grocery'),
        add: (name: string) => apiClient.post('/grocery', { name }),
        toggle: (id: string, isChecked: boolean) =>
            apiClient.patch(`/grocery/${id}/toggle`, { isChecked }),
        remove: (id: string) => apiClient.delete(`/grocery/${id}`),
        clear: () => apiClient.delete('/grocery/all'),
        seed: () => apiClient.post('/grocery/seed', {}),
        addIngredients: (ingredients: string[]) =>
            apiClient.post('/grocery/ingredients', { ingredients }),
        generateShoppingList: (entries: any[]) => apiClient.post('/grocery/generate', { entries }),
    },
    conditions: {
        list: () => apiClient.get('/conditions'),
        search: (query: string) =>
            apiClient.get(`/conditions/search?q=${encodeURIComponent(query)}`),
        onboard: (data: any) => apiClient.post('/conditions/onboard', data),
        getById: (id: string) => apiClient.get(`/conditions/${id}`),
    },
    metrics: {
        log: (data: any) => apiClient.post('/metrics', data),
        history: () => apiClient.get('/metrics'),
    },
    drugs: {
        search: (query: string) =>
            apiClient.get(`/drugs/search?q=${encodeURIComponent(query)}`),
        details: (name: string, rxcui: string) =>
            apiClient.get(`/drugs/details?name=${encodeURIComponent(name)}&rxcui=${rxcui}`),
    },
    products: {
        list: () => apiClient.get('/products'),
        get: (id: string) => apiClient.get(`/products/${id}`),
    },
    menu: {
        scan: (image: any) => {
            const formData = new FormData();
            formData.append('image', {
                uri: image.uri,
                type: image.type || 'image/jpeg',
                name: image.name || 'photo.jpg',
            } as any);
            return apiClient.post('/menu/scan', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
    },
    feedback: {
        submit: (data: any) => apiClient.post('/feedback', data),
    },
    savedRecipes: {
        list: () => apiClient.get('/users/saved-recipes'),
        save: (recipeId: string) => apiClient.post('/users/saved-recipes', { recipeId }),
        unsave: (recipeId: string) => apiClient.delete(`/users/saved-recipes/${recipeId}`),
        check: (recipeId: string) => apiClient.get(`/users/saved-recipes/${recipeId}/check`),
    },
};

export default apiClient;

// Note: These functions are kept for backward compatibility but should be replaced with AuthContext
export const setAuthToken = async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
};

export const getAuthToken = async () => {
    return await AsyncStorage.getItem('auth_token');
};

export const clearAuthToken = async () => {
    await AsyncStorage.removeItem('auth_token');
};
