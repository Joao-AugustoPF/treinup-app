import React, { createContext, useContext, useEffect, useState } from 'react';
import { client } from '../api/appwrite-client';
import { Academy, AcademyService } from '../services/academies';
import { secureStore } from '../utils/secureStore';
import { useAuth } from './AuthContext';

interface Gym {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  address: string;
  description: string;
  rating: number;
  reviews: number;
  features: string[];
  plans: {
    id: string;
    name: string;
    price: number;
    duration: string;
    color: string;
    features: string[];
  }[];
  isDefault: boolean;
  tenantId: string;
}

interface GymContextType {
  allGyms: Gym[];
  currentGym: Gym | null;
  loading: boolean;
  error: string | null;
  setDefaultGym: (gymId: string) => Promise<void>;
  refreshGyms: () => Promise<void>;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

// Helper to convert Academy to Gym
const academyToGym = (academy: Academy, isDefault: boolean = false): Gym => {
  return {
    id: academy.id,
    name: academy.name,
    logo: academy.logoUrl || 'https://via.placeholder.com/100',
    coverImage: 'https://via.placeholder.com/500x300/333/fff?text=Gym',
    address: `${academy.addressStreet}, ${academy.addressCity}, ${academy.addressState} ${academy.addressZip}`,
    description: `${academy.name} - Academia`,
    rating: 4.5,
    reviews: 0,
    features: ['Equipamentos modernos', 'Profissionais qualificados'],
    plans: [
      {
        id: '1',
        name: 'Plano Mensal',
        price: 99.9,
        duration: 'month',
        color: '#00E6C3',
        features: ['Acesso total'],
      },
    ],
    isDefault,
    tenantId: academy.id,
  };
};

export function GymProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [allGyms, setAllGyms] = useState<Gym[]>([]);
  const [currentGym, setCurrentGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGyms();
    } else {
      setAllGyms([]);
      setCurrentGym(null);
      setLoading(false);
    }
  }, [user]);

  const loadGyms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get saved active tenant ID
      const activeTenantId = await secureStore.getActiveTenantId();

      // Fetch academies from Appwrite
      const response = await AcademyService.getAcademies();

      if (response.error) {
        throw new Error(response.error);
      }

      const gyms = response.data.map((academy) =>
        academyToGym(academy, academy.id === activeTenantId)
      );

      setAllGyms(gyms);

      // Set current gym to the default one or the first one
      const defaultGym = gyms.find((gym) => gym.isDefault) || gyms[0] || null;
      setCurrentGym(defaultGym);

      // Update the tenant ID in the client headers
      if (defaultGym) {
        client.headers['X-Tenant-ID'] = defaultGym.tenantId;
        await secureStore.setActiveTenantId(defaultGym.tenantId);
      }
    } catch (err) {
      setError('Failed to load gyms');
      console.error('Error loading gyms:', err);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultGym = async (gymId: string) => {
    try {
      setLoading(true);
      setError(null);

      const gym = allGyms.find((g) => g.id === gymId);
      if (gym) {
        // Update all gyms to mark the selected one as default
        const updatedGyms = allGyms.map((g) => ({
          ...g,
          isDefault: g.id === gymId,
        }));

        setAllGyms(updatedGyms);
        setCurrentGym(gym);

        // Update client headers and save to secure storage
        client.headers['X-Tenant-ID'] = gym.tenantId;
        await secureStore.setActiveTenantId(gym.tenantId);
      }
    } catch (err) {
      setError('Failed to set default gym');
      console.error('Error setting default gym:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshGyms = async () => {
    return loadGyms();
  };

  return (
    <GymContext.Provider
      value={{
        allGyms,
        currentGym,
        loading,
        error,
        setDefaultGym,
        refreshGyms,
      }}
    >
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}
