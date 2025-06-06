import { ProfileService } from '@/src/services/profile';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export type Profile = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'USER' | 'TRAINER' | 'OWNER';
  image?: string;
  privacy: {
    publicProfile: boolean;
    showWorkouts: boolean;
    showProgress: boolean;
    showClasses: boolean;
    showEvaluation: boolean;
    twoFactorAuth: boolean;
  };
  preferences: {
    showNotificationIcon: boolean;
  };
};

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userProfile = await ProfileService.getUserProfile(user);
      setProfile(userProfile);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await ProfileService.updateProfile(user, data);
      setProfile(updatedProfile);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile: loadProfile,
        updateProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
