import { useAuth } from '@/src/context/AuthContext';
import { ProfileService } from '@/src/services/profile';
import { DarkTheme, LightTheme } from '@/src/lib/theme';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { PaperProvider, Theme as PaperTheme } from 'react-native-paper';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  themeType: ThemeType;
  isDark: boolean;
  setThemeType: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isLoading: boolean;
  paperTheme: PaperTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme() || 'light';
  const { user } = useAuth();

  const [themeType, setThemeState] = useState<ThemeType>(
    systemScheme === 'dark' ? 'dark' : 'light'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userPreference, setUserPreference] = useState<boolean | null>(null);

  // Load user preference from profile
  useEffect(() => {
    async function loadThemePreference() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const profile = await ProfileService.getUserProfile(user);
        const darkModePref = profile.preferences.darkMode;
        setUserPreference(darkModePref);

        if (darkModePref !== null && darkModePref !== undefined) {
          setThemeState(darkModePref ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadThemePreference();
  }, [user]);

  // Save user preference
  const saveThemePreference = async (isDark: boolean) => {
    if (!user) return;
    try {
      await ProfileService.updatePreferences(user, { darkMode: isDark });
      setUserPreference(isDark);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setThemeType = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    saveThemePreference(newTheme === 'dark');
  };

  const toggleTheme = () => {
    const next = themeType === 'dark' ? 'light' : 'dark';
    setThemeType(next);
  };

  const paperTheme = themeType === 'dark' ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider
      value={{
        themeType,
        isDark: themeType === 'dark',
        setThemeType,
        toggleTheme,
        isLoading,
        paperTheme,
      }}
    >
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
