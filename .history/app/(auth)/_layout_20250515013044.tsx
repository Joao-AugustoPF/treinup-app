import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          headerTintColor: 'white',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTransparent: true,
          presentation: 'transparentModal',
        }}
        initialRouteName="index"
      />
    </SafeAreaView>
  );
}
