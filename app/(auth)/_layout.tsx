import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
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
      initialRouteName="login"
    />
  );
}
