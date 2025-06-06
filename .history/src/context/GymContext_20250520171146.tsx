import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ACADEMIES_COLLECTION_ID,
  client,
  DATABASE_ID,
  db,
} from '../api/appwrite-client';
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

      // Tente carregar academias reais do Appwrite
      try {
        const response = await db.listDocuments(
          DATABASE_ID,
          ACADEMIES_COLLECTION_ID
        );

        if (response.documents.length > 0) {
          const gyms: Gym[] = response.documents.map((doc) => ({
            id: doc.$id,
            name: doc.name,
            logo: doc.logoUrl || '',
            coverImage: '',
            address: `${doc.addressStreet}, ${doc.addressCity} - ${doc.addressState}`,
            description: '',
            rating: 5,
            reviews: 0,
            features: [],
            plans: [],
            isDefault: false,
            tenantId: doc.tenantId,
          }));

          // Marcar a primeira academia como padrão
          if (gyms.length > 0) {
            gyms[0].isDefault = true;
          }

          setAllGyms(gyms);
          setCurrentGym(gyms[0]);
          return;
        }
      } catch (err) {
        console.error('Error loading academies from Appwrite:', err);
        // Continuar para usar dados mock se falhar
      }

      // Usar dados mock se não conseguiu carregar do Appwrite
      // const mockGyms: Gym[] = [
      //   {
      //     id: '1',
      //     name: 'Fitness Center',
      //     logo: 'https://example.com/logo1.png',
      //     coverImage: 'https://example.com/cover1.jpg',
      //     address: '123 Main St',
      //     description:
      //       'A modern fitness center with state-of-the-art equipment',
      //     rating: 4.5,
      //     reviews: 120,
      //     features: ['24/7 Access', 'Personal Trainers', 'Group Classes'],
      //     plans: [
      //       {
      //         id: '1',
      //         name: 'Basic',
      //         price: 49.99,
      //         duration: 'month',
      //         color: 'rgba(255,20,147,0.7)',
      //         features: ['Access to gym', 'Basic equipment'],
      //       },
      //     ],
      //     isDefault: true,
      //     tenantId: '1', // Valor mock para o tenantId
      //   },
      // ];
      // setAllGyms(mockGyms);
      // setCurrentGym(mockGyms[0]);
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
      // TODO: Implement actual API call to set default gym
      const gym = allGyms.find((g) => g.id === gymId);
      if (gym) {
        setCurrentGym(gym);
        await secureStore.setActiveTenantId(gymId);
        client.headers['X-Tenant-ID'] = gymId;
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
