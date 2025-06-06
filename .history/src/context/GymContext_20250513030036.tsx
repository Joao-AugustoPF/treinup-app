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
      console.log('[GymContext] User authenticated, loading gyms');
      loadGyms();
    } else {
      console.log('[GymContext] User not authenticated, clearing gyms');
      setAllGyms([]);
      setCurrentGym(null);
      setLoading(false);
    }
  }, [user]);

  const loadGyms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[GymContext] Loading gyms from Appwrite');

      // Tente carregar academias reais do Appwrite
      try {
        console.log(
          '[GymContext] Attempting to list academies from collection:',
          ACADEMIES_COLLECTION_ID
        );
        const response = await db.listDocuments(
          DATABASE_ID,
          ACADEMIES_COLLECTION_ID
        );

        console.log('[GymContext] Academies response:', response);

        if (response.documents.length > 0) {
          console.log(
            '[GymContext] Found',
            response.documents.length,
            'academies'
          );
          const gyms: Gym[] = response.documents.map((doc) => {
            console.log(
              '[GymContext] Processing academy doc:',
              doc.$id,
              doc.name
            );
            return {
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
            };
          });

          // Marcar a primeira academia como padrão
          if (gyms.length > 0) {
            gyms[0].isDefault = true;
            console.log(
              '[GymContext] Setting default gym:',
              gyms[0].name,
              'with tenantId:',
              gyms[0].tenantId
            );
          }

          setAllGyms(gyms);
          setCurrentGym(gyms[0]);
          console.log('[GymContext] Successfully set gyms from Appwrite');
          return;
        } else {
          console.log(
            '[GymContext] No academies found in Appwrite, using mock data'
          );
        }
      } catch (err) {
        console.error(
          '[GymContext] Error loading academies from Appwrite:',
          err
        );
        // Continuar para usar dados mock se falhar
      }

      // Usar dados mock se não conseguiu carregar do Appwrite
      console.log('[GymContext] Using mock gym data');
      const mockGyms: Gym[] = [
        {
          id: '1',
          name: 'Fitness Center',
          logo: 'https://example.com/logo1.png',
          coverImage: 'https://example.com/cover1.jpg',
          address: '123 Main St',
          description:
            'A modern fitness center with state-of-the-art equipment',
          rating: 4.5,
          reviews: 120,
          features: ['24/7 Access', 'Personal Trainers', 'Group Classes'],
          plans: [
            {
              id: '1',
              name: 'Basic',
              price: 49.99,
              duration: 'month',
              color: '#00E6C3',
              features: ['Access to gym', 'Basic equipment'],
            },
          ],
          isDefault: true,
          tenantId: '1', // Valor mock para o tenantId
        },
      ];
      setAllGyms(mockGyms);
      setCurrentGym(mockGyms[0]);
      console.log(
        '[GymContext] Set mock gym with tenantId:',
        mockGyms[0].tenantId
      );
    } catch (err) {
      setError('Failed to load gyms');
      console.error('[GymContext] Error loading gyms:', err);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultGym = async (gymId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[GymContext] Setting default gym:', gymId);
      const gym = allGyms.find((g) => g.id === gymId);
      if (gym) {
        console.log(
          '[GymContext] Found gym to set as default:',
          gym.name,
          'with tenantId:',
          gym.tenantId
        );
        setCurrentGym(gym);
        await secureStore.setActiveTenantId(gymId);
        client.headers['X-Tenant-ID'] = gymId;
        console.log(
          '[GymContext] Successfully set default gym and updated headers'
        );
      } else {
        console.error('[GymContext] Gym not found with ID:', gymId);
      }
    } catch (err) {
      setError('Failed to set default gym');
      console.error('[GymContext] Error setting default gym:', err);
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
