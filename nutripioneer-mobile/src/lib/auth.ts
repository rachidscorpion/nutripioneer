import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types/api';

const AUTH_TOKEN_KEY = '@nutripioneer_auth_token';
const USER_KEY = '@nutripioneer_user';

export const authService = {
    async setAuth(token: string, user: User) {
        try {
            await AsyncStorage.multiSet([
                [AUTH_TOKEN_KEY, token],
                [USER_KEY, JSON.stringify(user)],
            ]);
        } catch (error) {
            console.error('Error storing auth data:', error);
            throw error;
        }
    },

    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    async getUser(): Promise<User | null> {
        try {
            const userJson = await AsyncStorage.getItem(USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async clearAuth() {
        try {
            await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
        } catch (error) {
            console.error('Error clearing auth data:', error);
            throw error;
        }
    },

    async isAuthenticated(): Promise<boolean> {
        const token = await this.getToken();
        return token !== null;
    },
};

export const handleLogin = async (response: AuthResponse) => {
    const { user, session } = response;
    const token = session?.token || '';
    
    if (!token) {
        throw new Error('No token received from server');
    }
    
    await authService.setAuth(token, user);
    return user;
};

export const handleLogout = async () => {
    await authService.clearAuth();
};
