import { useAuth } from '@/src/context/AuthContext';
import { ProfileService } from '@/src/services/profile';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const { user } = useAuth();
  const theme = scheme === 'dark' ? DarkTheme : LightTheme;
  const [isLoading, setIsLoading] = useState(true);
  const [userPreference, setUserPreference] = useState<boolean | null>(null);

  // Load user preference from profile
  useEffect(() => {
    async function loadThemePreference() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profile = await ProfileService.getUserProfile(user);
        setUserPreference(profile.preferences.darkMode);

        // Apply user preference
        if (
          profile.preferences.darkMode !== null &&
          profile.preferences.darkMode !== undefined
        ) {
          setThemeState(profile.preferences.darkMode ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadThemePreference();
  }, [user]);

  // Save theme preference to profile
  const saveThemePreference = async (isDark: boolean) => {
    if (!user) return;

    try {
      await ProfileService.updatePreferences(user, { darkMode: isDark });
      setUserPreference(isDark);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    saveThemePreference(newTheme === 'dark');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === 'dark',
        setTheme,
        toggleTheme,
        isLoading,
      }}
    >
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
