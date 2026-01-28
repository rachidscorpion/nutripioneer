'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 1. Check local storage first
        const savedTheme = localStorage.getItem('theme') as Theme;
        // 2. Check system preference if no saved theme
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        const initialTheme = savedTheme || systemTheme;
        setThemeState(initialTheme);
        document.documentElement.dataset.theme = initialTheme;

        // 3. Try to fetch user preference if logged in (optional here, might be better done in a layout or hook that knows auth state)
        // For now, we rely on the Profile page to hydrate or efficient initial load if we want perfect sync.
        // Or we can fetch profile here lightly.
        api.user.getProfile().then(res => {
            if (res.data && res.data.data && res.data.data.preferences) {
                try {
                    const prefs = JSON.parse(res.data.data.preferences);
                    if (prefs.theme) {
                        setThemeState(prefs.theme);
                        document.documentElement.dataset.theme = prefs.theme;
                        localStorage.setItem('theme', prefs.theme);
                    }
                } catch (e) {
                    console.error("Failed to parse preferences", e);
                }
            }
        }).catch(() => {
            // Not logged in or error
        });

    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.dataset.theme = newTheme;

        // Persist to backend
        api.user.updateProfile({
            preferences: JSON.stringify({ theme: newTheme })
        }).catch(err => console.error("Failed to persist theme", err));
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
