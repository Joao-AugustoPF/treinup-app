import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

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
    <PaperProvider>
      <AuthProvider>
        <TenantProvider>
          <NotificationsProvider>
            <GymProvider>
              <TenantProvider>
                <Slot />
                <StatusBar style="auto" />
              </TenantProvider>
            </GymProvider>
          </NotificationsProvider>
        </TenantProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
