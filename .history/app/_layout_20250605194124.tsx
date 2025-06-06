import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/context/AuthContext';
import { GymProvider } from '@/src/context/GymContext';
import { LocalizationProvider } from '@/src/context/LocalizationContext';
import { NotificationsProvider } from '@/src/context/NotificationContext';
import { PlanProvider } from '@/src/context/PlanContext';
import { PrivacyProvider } from '@/src/context/PrivacyContext';
import { ProfileProvider } from '@/src/context/ProfileContext';
import { PushNotificationProvider } from '@/src/context/PushNotificationContext';
import { TenantProvider } from '@/src/context/TenantContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import {
  DarkTheme,
  LightTheme,
  NavigationDarkTheme,
  NavigationLightTheme,
} from '@/src/lib/theme';
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: 
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function ThemedLayout() {
  const { isDark, isLoading } = useTheme();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationThemeProvider
      value={isDark ? NavigationDarkTheme : NavigationLightTheme}
    >
      <PaperProvider theme={isDark ? DarkTheme : LightTheme}>
        <Slot />
        <StatusBar style={isDark ? 'light' : 'dark'} />
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
        <PrivacyProvider>
          <ProfileProvider>
            <NotificationsProvider>
              <PushNotificationProvider>
                <LocalizationProvider>
                  <ThemeProvider>
                    <GymProvider>
                      <PlanProvider>
                        <ThemedLayout />
                      </PlanProvider>
                    </GymProvider>
                  </ThemeProvider>
                </LocalizationProvider>
              </PushNotificationProvider>
            </NotificationsProvider>
          </ProfileProvider>
        </PrivacyProvider>
      </TenantProvider>
    </AuthProvider>
  );
}
