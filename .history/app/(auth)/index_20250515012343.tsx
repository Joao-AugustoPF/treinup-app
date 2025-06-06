import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const [imageError, setImageError] = useState(false);

  return (
    <>
      {imageError ? (
        <LinearGradient
          colors={['#FF1493', '#C71585', '#800080']}
          style={styles.background}
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
                onPress={() => router.push('/(auth)/login')}
                style={styles.loginButton}
                labelStyle={styles.loginButtonText}
                buttonColor="#FF1493"
              >
                Entrar
              </Button>

              <Button
                mode="outlined"
                onPress={() => router.push('/(auth)/register')}
                style={styles.signUpButton}
                labelStyle={styles.signUpButtonText}
              >
                Cadastrar
              </Button>
            </View>
          </SafeAreaView>
        </LinearGradient>
      ) : (
        <ImageBackground
          source={require('../../assets/images/fitness-background.png')}
          style={styles.background}
          onError={() => setImageError(true)}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
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
                  onPress={() => router.push('/(auth)/login')}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonText}
                  buttonColor="#FF1493"
                >
                  Entrar
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => router.push('/(auth)/register')}
                  style={styles.signUpButton}
                  labelStyle={styles.signUpButtonText}
                >
                  Cadastrar
                </Button>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>
      )}
    </>
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
    backgroundColor: '#FF1493',
    borderRadius: 30,
    paddingVertical: 6,
  },
  loginButtonText: {
    color: 'white',
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
