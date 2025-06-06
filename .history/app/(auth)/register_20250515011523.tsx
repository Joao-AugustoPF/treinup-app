import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register(email, password, name);
      router.replace('/plans');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FF7043', '#5D4037']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              Create Account
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              To get started!
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              contentStyle={styles.inputContent}
              theme={{
                colors: {
                  primary: 'white',
                  text: 'white',
                  placeholder: 'rgba(255,255,255,0.7)',
                },
              }}
              textColor="white"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              contentStyle={styles.inputContent}
              theme={{
                colors: {
                  primary: 'white',
                  text: 'white',
                  placeholder: 'rgba(255,255,255,0.7)',
                },
              }}
              textColor="white"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              contentStyle={styles.inputContent}
              theme={{
                colors: {
                  primary: 'white',
                  text: 'white',
                  placeholder: 'rgba(255,255,255,0.7)',
                },
              }}
              textColor="white"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              labelStyle={styles.loginButtonText}
            >
              Register
            </Button>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.orText}>or Register with</Text>

            <View style={styles.socialButtons}>
              <Pressable style={styles.socialButton}>
                <AntDesign name="google" size={24} color="black" />
              </Pressable>

              <Pressable style={styles.socialButton}>
                <AntDesign name="facebook-square" size={24} color="black" />
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signUpText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  inputContent: {
    color: 'white',
  },
  error: {
    color: '#FFCDD2',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 4,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FF7043',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  orText: {
    color: 'white',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: 'white',
  },
  signUpText: {
    color: 'white',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
