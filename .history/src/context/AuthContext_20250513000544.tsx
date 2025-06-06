import { Models } from 'appwrite';
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const login = async (email: string, password: string) => {
    try {
      try {
        await account.deleteSession('current');
      } catch {
        // ignora erro
      }

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
      const user = await account.create('unique()', email, password, name);
      await login(email, password);

      // Create profile document
      const profileExecution = await functions.createExecution(
        'createProfile',
        JSON.stringify({
          userId: user.$id,
          role: 'user',
          name: user.name,
          email: user.email,
        }),
        false
      );

      // Join default team after successful registration
      const teamExecution = await functions.createExecution(
        'joinDefaultTeam',
        JSON.stringify({ userId: user.$id }),
        false
      );

      const resultTeam = JSON.parse(teamExecution.responseBody || '{}');
      if (!resultTeam.ok) {
        throw new Error(resultTeam.message || 'Failed to join default team');
      }
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
      await account.deleteSession('current');
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
