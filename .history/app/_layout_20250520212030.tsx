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

function ThemedLayout() {
  const { paperTheme, isLoading } = useTheme();
  if (isLoading) return null;

  // Compose React Navigation theme from paperTheme
  const navBase = paperTheme.dark ? NavDark : NavLight;
  const navigationTheme = {
    ...navBase,
    colors: {
      ...navBase.colors,
      ...paperTheme.colors,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Slot />
      <StatusBar style={paperTheme.dark ? 'light' : 'dark'} />
    </NavigationContainer>
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
          </ProfileProvider>
        </PrivacyProvider>
      </TenantProvider>
    </AuthProvider>
  );
}
