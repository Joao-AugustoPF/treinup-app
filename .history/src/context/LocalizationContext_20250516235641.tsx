import React, { createContext, useContext, useEffect, useState } from 'react';
import { ProfileService } from '../services/profile';
import { useAuth } from './AuthContext';

// Translation dictionaries
const translations = {
  en: {
    // Common
    success: 'Success',
    error: 'Error',
    cancel: 'Cancel',
    ok: 'OK',
    retry: 'Retry',
    edit: 'Edit',

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
    checkForUpdates: 'Check for Updates',
    verify: 'Verify',

    // Language selection
    selectLanguage: 'Select Language',
    chooseLanguage: 'Choose your preferred language',
    languageUpdated: 'Language updated successfully',
    failedToUpdateLanguage: 'Failed to update language',

    // Update checking
    information: 'Information',
    updateUnavailable: 'Update checking is not available in development mode',
    updateAvailable: 'Update Available',
    installNow: 'Would you like to install it now?',
    notNow: 'Not now',
    install: 'Install',
    updateDownloaded:
      'Update downloaded. The app will restart to apply changes.',
    failedToDownload: 'Failed to download update. Please try again later.',
    upToDate: 'Up to Date',
    usingLatestVersion: 'You are using the latest version of the app',
    failedToCheck:
      'Failed to check for updates. Check your internet connection.',

    // Privacy
    privacySettings: 'Privacy Settings',
    profileVisibility: 'Profile Visibility',
    publicProfile: 'Public Profile',
    showNotificationIcon: 'Show Notification Icon',
    security: 'Security',
    twoFactorAuth: 'Two-Factor Authentication',
    changePassword: 'Change Password',
    privacyPolicy: 'Privacy Policy',
    change: 'Change',
    view: 'View',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',

    // Delete account
    deleteConfirmation:
      'Are you sure you want to delete your account? This action cannot be undone.',
    delete: 'Delete',

    // Password reset
    resetPassword: 'Reset Password',
    resetLinkSent: 'A password reset link has been sent to your email address.',
    failedToInitiateReset: 'Failed to initiate password reset',

    // Profile page
    personalInformation: 'Personal Information',
    phone: 'Phone',
    notProvided: 'Not provided',
    address: 'Address',
    addressNotRegistered: 'Address not registered',
    editInformation: 'Edit Information',
    settings: 'Settings',
    logout: 'Logout',
    logoutConfirmation: 'Are you sure you want to logout?',
    logoutFailed: 'Failed to logout. Please try again.',
    comingSoon: 'Coming Soon',
    photoUploadSoon: 'Photo upload will be available soon!',
    profileNotFound: 'Profile not found',
    failedToLoadProfile: 'Failed to load profile',
    workoutsLabel: 'Workouts',
    classesLabel: 'Classes',
    achievementsLabel: 'Achievements',
    membershipPlan: 'Membership Plan',
    noPlan: 'No Plan',
    expiryToday: 'Expires today',
    expiryTomorrow: 'Expires tomorrow',
    expiryDays: 'Expires in {days} days',
    paymentMethods: 'Payment Methods',
    saved: 'saved',
    notifications: 'Notifications',
    unread: 'unread',
    pushNotifications: 'Push Notifications',
    emailUpdates: 'Email Updates',

    // Notifications page
    notificationsTitle: 'Notifications',
    noNotifications: 'No notifications yet',
    markAllAsRead: 'Mark all as read',
    todayNotifications: 'Today',
    earlierNotifications: 'Earlier',
    markAsRead: 'Mark as read',
    notificationsCleared: 'All notifications marked as read',
    failedToClearNotifications: 'Failed to mark notifications as read',
  },
  pt: {
    // Common
    success: 'Sucesso',
    error: 'Erro',
    cancel: 'Cancelar',
    ok: 'OK',
    retry: 'Tentar novamente',
    edit: 'Editar',

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
    checkForUpdates: 'Verificar Atualizações',
    verify: 'Verificar',

    // Language selection
    selectLanguage: 'Selecionar Idioma',
    chooseLanguage: 'Escolha seu idioma preferido',
    languageUpdated: 'Idioma atualizado com sucesso',
    failedToUpdateLanguage: 'Falha ao atualizar idioma',

    // Update checking
    information: 'Informação',
    updateUnavailable:
      'Verificação de atualizações indisponível no modo de desenvolvimento.',
    updateAvailable: 'Atualização Disponível',
    installNow: 'Uma nova versão está disponível. Deseja instalar agora?',
    notNow: 'Agora não',
    install: 'Instalar',
    updateDownloaded:
      'Atualização baixada. O aplicativo será reiniciado para aplicar as mudanças.',
    failedToDownload:
      'Falha ao baixar atualização. Tente novamente mais tarde.',
    upToDate: 'Atualizado',
    usingLatestVersion: 'Você está usando a versão mais recente do aplicativo.',
    failedToCheck:
      'Falha ao verificar atualizações. Verifique sua conexão com a internet.',

    // Privacy
    privacySettings: 'Configurações de Privacidade',
    profileVisibility: 'Visibilidade do Perfil',
    publicProfile: 'Perfil Público',
    showNotificationIcon: 'Mostrar Ícone de Notificações',
    security: 'Segurança',
    twoFactorAuth: 'Autenticação de Dois Fatores',
    changePassword: 'Alterar Senha',
    privacyPolicy: 'Política de Privacidade',
    change: 'Alterar',
    view: 'Ver',
    dangerZone: 'Zona de Perigo',
    deleteAccount: 'Excluir Conta',

    // Delete account
    deleteConfirmation:
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
    delete: 'Excluir',

    // Password reset
    resetPassword: 'Redefinir Senha',
    resetLinkSent:
      'Um link para redefinir sua senha foi enviado para seu endereço de email.',
    failedToInitiateReset: 'Falha ao iniciar redefinição de senha',

    // Profile page
    personalInformation: 'Informações Pessoais',
    phone: 'Telefone',
    notProvided: 'Não informado',
    address: 'Endereço',
    addressNotRegistered: 'Endereço não cadastrado',
    editInformation: 'Editar Informações',
    settings: 'Configurações',
    logout: 'Sair',
    logoutConfirmation: 'Tem certeza que deseja sair?',
    logoutFailed: 'Falha ao sair. Por favor, tente novamente.',
    comingSoon: 'Em breve',
    photoUploadSoon: 'O upload de fotos estará disponível em breve!',
    profileNotFound: 'Perfil não encontrado',
    failedToLoadProfile: 'Falha ao carregar o perfil',
    workoutsLabel: 'Treinos',
    classesLabel: 'Aulas',
    achievementsLabel: 'Conquistas',
    membershipPlan: 'Plano de Assinatura',
    noPlan: 'Sem Plano',
    expiryToday: 'Expira hoje',
    expiryTomorrow: 'Expira amanhã',
    expiryDays: 'Expira em {days} dias',
    paymentMethods: 'Métodos de Pagamento',
    saved: 'salvos',
    notifications: 'Notificações',
    unread: 'não lidas',
    pushNotifications: 'Notificações Push',
    emailUpdates: 'Atualizações por Email',

    setting

    // Notifications page
    notificationsTitle: 'Notificações',
    noNotifications: 'Nenhuma notificação ainda',
    markAllAsRead: 'Marcar todas como lidas',
    todayNotifications: 'Hoje',
    earlierNotifications: 'Anteriores',
    markAsRead: 'Marcar como lida',
    notificationsCleared: 'Todas as notificações marcadas como lidas',
    failedToClearNotifications: 'Falha ao marcar notificações como lidas',
  },
};

type Language = 'en' | 'pt';

interface LocalizationContextType {
  t: (key: string) => string;
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  isLoading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined
);

export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('pt'); // Portuguese is default
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguageSetting = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profile = await ProfileService.getUserProfile(user);

        if (profile && profile.preferences && profile.preferences.language) {
          // Map the language string from the database to our supported languages
          const preferredLanguage = profile.preferences.language;
          if (preferredLanguage === 'English') {
            setLanguageState('en');
          } else {
            // Default to Portuguese for all other cases
            setLanguageState('pt');
          }
        }
      } catch (error) {
        console.error('Error loading language settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguageSetting();
  }, [user]);

  const setLanguage = async (newLanguage: Language) => {
    try {
      setIsLoading(true);
      // Convert language code to language name for database storage
      const languageName = newLanguage === 'en' ? 'English' : 'Português';
      await ProfileService.updatePreferences(user, { language: languageName });
      setLanguageState(newLanguage);
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating language:', error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const currentTranslations = translations[language] as Record<
      string,
      string
    >;
    return currentTranslations[key] || key; // Return key if translation not found
  };

  return (
    <LocalizationContext.Provider
      value={{ t, language, setLanguage, isLoading }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      'useLocalization must be used within a LocalizationProvider'
    );
  }
  return context;
}
