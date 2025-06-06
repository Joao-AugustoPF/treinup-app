import React, { createContext, useContext, useEffect, useState } from 'react';
import { ID, Models } from 'react-native-appwrite';
import { account, client, functions } from '../api/appwrite-client';
import { secureStore } from '../utils/secureStore';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  sessionId: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
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
        const jwt = await account.createJWT();
        client.setJWT(jwt.jwt);
        setSessionId(session.$id);
        setUser(await account.get());
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

  const login = async (email: string, password: string) => {
    try {
      // Tenta limpar sessão anterior usando a função separada
      // await deleteCurrentSession();

      const session = await account.createEmailPasswordSession(email, password);
      const jwt = await account.createJWT();

      await secureStore.setSessionId(session.$id);
      await secureStore.setJWT(jwt.jwt);

      client.setJWT(jwt.jwt);
      setSessionId(session.$id);
      setUser(await account.get());
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Create user account using react-native-appwrite
      const user = await account.create(ID.unique(), email, password, name);

      // After successful account creation, log the user in
      await login(email, password);

      // Join default team first
      const teamExecution = await functions.createExecution(
        'joinDefaultTeam',
        JSON.stringify({ userId: user.$id }),
        false
      );

      const resultTeam = JSON.parse(teamExecution. || '{}');
      console.log(resultTeam);
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
          tenantId: process.env.DEFAULT_TEAM_ID,
        }),
        false
      );

      const resultProfile = JSON.parse(profileExecution.responseBody || '{}');
      if (!resultProfile.ok) {
        throw new Error(resultProfile.message || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Usar a função dedicada para deletar a sessão
      await deleteCurrentSession();
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
