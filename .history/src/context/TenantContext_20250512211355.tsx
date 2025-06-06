import React, { createContext, useContext, useEffect, useState } from 'react';
import { client } from '../api/appwrite-client';
import { secureStore } from '../utils/secureStore';
import { useAuth } from './AuthContext';

const DEFAULT_TEAM_ID = '6821292f003a808573c1';

interface TenantContextType {
  activeTenantId: string | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      initializeTenant();
    } else {
      setActiveTenantId(null);
      setIsLoading(false);
    }
  }, [user]);

  async function initializeTenant() {
    if (!user) return;
    try {
      // Set active tenant
      await secureStore.setActiveTenantId(DEFAULT_TEAM_ID);
      setActiveTenantId(DEFAULT_TEAM_ID);
      client.headers['X-Tenant-ID'] = DEFAULT_TEAM_ID;
    } catch (error) {
      console.error('Error initializing tenant:', error);
      setActiveTenantId(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <TenantContext.Provider value={{ activeTenantId, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context)
    throw new Error('useTenant must be used within a TenantProvider');
  return context;
}
