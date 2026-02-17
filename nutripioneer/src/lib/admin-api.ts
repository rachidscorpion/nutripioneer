'use client';

import axios from 'axios';
import { getAdminToken } from './admin-auth';

const isServer = typeof window === 'undefined';

const API_URL = isServer
    ? process.env.BACKEND_URL
    : process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error('API_URL is not set');
}

const adminApiClient = axios.create({
    baseURL: `${API_URL}/api/admin`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
adminApiClient.interceptors.request.use((config) => {
    const token = getAdminToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
adminApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_email');
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

export const adminApi = {
    // Authentication
    login: (email: string, password: string) =>
        adminApiClient.post('/login', { email, password }),

    // Analytics
    analytics: {
        getOverview: () => adminApiClient.get('/analytics/overview'),
        getSignups: (days: number = 30) =>
            adminApiClient.get('/analytics/signups', { params: { days } }),
        getConditions: () => adminApiClient.get('/analytics/conditions'),
        getMeals: () => adminApiClient.get('/analytics/meals'),
        getRecipes: (limit: number = 10) =>
            adminApiClient.get('/analytics/recipes', { params: { limit } }),
        getSubscriptions: () => adminApiClient.get('/analytics/subscriptions'),
        getOnboarding: () => adminApiClient.get('/analytics/onboarding'),
        getFeedback: () => adminApiClient.get('/analytics/feedback'),
        getMetrics: (days: number = 30) =>
            adminApiClient.get('/analytics/metrics', { params: { days } }),
    },

    // Database Management
    db: {
        getModels: () => adminApiClient.get('/db/models'),
        list: (
            model: string,
            page: number = 1,
            limit: number = 25,
            sort: string = 'id',
            order: 'asc' | 'desc' = 'desc',
            search?: string
        ) =>
            adminApiClient.get(`/db/${model}`, {
                params: { page, limit, sort, order, search },
            }),
        getById: (model: string, id: string) =>
            adminApiClient.get(`/db/${model}/${id}`),
        update: (model: string, id: string, data: Record<string, any>) =>
            adminApiClient.patch(`/db/${model}/${id}`, data),
        delete: (model: string, id: string) =>
            adminApiClient.delete(`/db/${model}/${id}`),
        executeQuery: (sql: string, allowWrite: boolean = false) =>
            adminApiClient.post('/db/query', { sql, allowWrite }),
    },
};

export default adminApiClient;
