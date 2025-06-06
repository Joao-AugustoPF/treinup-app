import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/context/AuthContext';
import { GymProvider } from '@/src/context/GymContext';
import { LocalizationProvider } from '@/src/context/LocalizationContext';
import { NotificationsProvider } from '@/src/context/NotificationContext';
import { PlanProvider } from '@/src/context/PlanContext';
import { PrivacyProvider } from '@/src/context/PrivacyContext';
import { ProfileProvider } from '@/src/context/ProfileContext';
import { TenantProvider } from '@/src/context/TenantContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

function ThemedLayout() {
  const { isDarkMode, isLoading } = useTheme();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <PaperProvider theme={{ dark: isDarkMode }}>
        <Slot />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </PaperProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <TenantProvider>
        <ProfileProvider>
          <PrivacyProvider>
            <NotificationsProvider>
              <LocalizationProvider>
                <ThemeProvider>
                  <GymProvider>
                    <PlanProvider>
                      <ThemedLayout />
                    </PlanProvider>
                  </GymProvider>
                </ThemeProvider>
              </LocalizationProvider>
            </NotificationsProvider>
          </PrivacyProvider>
        </ProfileProvider>
      </TenantProvider>
    </AuthProvider>
  );
}
