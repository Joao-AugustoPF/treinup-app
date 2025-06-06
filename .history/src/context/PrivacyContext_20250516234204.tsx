import React, { createContext, useContext, useEffect, useState } from 'react';
import { ProfileService } from '../services/profile';
import { useAuth } from './AuthContext';

interface PrivacySettings {
  publicProfile: boolean;
  showWorkouts: boolean;
  showProgress: boolean;
  showClasses: boolean;
  showEvaluation: boolean;
  twoFactorAuth: boolean;
  showNotificationIcon: boolean;
}

interface PrivacyContextType {
  privacySettings: PrivacySettings;
  isLoading: boolean;
  updatePrivacySetting: (
    key: keyof PrivacySettings,
    value: boolean
  ) => Promise<void>;
  refreshPrivacySettings: () => Promise<void>;
}

const defaultPrivacySettings: PrivacySettings = {
  publicProfile: true,
  showWorkouts: true,
  showProgress: false,
  showClasses: true,
  showEvaluation: true,
  twoFactorAuth: false,
  showNotificationIcon: true,
};

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(
    defaultPrivacySettings
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadPrivacySettings = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const profile = await ProfileService.getUserProfile(user);
      
      if (profile && profile.privacy) {
        setPrivacySettings({
          publicProfile:
            profile.privacy.publicProfile ??
            defaultPrivacySettings.publicProfile,
          showWorkouts:
            profile.privacy.showWorkouts ?? defaultPrivacySettings.showWorkouts,
          showProgress:
            profile.privacy.showProgress ?? defaultPrivacySettings.showProgress,
          showClasses:
            profile.privacy.showClasses ?? defaultPrivacySettings.showClasses,
          showEvaluation:
            profile.privacy.showEvaluation ??
            defaultPrivacySettings.showEvaluation,
          twoFactorAuth:
            profile.privacy.twoFactorAuth ??
            defaultPrivacySettings.twoFactorAuth,
          showNotificationIcon:
            profile.privacy.showNotificationIcon ??
            defaultPrivacySettings.showNotificationIcon,
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacySettings();
  }, [user]);

  const updatePrivacySetting = async (
    key: keyof PrivacySettings,
    value: boolean
  ) => {
    try {
      // Update normal privacy settings
      await ProfileService.updatePrivacySettings(user, { [key]: value });

      setPrivacySettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      throw error;
    }
  };

  const refreshPrivacySettings = async () => {
    await loadPrivacySettings();
  };

  return (
    <PrivacyContext.Provider
      value={{
        privacySettings,
        isLoading,
        updatePrivacySetting,
        refreshPrivacySettings,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
