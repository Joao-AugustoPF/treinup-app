import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/src/context/AuthContext';
import { GymProvider } from '@/src/context/GymContext';
import { NotificationsProvider } from '@/src/context/NotificationContext';
import { PlanProvider } from '@/src/context/PlanContext';
import { PrivacyProvider } from '@/src/context/PrivacyContext';
import { TenantProvider } from '@/src/context/TenantContext';
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PaperProvider>
        <AuthProvider>
          <TenantProvider>
            <PlanProvider>
              <NotificationsProvider>
                <PrivacyProvider>
                  <GymProvider>
                    <Slot />
                    <StatusBar style="auto" />
                  </GymProvider>
                </PrivacyProvider>
              </NotificationsProvider>
            </PlanProvider>
          </TenantProvider>
        </AuthProvider>
      </PaperProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
