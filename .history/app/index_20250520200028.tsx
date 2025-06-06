import { useAuth } from '@/src/context/AuthContext';
import { useTenant } from '@/src/context/TenantContext';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { activeTenantId, isLoading: isLoadingTenant } = useTenant();

  console.log('isLoadingAuth', isLoadingAuth);
  console.log('isLoadingTenant', isLoadingTenant);

  if (isLoadingAuth || isLoadingTenant) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="rgba(255,20,147,0.7)" />
      </View>
    );
  }

  console.log(user)

  if (user && !activeTenantId) {
    return <Redirect href="/plans" />;
  }

  if (user) {
    return <Redirect href="/workouts" />;
  }

  const sourceImage = require('@/assets/images/fitness-background.png');

  return (
    <ImageBackground source={sourceImage} style={styles.background}>
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.2)',
          'rgba(255,20,147,0.7)',
          'rgba(128,0,128,0.9)',
        ]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.topContent}>
            <Text variant="displaySmall" style={styles.title}>
              Fique em Forma
            </Text>
            <Text style={styles.subtitle}>
              Dê o primeiro passo para uma vida mais saudável.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => router.push('/login')}
              style={styles.loginButton}
              labelStyle={styles.loginButtonText}
              buttonColor="white"
            >
              Entrar
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.push('/register')}
              style={styles.signUpButton}
              labelStyle={styles.signUpButtonText}
            >
              Cadastrar
            </Button>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  topContent: {
    marginTop: 60,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 40,
    marginBottom: 8,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 12,
  },
  loginButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 6,
  },
  loginButtonText: {
    color: '#FF1493',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    borderColor: 'white',
    borderRadius: 30,
    paddingVertical: 6,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
