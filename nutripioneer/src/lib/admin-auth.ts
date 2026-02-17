'use client';

import { useState, useEffect } from 'react';
import apiClient from './api-client';

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_EMAIL_KEY = 'admin_email';

interface AdminAuthState {
    isAuthenticated: boolean;
    email: string | null;
    token: string | null;
}

export function useAdminAuth() {
    const [authState, setAuthState] = useState<AdminAuthState>({
        isAuthenticated: false,
        email: null,
        token: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        const email = localStorage.getItem(ADMIN_EMAIL_KEY);

        if (token && email) {
            setAuthState({
                isAuthenticated: true,
                email,
                token,
            });
        }

        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await apiClient.post('/admin/login', { email, password });
            const { success, data, error } = response.data;

            if (success && data) {
                const { token, email: adminEmail } = data;
                localStorage.setItem(ADMIN_TOKEN_KEY, token);
                localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail);

                setAuthState({
                    isAuthenticated: true,
                    email: adminEmail,
                    token,
                });

                return { success: true };
            } else {
                return { success: false, error: error || 'Login failed' };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Login failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_EMAIL_KEY);
        setAuthState({
            isAuthenticated: false,
            email: null,
            token: null,
        });
    };

    return {
        ...authState,
        isLoading,
        login,
        logout,
    };
}

export function getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string, email: string): void {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_EMAIL_KEY, email);
}

export function clearAdminToken(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
}
