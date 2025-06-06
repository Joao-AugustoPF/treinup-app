import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
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
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register(email, password, name);
      router.replace('/plans');
    } catch (err) {
      setError('Falha no cadastro. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FF1493', '#C71585', '#800080']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              iconColor="white"
              size={24}
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text variant="headlineLarge" style={styles.title}>
              Criar Conta
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Para começar!
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="flat"
                placeholderTextColor="rgba(255,255,255,0.5)"
                activeUnderlineColor="white"
                underlineColor="rgba(255,255,255,0.3)"
                textColor="white"
                selectionColor="white"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                mode="flat"
                placeholderTextColor="rgba(255,255,255,0.5)"
                activeUnderlineColor="white"
                underlineColor="rgba(255,255,255,0.3)"
                textColor="white"
                selectionColor="white"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                mode="flat"
                placeholderTextColor="rgba(255,255,255,0.5)"
                activeUnderlineColor="white"
                underlineColor="rgba(255,255,255,0.3)"
                textColor="white"
                selectionColor="white"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                mode="flat"
                placeholderTextColor="rgba(255,255,255,0.5)"
                activeUnderlineColor="white"
                underlineColor="rgba(255,255,255,0.3)"
                textColor="white"
                selectionColor="white"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              labelStyle={styles.loginButtonText}
              buttonColor="white"
            >
              Cadastrar
            </Button>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.orText}>ou cadastre-se com</Text>

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
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.signUpText}>Entre Agora</Text>
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
  backButton: {
    marginLeft: -8,
    marginBottom: 8,
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#ffb6c1', // Light pink
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'transparent',
    height: 50,
    fontSize: 16,
  },
  error: {
    color: '#FFCDD2',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 4,
    marginTop: 12,
  },
  loginButtonText: {
    color: '#FF1493',
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
