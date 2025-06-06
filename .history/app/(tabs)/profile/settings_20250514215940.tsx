import { useAuth } from '@/src/context/AuthContext';
import { usePrivacy } from '@/src/context/PrivacyContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import {
  ArrowLeft,
  Calendar,
  ClipboardList as Clipboard,
  Globe,
  BarChart as LineChart,
  LucideIcon,
  Moon,
  RefreshCw,
  Cog as Yoga,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    privacySettings,
    updatePrivacySetting,
    isLoading: privacyLoading,
  } = usePrivacy();
  const [loading, setLoading] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [preferences, setPreferences] = useState({
    autoUpdate: true,
    language: 'Português',
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const profile = await ProfileService.getUserProfile(user);
      setPreferences({
        autoUpdate: profile.preferences.autoUpdate,
        language: profile.preferences.language,
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar preferências');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreference = async (key: string, value: boolean) => {
    try {
      setLoading(true);
      await ProfileService.updatePreferences(user, { [key]: value });
      setPreferences((prev) => ({ ...prev, [key]: value }));
      Alert.alert('Sucesso', 'Configuração atualizada com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar configuração');
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
      Alert.alert('Sucesso', 'Configuração atualizada com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLanguage = () => {
    Alert.alert('Selecionar Idioma', 'Escolha seu idioma preferido', [
      { text: 'Português', onPress: () => handleUpdateLanguage('Português') },
      { text: 'English', onPress: () => handleUpdateLanguage('English') },
      { text: 'Español', onPress: () => handleUpdateLanguage('Español') },
      { text: 'Français', onPress: () => handleUpdateLanguage('Français') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleUpdateLanguage = async (language: string) => {
    try {
      setLoading(true);
      await ProfileService.updatePreferences(user, { language });
      setPreferences((prev) => ({ ...prev, language }));
      Alert.alert('Sucesso', 'Idioma atualizado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar idioma');
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
          Alert.alert(
            'Informação',
            'Verificação de atualizações indisponível no modo de desenvolvimento.'
          );
          setCheckingUpdate(false);
        }, 1000);
        return;
      }

      // Check for updates from Expo
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          'Atualização Disponível',
          'Uma nova versão está disponível. Deseja instalar agora?',
          [
            {
              text: 'Agora não',
              style: 'cancel',
            },
            {
              text: 'Instalar',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    'Sucesso',
                    'Atualização baixada. O aplicativo será reiniciado para aplicar as mudanças.',
                    [
                      {
                        text: 'OK',
                        onPress: () => Updates.reloadAsync(),
                      },
                    ]
                  );
                } catch (error) {
                  Alert.alert(
                    'Erro',
                    'Falha ao baixar atualização. Tente novamente mais tarde.'
                  );
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Atualizado',
          'Você está usando a versão mais recente do aplicativo.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        'Falha ao verificar atualizações. Verifique sua conexão com a internet.'
      );
      console.error('Update check error:', error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const settings: SettingSection[] = [
    {
      id: 'visibility',
      title: 'Visibilidade dos Módulos',
      items: [
        {
          icon: Yoga,
          label: 'Mostrar Aulas',
          value: privacySettings.showClasses,
          onToggle: () =>
            handleTogglePrivacy('showClasses', !privacySettings.showClasses),
          type: 'switch',
        },
        {
          icon: Clipboard,
          label: 'Mostrar Treinos',
          value: privacySettings.showWorkouts,
          onToggle: () =>
            handleTogglePrivacy('showWorkouts', !privacySettings.showWorkouts),
          type: 'switch',
        },
        {
          icon: Calendar,
          label: 'Mostrar Avaliação',
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
          label: 'Mostrar Progresso',
          value: privacySettings.showProgress,
          onToggle: () =>
            handleTogglePrivacy('showProgress', !privacySettings.showProgress),
          type: 'switch',
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Aparência',
      items: [
        {
          icon: Moon,
          label: 'Modo Escuro',
          value: isDarkMode,
          onToggle: toggleTheme,
          type: 'switch',
        },
        {
          icon: Globe,
          label: 'Idioma',
          value: preferences.language,
          onPress: handleChangeLanguage,
          type: 'select',
        },
      ],
    },
    {
      id: 'general',
      title: 'Geral',
      items: [
        {
          icon: RefreshCw,
          label: 'Verificar Atualizações',
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
        <ActivityIndicator size="large" color="#00E6C3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações do App</Text>
      </View>

      <ScrollView style={styles.content}>
        {settings.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index !== section.items.length - 1 &&
                      styles.settingItemBorder,
                  ]}
                  onPress={
                    item.type === 'select' || item.type === 'button'
                      ? item.onPress
                      : undefined
                  }
                  disabled={loading || item.isLoading}
                >
                  <View style={styles.settingLeft}>
                    <item.icon size={20} color="#666" />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {item.type === 'switch' ? (
                    <Switch
                      value={
                        typeof item.value === 'boolean' ? item.value : false
                      }
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#333', true: '#00E6C3' }}
                      thumbColor="#fff"
                      disabled={loading}
                    />
                  ) : item.type === 'select' ? (
                    <Text style={styles.settingValue}>{item.value}</Text>
                  ) : (
                    <View style={styles.buttonContainer}>
                      {item.isLoading ? (
                        <ActivityIndicator size="small" color="#00E6C3" />
                      ) : (
                        <Text style={styles.buttonText}>
                          {item.label.includes('Atualiza') ? 'Verificar' : 'Ok'}
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
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#fff',
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
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  buttonText: {
    color: '#00E6C3',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
