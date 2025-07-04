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
  CalendarClock as Classes,
  ClipboardList as Clipboard,
  Globe,
  ChartLine as LineChart,
  LucideIcon,
  Moon,
  RefreshCw,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Switch } from 'react-native-paper';

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
  const { isDark, toggleTheme, paperTheme } = useTheme();
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
  const [error, setError] = useState<string | null>(null);

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
      setError(t('failedToUpdateLanguage'));
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
      setError(t('failedToUpdateLanguage'));
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
      setError(t('failedToUpdateLanguage'));
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
      // Alert.alert(t('success'), t('languageUpdated'));
    } catch (error) {
      setError(t('failedToUpdateLanguage'));
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
      await ProfileService.updatePreferences(user, { darkMode: !isDark });
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
          value: isDark,
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
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: paperTheme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: paperTheme.colors.primary },
          ]}
          onPress={loadPreferences}
        >
          <Text
            style={[
              styles.retryButtonText,
              { color: paperTheme.colors.onPrimary },
            ]}
          >
            {t('retry')}
          </Text>
        </TouchableOpacity>
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
            <View
              style={[
                styles.card,
                { backgroundColor: paperTheme.colors.surfaceVariant },
              ]}
            >
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index !== section.items.length - 1 &&
                      styles.settingItemBorder,
                    { borderBottomColor: paperTheme.colors.outline },
                  ]}
                  onPress={
                    item.type === 'select' || item.type === 'button'
                      ? item.onPress
                      : undefined
                  }
                  disabled={loading || item.isLoading}
                >
                  <View style={styles.settingLeft}>
                    <item.icon size={20} color={paperTheme.colors.onSurface} />
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
                      disabled={loading}
                      color={paperTheme.colors.primary}
                    />
                  ) : item.type === 'select' ? (
                    <View
                      style={[
                        styles.selectContainer,
                        Platform.OS === 'android' && {
                          backgroundColor: paperTheme.colors.surfaceVariant,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.settingValue,
                          { color: paperTheme.colors.onSurfaceVariant },
                        ]}
                      >
                        {item.value}
                      </Text>
                    </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
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
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
