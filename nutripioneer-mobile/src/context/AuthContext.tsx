import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../lib/auth';
import { User } from '../types/api';
import apiClient, { setAuthLogoutCallback } from '../lib/api-client';
import { api } from '../lib/api-client';
import { AppState } from 'react-native';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token;

  const login = async (authToken: string, authUser: User) => {
    await authService.setAuth(authToken, authUser);
    setToken(authToken);
    setUser(authUser);

    // Update axios instance for immediate use
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = useCallback(async () => {
    await authService.clearAuth();
    setToken(null);
    setUser(null);

    // Clear axios Authorization header
    delete apiClient.defaults.headers.common['Authorization'];
  }, []);

  const restoreSession = async () => {
    try {
      setIsLoading(true);

      // Check for stored token
      const storedToken = await authService.getToken();
      const storedUser = await authService.getUser();

      if (!storedToken) {
        // No token found, user is not logged in
        setIsLoading(false);
        return;
      }

      // Verify token is still valid by making an API call
      try {
        // Set token temporarily for validation
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        const profileRes = await api.user.getProfile();
        const validUser = profileRes.data?.data;

        if (validUser) {
          // Token is valid, restore session
          setToken(storedToken);
          setUser(validUser);
        } else {
          // Token invalid or user not found, clear storage
          await authService.clearAuth();
        }
      } catch (apiError) {
        // API call failed, token is likely expired or invalid
        console.error('Token validation failed:', apiError);
        await authService.clearAuth();
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      await authService.clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const profileRes = await api.user.getProfile();
      const validUser = profileRes.data?.data;
      if (validUser) {
        setUser(validUser);
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  }, [token]);

  // Refresh user state when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && token) {
        refreshUser();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [token, refreshUser]);

  // Register logout callback with API client for 401 handling
  useEffect(() => {
    setAuthLogoutCallback(logout);

    // Cleanup callback on unmount
    return () => {
      setAuthLogoutCallback(() => Promise.resolve());
    };
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    restoreSession,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
