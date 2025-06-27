import React, { createContext, useContext, useEffect, useState } from 'react';
import { ID, Models } from 'react-native-appwrite';
import { account, client, functions } from '../api/appwrite-client';
import { pushNotificationService } from '../services/pushNotification';
import { PushTokenService } from '../services/pushToken';
import { secureStore } from '../utils/secureStore';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  sessionId: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  registerPushTokenForUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const storedSessionId = await secureStore.getSessionId();
      if (storedSessionId) {
        const session = await account.getSession(storedSessionId);
        client.setSession(session.$id);
        const jwt = await account.createJWT();
        client.setJWT(jwt.jwt);
        setSessionId(session.$id);
        const currentUser = await account.get();
        setUser(currentUser);

        // Registrar push token se o usuário estiver logado
        if (currentUser) {
          await registerPushTokenForUser();
        }
      }
    } catch (error) {
      await secureStore.clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  // Função separada para deletar a sessão atual
  const deleteCurrentSession = async () => {
    try {
      await account.deleteSession('current');
      return true;
    } catch (error) {
      console.log('Não foi possível deletar a sessão atual:', error);
      return false;
    }
  };

  // Função para registrar push token para o usuário atual
  const registerPushTokenForUser = async () => {
    try {
      console.log('🔄 Tentando registrar push token...');

      // Obter o push token atual
      const pushToken =
        await pushNotificationService.registerForPushNotifications();

      if (pushToken && pushToken.expoToken) {
        console.log('📱 Push token obtido, registrando no Appwrite...');

        const result = await PushTokenService.registerPushToken(pushToken);

        if (result.success) {
          console.log('✅ Push target registrado com sucesso:', result.action);
        } else {
          console.warn('⚠️ Falha ao registrar push target, mas continuando...');
        }
      } else {
        console.log('ℹ️ Nenhum push token disponível para registro');
      }
    } catch (error) {
      console.error('❌ Erro ao registrar push token:', error);
      // Não vamos falhar o login por causa do push token
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Tenta limpar sessão anterior usando a função separada
      // await deleteCurrentSession();
      const session = await account.createEmailPasswordSession(email, password);

      client.setSession(session.$id); // precisa vir *antes* de qualquer outra chamada
      const jwt = await account.createJWT(); // agora não quebra

      await secureStore.setSessionId(session.$id);
      await secureStore.setJWT(jwt.jwt);

      client.setJWT(jwt.jwt);
      setSessionId(session.$id);
      const currentUser = await account.get();
      setUser(currentUser);

      // Registrar push token após login bem-sucedido
      if (currentUser) {
        await registerPushTokenForUser();
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Create user account using react-native-appwrite
      const user = await account.create(ID.unique(), email, password, name);

      // Join default team first
      const teamExecution = await functions.createExecution(
        'joinDefaultTeam',
        JSON.stringify({ userId: user.$id }),
        false
      );

      const resultTeam = JSON.parse(teamExecution.responseBody || '{}');
      if (!resultTeam.ok) {
        throw new Error(resultTeam.message || 'Failed to join default team');
      }

      // Create profile document using Appwrite Functions after joining team
      const profileExecution = await functions.createExecution(
        'createProfile',
        JSON.stringify({
          userId: user.$id,
          role: 'USER',
          name: user.name,
          email: user.email,
        }),
        false
      );

      const resultProfile = JSON.parse(profileExecution.responseBody || '{}');
      if (!resultProfile.ok) {
        throw new Error(resultProfile.message || 'Failed to create profile');
      }

      // Wait for profile to be created with retry mechanism
      let retries = 3;
      let profileCreated = false;

      while (retries > 0 && !profileCreated) {
        try {
          // Try to login and get profile
          await login(email, password);
          profileCreated = true;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw new Error(
              'Failed to verify profile creation after multiple attempts'
            );
          }
          // Wait for 1 second before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Remover todos os push targets antes do logout
      try {
        await PushTokenService.removeAllPushTargets();
        console.log('✅ Push targets removidos no logout');
      } catch (error) {
        console.warn('⚠️ Erro ao remover push targets no logout:', error);
      }

      // Apaga a sessão *pelo ID real*, não por 'current'
      if (sessionId) {
        await account.deleteSession(sessionId);
      }

      // Limpa qualquer autenticação em memória
      client.setSession(''); // remove X-Appwrite-Session
      client.setJWT(''); // remove X-Appwrite-JWT

      // Limpa armazenamento local
      await secureStore.clearAll();

      setUser(null);
      setSessionId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionId,
        isLoading,
        login,
        register,
        logout,
        registerPushTokenForUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
