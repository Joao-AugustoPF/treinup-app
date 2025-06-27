import { PushTokenStatus } from '@/src/components/PushTokenStatus';
import { useAuth } from '@/src/context/AuthContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PushTokenTestScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teste de Push Tokens</Text>
        <Text style={styles.subtitle}>
          Teste todas as funcionalidades do sistema de push tokens
        </Text>
      </View>

      {!user ? (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Você precisa estar logado para testar as funcionalidades de push
            tokens.
          </Text>
          <Text style={styles.warningSubtext}>
            Faça login primeiro e depois volte para esta tela.
          </Text>
        </View>
      ) : (
        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>Usuário Logado:</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userId}>ID: {user.$id}</Text>
        </View>
      )}

      <PushTokenStatus />

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Como Funciona:</Text>
        <Text style={styles.infoText}>
          • O sistema registra automaticamente push tokens no login
        </Text>
        <Text style={styles.infoText}>
          • Suporta múltiplos dispositivos por usuário
        </Text>
        <Text style={styles.infoText}>
          • Tokens são armazenados no Appwrite (não localmente)
        </Text>
        <Text style={styles.infoText}>
          • Use os botões acima para testar as funcionalidades
        </Text>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs Úteis:</Text>
        <Text style={styles.logsText}>
          Abra o console do Metro para ver logs detalhados:
        </Text>
        <Text style={styles.logsCode}>🔔 Registrando push token...</Text>
        <Text style={styles.logsCode}>
          ✅ Push token registrado com sucesso
        </Text>
        <Text style={styles.logsCode}>❌ Erro ao registrar push token</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
  },
  warningContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 16,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 14,
    color: '#856404',
  },
  userInfo: {
    margin: 20,
    padding: 16,
    backgroundColor: '#d1ecf1',
    borderWidth: 1,
    borderColor: '#bee5eb',
    borderRadius: 8,
  },
  userLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c5460',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#0c5460',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#0c5460',
    fontFamily: 'monospace',
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  logsContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  logsText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  logsCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    padding: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
});
