'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api-client';

export type Theme =
    | 'light'
    | 'light-sea'
    | 'light-rose'
    | 'light-lavender'
    | 'light-mint'
    | 'dark'
    | 'dark-dracula'
    | 'dark-nord'
    | 'dark-forest'
    | 'dark-sunset';

export const THEMES: { id: Theme; label: string; type: 'light' | 'dark'; color: string }[] = [
    // Light Themes
    { id: 'light', label: 'Classic Light', type: 'light', color: '#f8fafc' },
    { id: 'light-sea', label: 'Sea Breeze', type: 'light', color: '#e0f2fe' },
    { id: 'light-rose', label: 'Rose Gold', type: 'light', color: '#fff1f2' },
    { id: 'light-lavender', label: 'Lavender', type: 'light', color: '#f3e8ff' },
    { id: 'light-mint', label: 'Fresh Mint', type: 'light', color: '#ecfdf5' },

    // Dark Themes
    { id: 'dark', label: 'Classic Dark', type: 'dark', color: '#1a1a1a' },
    { id: 'dark-dracula', label: 'Dracula', type: 'dark', color: '#282a36' },
    { id: 'dark-nord', label: 'Nordic', type: 'dark', color: '#2e3440' },
    { id: 'dark-forest', label: 'Deep Forest', type: 'dark', color: '#1b2d2a' },
    { id: 'dark-sunset', label: 'Midnight Sunset', type: 'dark', color: '#2d1b2e' },
];

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    // Theme Isolation Logic
    let effectiveTheme = theme;
    if (pathname === '/') {
        effectiveTheme = 'dark';
    } else if (pathname?.startsWith('/onboarding')) {
        effectiveTheme = 'light';
    }

    useEffect(() => {
        setMounted(true);
        // 1. Check local storage first
        const savedTheme = localStorage.getItem('theme') as Theme;
        // 2. Check system preference if no saved theme
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        // Validate saved theme is a valid theme, else fallback to system
        const isValidSaved = THEMES.some(t => t.id === savedTheme);
        const initialTheme = isValidSaved ? savedTheme : systemTheme;

        setThemeState(initialTheme);

        // Initial application of theme (will be overridden by effect below if needed, but good for initial paint)
        if (pathname === '/') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (pathname?.startsWith('/onboarding')) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', initialTheme);
        }

        // 3. Try to fetch user preference if logged in
        api.user.getProfile().then(res => {
            if (res.data && res.data.data && res.data.data.preferences) {
                try {
                    const prefs = JSON.parse(res.data.data.preferences);
                    if (prefs.theme && THEMES.some(t => t.id === prefs.theme)) {
                        setThemeState(prefs.theme);
                        // DOM update handled by useEffect on theme change
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

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', effectiveTheme);
    }, [effectiveTheme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        // DOM update handled by useEffect above

        // Persist to backend using dedicated preferences endpoint (no side effects)
        api.user.updatePreferences({
            preferences: JSON.stringify({ theme: newTheme })
        }).catch(err => console.error("Failed to persist theme", err));
    };

    const toggleTheme = () => {
        // Simple toggle cycles between default light and dark for backward compatibility / quick switch
        setTheme(theme.startsWith('light') ? 'dark' : 'light');
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
