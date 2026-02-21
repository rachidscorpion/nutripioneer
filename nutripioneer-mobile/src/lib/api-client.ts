import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.nutripioneer.com';

if (!API_URL) {
    throw new Error('❌ EXPO_PUBLIC_API_URL environment variable is not set. Please check your .env file.');
}

const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('auth_token');
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
        signInSocial: (provider: string, callbackURL?: string) => 
            apiClient.post('/auth/sign-in/social', { provider, callbackURL }),
        signInWithGoogle: (idToken: string) => 
            apiClient.post('/auth/sign-in/google', { idToken }),
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
};

export default apiClient;

export const setAuthToken = async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
};

export const getAuthToken = async () => {
    return await AsyncStorage.getItem('auth_token');
};

export const clearAuthToken = async () => {
    await AsyncStorage.removeItem('auth_token');
};
