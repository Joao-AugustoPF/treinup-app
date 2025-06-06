import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { usePrivacy } from '@/src/context/PrivacyContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CalendarClock as Classes,
  ClipboardList as Clipboard,
  Globe,
  ChartLine as LineChart,
  LucideIcon,
  Moon,
  RefreshCw,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Define types for our settings items
type SettingItemBase = {
  icon: LucideIcon;
  label: string;
  isLoading?: boolean;
};

type SwitchSettingItem = SettingItemBase & {
  type: 'switch';
  value: boolean;
  onToggle: () => void;
};

type SelectSettingItem = SettingItemBase & {
  type: 'select';
  value: string;
  onPress: () => void;
};

type ButtonSettingItem = SettingItemBase & {
  type: 'button';
  onPress: () => void;
  isLoading?: boolean;
};

type SettingItem = SwitchSettingItem | SelectSettingItem | ButtonSettingItem;

type SettingSection = {
  id: string;
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode, toggleTheme, paperTheme } = useTheme();
  const { t, language, setLanguage } = useLocalization();
  const {
    privacySettings,
    updatePrivacySetting,
    isLoading: privacyLoading,
  } = usePrivacy();
  const [loading, setLoading] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [preferences, setPreferences] = useState({
    autoUpdate: true,
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const profile = await ProfileService.getUserProfile(user);
      setPreferences({
        autoUpdate: profile.preferences.autoUpdate,
      });
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateLanguage'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreference = async (key: string, value: boolean) => {
    try {
      setLoading(true);
      await ProfileService.updatePreferences(user, { [key]: value });
      setPreferences((prev) => ({ ...prev, [key]: value }));
      // Alert.alert(t('success'), t('languageUpdated'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateLanguage'));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async (
    key: keyof typeof privacySettings,
    value: boolean
  ) => {
    try {
      setLoading(true);
      await updatePrivacySetting(key, value);
      // Alert.alert(t('success'), t('languageUpdated'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateLanguage'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLanguage = () => {
    Alert.alert(t('selectLanguage'), t('chooseLanguage'), [
      { text: 'Português', onPress: () => handleUpdateLanguage('pt') },
      { text: 'English', onPress: () => handleUpdateLanguage('en') },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const handleUpdateLanguage = async (newLanguage: 'pt' | 'en') => {
    try {
      setLoading(true);
      await setLanguage(newLanguage);
      Alert.alert(t('success'), t('languageUpdated'));
      setCurrentLanguage(newLanguage);
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateLanguage'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      setCheckingUpdate(true);

      // Verify if the app is in development mode
      if (__DEV__) {
        setTimeout(() => {
          Alert.alert(t('information'), t('updateUnavailable'));
          setCheckingUpdate(false);
        }, 1000);
        return;
      }

      // Check for updates from Expo
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(t('updateAvailable'), t('installNow'), [
          {
            text: t('notNow'),
            style: 'cancel',
          },
          {
            text: t('install'),
            onPress: async () => {
              try {
                await Updates.fetchUpdateAsync();
                Alert.alert(t('success'), t('updateDownloaded'), [
                  {
                    text: t('ok'),
                    onPress: () => Updates.reloadAsync(),
                  },
                ]);
              } catch (error) {
                Alert.alert(t('error'), t('failedToDownload'));
              }
            },
          },
        ]);
      } else {
        Alert.alert(t('upToDate'), t('usingLatestVersion'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('failedToCheck'));
      console.error('Update check error:', error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleToggleTheme = async () => {
    try {
      setLoading(true);
      await ProfileService.updatePreferences(user, { darkMode: !isDarkMode });
      toggleTheme();
      Alert.alert(t('success'), t('settingsUpdated'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateSettings'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotificationIcon = async () => {
    try {
      setLoading(true);
      await ProfileService.updatePreferences(user, {
        showNotificationIcon: !privacySettings.showNotificationIcon,
      });
      handleTogglePrivacy(
        'showNotificationIcon',
        !privacySettings.showNotificationIcon
      );
      Alert.alert(t('success'), t('settingsUpdated'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateSettings'));
    } finally {
      setLoading(false);
    }
  };

  const settings: SettingSection[] = [
    {
      id: 'visibility',
      title: t('moduleVisibility'),
      items: [
        {
          icon: Classes,
          label: t('showClasses'),
          value: privacySettings.showClasses,
          onToggle: () =>
            handleTogglePrivacy('showClasses', !privacySettings.showClasses),
          type: 'switch',
        },
        {
          icon: Clipboard,
          label: t('showWorkouts'),
          value: privacySettings.showWorkouts,
          onToggle: () =>
            handleTogglePrivacy('showWorkouts', !privacySettings.showWorkouts),
          type: 'switch',
        },
        {
          icon: Calendar,
          label: t('showEvaluation'),
          value: privacySettings.showEvaluation,
          onToggle: () =>
            handleTogglePrivacy(
              'showEvaluation',
              !privacySettings.showEvaluation
            ),
          type: 'switch',
        },
        {
          icon: LineChart,
          label: t('showProgress'),
          value: privacySettings.showProgress,
          onToggle: () =>
            handleTogglePrivacy('showProgress', !privacySettings.showProgress),
          type: 'switch',
        },
      ],
    },
    {
      id: 'appearance',
      title: t('appearance'),
      items: [
        {
          icon: Bell,
          label: t('showNotificationIcon'),
          value: privacySettings.showNotificationIcon,
          onToggle: handleToggleNotificationIcon,
          type: 'switch',
        },
        {
          icon: Moon,
          label: t('darkMode'),
          value: isDarkMode,
          onToggle: handleToggleTheme,
          type: 'switch',
        },
        {
          icon: Globe,
          label: t('language'),
          value: language === 'en' ? 'English' : 'Português',
          onPress: handleChangeLanguage,
          type: 'select',
        },
      ],
    },
    {
      id: 'general',
      title: t('general'),
      items: [
        {
          icon: RefreshCw,
          label: t('checkForUpdates'),
          onPress: handleCheckUpdates,
          isLoading: checkingUpdate,
          type: 'button',
        },
      ],
    },
  ];

  if (loading || privacyLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="rgba(255,20,147,0.7)" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: paperTheme.colors.background },
      ]}
    >
      <View
        style={[styles.header, { backgroundColor: paperTheme.colors.surface }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={paperTheme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
          {t('appSettings')}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {settings.map((section) => (
          <View
            key={section.id}
            style={[
              styles.section,
              { backgroundColor: paperTheme.colors.surface },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: paperTheme.colors.onSurface },
              ]}
            >
              {section.title}
            </Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index !== section.items.length - 1 && {
                      borderBottomColor: paperTheme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={
                    item.type === 'select' || item.type === 'button'
                      ? item.onPress
                      : undefined
                  }
                  disabled={loading || item.isLoading}
                >
                  <View style={styles.settingLeft}>
                    <item.icon
                      size={20}
                      color={paperTheme.colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.settingLabel,
                        { color: paperTheme.colors.onSurface },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.type === 'switch' ? (
                    <Switch
                      value={
                        typeof item.value === 'boolean' ? item.value : false
                      }
                      onValueChange={item.onToggle}
                      trackColor={{
                        false: paperTheme.colors.surfaceVariant,
                        true: paperTheme.colors.primary,
                      }}
                      thumbColor={paperTheme.colors.onPrimary}
                      disabled={loading}
                    />
                  ) : item.type === 'select' ? (
                    <Text
                      style={[
                        styles.settingValue,
                        { color: paperTheme.colors.onSurfaceVariant },
                      ]}
                    >
                      {item.value}
                    </Text>
                  ) : (
                    <View style={styles.buttonContainer}>
                      {item.isLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={paperTheme.colors.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.buttonText,
                            { color: paperTheme.colors.primary },
                          ]}
                        >
                          {item.label.includes('Update') ||
                          item.label.includes('Atualiza')
                            ? t('verify')
                            : t('ok')}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: `${paperTheme.colors.background}99` },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: paperTheme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: paperTheme.colors.surfaceVariant },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: paperTheme.colors.onSurface },
                ]}
              >
                {t('selectLanguage')}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <X size={24} color={paperTheme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.languageOption,
                { borderBottomColor: paperTheme.colors.surfaceVariant },
              ]}
              onPress={() => handleLanguageChange('pt')}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  { color: paperTheme.colors.onSurface },
                ]}
              >
                Português
              </Text>
              {currentLanguage === 'pt' && (
                <Check size={24} color={paperTheme.colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                { borderBottomColor: paperTheme.colors.surfaceVariant },
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  { color: paperTheme.colors.onSurface },
                ]}
              >
                English
              </Text>
              {currentLanguage === 'en' && (
                <Check size={24} color={paperTheme.colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  buttonContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  buttonText: {
    color: 'rgba(255,20,147,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  languageOptionText: {
    fontSize: 16,
  },
});
