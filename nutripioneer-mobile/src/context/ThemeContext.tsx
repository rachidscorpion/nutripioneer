import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api-client';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  danger: string;
}

const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  primary: '#10b981',
  danger: '#ef4444',
};

const darkColors: ThemeColors = {
  background: '#0a0a0a',
  card: '#18181b', // matching the existing generic rgba(255,255,255,0.05) look
  text: '#ffffff',
  textMuted: '#a1a1aa',
  border: 'rgba(255,255,255,0.1)',
  primary: '#10b981',
  danger: '#ef4444',
};

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  selectedTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [selectedTheme, setSelectedThemeState] = useState<ThemeType>('dark');

  // Load initial theme preference from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setSelectedThemeState(storedTheme as ThemeType);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setSelectedThemeState(newTheme);
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      // Optional: Since this is global, if user is logged in, sync to backend here or let screens handle it
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const isDark = 
    selectedTheme === 'dark' || 
    (selectedTheme === 'system' && systemColorScheme === 'dark');

  const themeColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme: themeColors, isDark, selectedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
