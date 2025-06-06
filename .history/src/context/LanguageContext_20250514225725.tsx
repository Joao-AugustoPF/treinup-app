import React, { createContext, useContext, useEffect, useState } from 'react';
import { ProfileService } from '../services/profile';
import { useAuth } from './AuthContext';

// Define available languages
export type Language = 'pt' | 'en';

// Create translation resources for both languages
const translations = {
  pt: {
    // Tabs
    classes: 'Aulas',
    workouts: 'Treinos',
    evaluation: 'Avaliação',
    progress: 'Progresso',
    profile: 'Perfil',
    community: 'Comunidade',

    // Settings
    appSettings: 'Configurações do App',
    moduleVisibility: 'Visibilidade dos Módulos',
    showClasses: 'Mostrar Aulas',
    showWorkouts: 'Mostrar Treinos',
    showEvaluation: 'Mostrar Avaliação',
    showProgress: 'Mostrar Progresso',
    appearance: 'Aparência',
    darkMode: 'Modo Escuro',
    language: 'Idioma',
    general: 'Geral',
    checkUpdates: 'Verificar Atualizações',
    check: 'Verificar',
    showNotificationIcon: 'Mostrar Ícone de Notificações',

    // Privacy
    privacySettings: 'Configurações de Privacidade',
    profileVisibility: 'Visibilidade do Perfil',
    publicProfile: 'Perfil Público',
    security: 'Segurança',
    twoFactorAuth: 'Autenticação de Dois Fatores',
    changePassword: 'Alterar Senha',
    privacyPolicy: 'Política de Privacidade',
    dangerZone: 'Zona de Perigo',
    deleteAccount: 'Excluir Conta',

    // Alerts
    success: 'Sucesso',
    error: 'Erro',
    settingsUpdated: 'Configuração atualizada com sucesso',
    failedToUpdate: 'Falha ao atualizar configuração',
  },
  en: {
    // Tabs
    classes: 'Classes',
    workouts: 'Workouts',
    evaluation: 'Evaluation',
    progress: 'Progress',
    profile: 'Profile',
    community: 'Community',

    // Settings
    appSettings: 'App Settings',
    moduleVisibility: 'Module Visibility',
    showClasses: 'Show Classes',
    showWorkouts: 'Show Workouts',
    showEvaluation: 'Show Evaluation',
    showProgress: 'Show Progress',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    language: 'Language',
    general: 'General',
    checkUpdates: 'Check for Updates',
    check: 'Check',
    showNotificationIcon: 'Show Notification Icon',

    // Privacy
    privacySettings: 'Privacy Settings',
    profileVisibility: 'Profile Visibility',
    publicProfile: 'Public Profile',
    security: 'Security',
    twoFactorAuth: 'Two-Factor Authentication',
    changePassword: 'Change Password',
    privacyPolicy: 'Privacy Policy',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',

    // Alerts
    success: 'Success',
    error: 'Error',
    settingsUpdated: 'Settings updated successfully',
    failedToUpdate: 'Failed to update settings',
  },
};

interface LanguageContextType {
  language: Language;
  t: (key: keyof typeof translations.pt) => string;
  changeLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    if (!user) return;

    const loadLanguagePreference = async () => {
      try {
        const profile = await ProfileService.getUserProfile(user);
        if (profile && profile.preferences && profile.preferences.language) {
          const lang = profile.preferences.language === 'English' ? 'en' : 'pt';
          setLanguage(lang);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguagePreference();
  }, [user]);

  // Translation function to get string in current language
  const t = (key: keyof typeof translations.pt): string => {
    return translations[language][key] || key;
  };

  // Function to change language
  const changeLanguage = async (lang: Language) => {
    try {
      const languageValue = lang === 'en' ? 'English' : 'Português';
      await ProfileService.updatePreferences(user, { language: languageValue });
      setLanguage(lang);
    } catch (error) {
      console.error('Error updating language preference:', error);
      throw error;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
