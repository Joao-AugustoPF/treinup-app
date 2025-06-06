import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const GymContext = createContext<GymContextType | undefined>(undefined);

// Mock data for testing
const MOCK_GYMS: Gym[] = [
  {
    id: '1',
    name: 'Fitness Center',
    logo: 'https://example.com/logo1.png',
    coverImage: 'https://example.com/cover1.jpg',
    address: '123 Main St',
    description: 'A modern fitness center with state-of-the-art equipment',
    rating: 4.5,
    reviews: 120,
    features: ['24/7 Access', 'Personal Trainers', 'Group Classes'],
    plans: [
      {
        id: '1',
        name: 'Basic',
        price: 49.99,
        duration: 'month',
        color: 'rgba(255,20,147,0.7)',
        features: ['Access to gym', 'Basic equipment'],
      },
    ],
    isDefault: true,
    tenantId: '1',
  },
  {
    id: '2',
    name: 'Power Gym',
    logo: 'https://example.com/logo2.png',
    coverImage: 'https://example.com/cover2.jpg',
    address: '456 Oak St',
    description: 'Power lifting and strength training focused gym',
    rating: 4.8,
    reviews: 85,
    features: ['Power Lifting', 'CrossFit', 'Personal Training'],
    plans: [
      {
        id: '2',
        name: 'Premium',
        price: 79.99,
        duration: 'month',
        color: 'rgba(255,20,147,0.7)',
        features: ['All access', 'Personal trainer', 'Group classes'],
      },
    ],
    isDefault: false,
    tenantId: '2',
  },
];

export function GymProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [allGyms, setAllGyms] = useState<Gym[]>([]);
  const [currentGym, setCurrentGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Auth user is', user); // debug
    if (!isAuthLoading) {
      // Always use mock data for testing
      setAllGyms(MOCK_GYMS);
      setCurrentGym(MOCK_GYMS[0]);
      setLoading(false);
    }
  }, [user, isAuthLoading]);

  const setDefaultGym = async (gymId: string) => {
    try {
      setLoading(true);
      setError(null);
      const gym = allGyms.find((g) => g.id === gymId);
      if (gym) {
        setCurrentGym(gym);
        await secureStore.setActiveTenantId(gymId);
      }
    } catch (err) {
      setError('Failed to set default gym');
      console.error('Error setting default gym:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <GymContext.Provider
      value={{
        allGyms,
        currentGym,
        loading,
        error,
        setDefaultGym,
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
