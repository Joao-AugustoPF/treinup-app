import { useAuth } from '@/src/context/AuthContext';
import { usePushTokenRegistration } from '@/src/hooks/usePushTokenRegistration';
import { PushTarget } from '@/src/services/pushToken';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export const PushTokenStatus: React.FC = () => {
  const { user } = useAuth();
  const {
    pushToken,
    isPushRegistered,
    registerToken,
    removeToken,
    removeAllTokens,
    listTokens,
    forceRegistration,
    isTokenRegistered,
  } = usePushTokenRegistration();

  const [isChecking, setIsChecking] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [pushTargets, setPushTargets] = useState<PushTarget[]>([]);

  const handleCheckRegistration = async () => {
    if (!user?.$id) {
      Alert.alert('Erro', 'Usuário não logado');
      return;
    }

    setIsChecking(true);
    try {
      const registered = await isTokenRegistered();
      setIsRegistered(registered);
      Alert.alert(
        'Status do Token',
        registered
          ? 'Token registrado no Appwrite'
          : 'Token não registrado no Appwrite'
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao verificar registro do token');
    } finally {
      setIsChecking(false);
    }
  };

  const handleRegisterToken = async () => {
    if (!user?.$id) {
      Alert.alert('Erro', 'Usuário não logado');
      return;
    }

    try {
      const success = await registerToken();
      Alert.alert(
        'Registro',
        success ? 'Token registrado com sucesso' : 'Falha ao registrar token'
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao registrar token');
    }
  };

  const handleRemoveToken = async () => {
    if (!user?.$id) {
      Alert.alert('Erro', 'Usuário não logado');
      return;
    }

    try {
      const success = await removeToken();
      Alert.alert(
        'Remoção',
        success ? 'Token removido com sucesso' : 'Falha ao remover token'
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao remover token');
    }
  };

  const handleRemoveAllTokens = async () => {
    if (!user?.$id) {
      Alert.alert('Erro', 'Usuário não logado');
      return;
    }

    Alert.alert(
      'Confirmar Remoção',
      'Tem certeza que deseja remover todos os push targets?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await removeAllTokens();
              Alert.alert(
                'Remoção',
                success
                  ? 'Todos os tokens removidos com sucesso'
                  : 'Falha ao remover tokens'
              );
            } catch (error) {
              Alert.alert('Erro', 'Erro ao remover tokens');
            }
          },
        },
      ]
    );
  };

  const handleListTokens = async () => {
    if (!user?.$id) {
      Alert.alert('Erro', 'Usuário não logado');
      return;
    }

    try {
      const targets = await listTokens();
      setPushTargets(targets);
      Alert.alert(
        'Push Targets',
        `Encontrados ${targets.length} push target(s)`
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao listar tokens');
    }
  };

  const handleForceRegistration = async () => {
    try {
      await forceRegistration();
      Alert.alert('Sucesso', 'Registro forçado executado');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao forçar registro');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Status do Push Token</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Usuário Logado:</Text>
        <Text style={[styles.value, { color: user ? '#4CAF50' : '#F44336' }]}>
          {user ? 'Sim' : 'Não'}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Push Registrado:</Text>
        <Text
          style={[
            styles.value,
            { color: isPushRegistered ? '#4CAF50' : '#F44336' },
          ]}
        >
          {isPushRegistered ? 'Sim' : 'Não'}
        </Text>
      </View>

      {pushToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.label}>Expo Token:</Text>
          <Text style={styles.tokenText} numberOfLines={2}>
            {pushToken.expoToken}
          </Text>

          {pushToken.deviceToken && (
            <>
              <Text style={styles.label}>Device Token:</Text>
              <Text style={styles.tokenText} numberOfLines={2}>
                {pushToken.deviceToken}
              </Text>
            </>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleCheckRegistration}
          disabled={isChecking}
        >
          <Text style={styles.buttonText}>
            {isChecking ? 'Verificando...' : 'Verificar Registro'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={handleRegisterToken}
        >
          <Text style={styles.buttonText}>Registrar Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleRemoveToken}
        >
          <Text style={styles.buttonText}>Remover Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleRemoveAllTokens}
        >
          <Text style={styles.buttonText}>Remover Todos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={handleListTokens}
        >
          <Text style={styles.buttonText}>Listar Targets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.purpleButton]}
          onPress={handleForceRegistration}
        >
          <Text style={styles.buttonText}>Forçar Registro</Text>
        </TouchableOpacity>
      </View>

      {isRegistered !== null && (
        <View style={styles.statusContainer}>
          <Text style={styles.label}>Status no Appwrite:</Text>
          <Text
            style={[
              styles.value,
              { color: isRegistered ? '#4CAF50' : '#F44336' },
            ]}
          >
            {isRegistered ? 'Registrado' : 'Não Registrado'}
          </Text>
        </View>
      )}

      {pushTargets.length > 0 && (
        <View style={styles.targetsContainer}>
          <Text style={styles.targetsTitle}>
            Push Targets ({pushTargets.length}):
          </Text>
          {pushTargets.map((target, index) => (
            <View key={target.$id} style={styles.targetItem}>
              <Text style={styles.targetName}>{target.name}</Text>
              <Text style={styles.targetId}>ID: {target.$id}</Text>
              <Text style={styles.targetProvider}>
                Provider: {target.providerId}
              </Text>
              <Text style={styles.targetIdentifier} numberOfLines={1}>
                Token: {target.identifier}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tokenContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  infoButton: {
    backgroundColor: '#00BCD4',
  },
  purpleButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  targetsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  targetsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  targetItem: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  targetName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  targetId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  targetProvider: {
    fontSize: 12,
    color: '#666',
  },
  targetIdentifier: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
});
