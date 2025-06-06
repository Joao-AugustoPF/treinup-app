import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { usePrivacy } from '@/src/context/PrivacyContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import { ArrowLeft, Key, Lock, Shield, Users } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PrivacyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocalization();
  const {
    privacySettings,
    updatePrivacySetting,
    isLoading: privacyLoading,
  } = usePrivacy();
  const { paperTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      await ProfileService.initiatePasswordReset(user);
      Alert.alert(t('resetPassword'), t('resetLinkSent'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToInitiateReset'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(t('deleteAccount'), t('deleteConfirmation'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await ProfileService.deleteAccount(user);
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert(t('error'), 'Failed to delete account');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const settings = [
    {
      id: 'visibility',
      title: t('profileVisibility'),
      items: [
        {
          icon: Users,
          label: t('publicProfile'),
          value: privacySettings.publicProfile,
          onToggle: () =>
            handleTogglePrivacy(
              'publicProfile',
              !privacySettings.publicProfile
            ),
          type: 'switch',
        },
      ],
    },
    {
      id: 'security',
      title: t('security'),
      items: [
        {
          icon: Lock,
          label: t('twoFactorAuth'),
          value: privacySettings.twoFactorAuth,
          onToggle: () =>
            handleTogglePrivacy(
              'twoFactorAuth',
              !privacySettings.twoFactorAuth
            ),
          type: 'switch',
        },
        {
          icon: Key,
          label: t('changePassword'),
          type: 'button',
          onPress: handleChangePassword,
        },
        {
          icon: Shield,
          label: t('privacyPolicy'),
          type: 'link',
          onPress: () =>
            router.navigate({ pathname: '/(tabs)/profile/privacy-policy' }),
        },
      ],
    },
    {
      id: 'danger',
      title: t('dangerZone'),
      items: [
        {
          icon: Lock,
          label: t('deleteAccount'),
          type: 'danger',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  if (privacyLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
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
          onPress={loadPrivacySettings}
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
          {t('privacySettings')}
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
                    index !== section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: paperTheme.colors.outline,
                    },
                  ]}
                  onPress={
                    item.type === 'button' ||
                    item.type === 'link' ||
                    item.type === 'danger'
                      ? item.onPress
                      : undefined
                  }
                  disabled={loading}
                >
                  <View style={styles.settingLeft}>
                    <item.icon
                      size={20}
                      color={
                        item.type === 'danger'
                          ? paperTheme.colors.error
                          : paperTheme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.settingLabel,
                        item.type === 'danger' && {
                          color: paperTheme.colors.error,
                        },
                        { color: paperTheme.colors.onSurface },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{
                        false: paperTheme.colors.surfaceVariant,
                        true: paperTheme.colors.primary,
                      }}
                      thumbColor={paperTheme.colors.onPrimary}
                      disabled={loading}
                    />
                  )}
                  {item.type === 'button' && (
                    <Text
                      style={[
                        styles.buttonText,
                        { color: paperTheme.colors.primary },
                      ]}
                    >
                      {t('change')}
                    </Text>
                  )}
                  {item.type === 'link' && (
                    <Text
                      style={[
                        styles.linkText,
                        { color: paperTheme.colors.primary },
                      ]}
                    >
                      {t('view')}
                    </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
});
