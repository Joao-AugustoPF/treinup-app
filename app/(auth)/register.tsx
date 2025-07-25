import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
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

  const handleGoBack = () => {
    router.replace('/');
  };

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
    } catch (err) {
      setError('Falha no cadastro. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF1493', '#C71585', '#800080']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView
          style={styles.safeArea}
          edges={['bottom', 'left', 'right']}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <IconButton
                icon="arrow-left"
                iconColor="white"
                size={24}
                onPress={handleGoBack}
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
                <TextInput
                  label="Nome"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  mode="outlined"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="white"
                  textColor="white"
                  selectionColor="white"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#ffb6c1',
                      background: 'transparent',
                    },
                  }}
                  outlineStyle={{
                    borderRadius: 8,
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  mode="outlined"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="white"
                  textColor="white"
                  selectionColor="white"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#ffb6c1',
                      background: 'transparent',
                    },
                  }}
                  outlineStyle={{
                    borderRadius: 8,
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                  mode="outlined"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="white"
                  textColor="white"
                  selectionColor="white"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#ffb6c1',
                      background: 'transparent',
                    },
                  }}
                  outlineStyle={{
                    borderRadius: 8,
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Confirmar Senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  style={styles.input}
                  mode="outlined"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  outlineColor="rgba(255,255,255,0.5)"
                  activeOutlineColor="white"
                  textColor="white"
                  selectionColor="white"
                  theme={{
                    colors: {
                      onSurfaceVariant: '#ffb6c1',
                      background: 'transparent',
                    },
                  }}
                  outlineStyle={{
                    borderRadius: 8,
                  }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 20,
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
  input: {
    backgroundColor: 'transparent',
    height: 56,
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
