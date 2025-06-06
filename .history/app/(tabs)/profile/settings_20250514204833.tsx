import { useAuth } from '@/src/context/AuthContext';
import { usePrivacy } from '@/src/context/PrivacyContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Calendar,
  ClipboardList as Clipboard,
  Globe,
  BarChart as LineChart,
  Moon,
  RefreshCw,
  Trash,
  Vibrate as Vibration,
  Wifi,
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

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    privacySettings,
    updatePrivacySetting,
    isLoading: privacyLoading,
  } = usePrivacy();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    darkMode: true,
    offlineMode: false,
    hapticFeedback: true,
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
        darkMode: profile.preferences.darkMode,
        offlineMode: profile.preferences.offlineMode,
        hapticFeedback: profile.preferences.hapticFeedback,
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

  const handleClearCache = async () => {
    Alert.alert(
      'Limpar Cache',
      'Tem certeza que deseja limpar o cache do aplicativo? Isso não afetará seus dados salvos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Simulate cache clearing
              await new Promise((resolve) => setTimeout(resolve, 1000));
              Alert.alert('Sucesso', 'Cache limpo com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar cache');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckUpdates = async () => {
    try {
      setLoading(true);
      // Simulate checking for updates
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Atualizado',
        'Você está usando a versão mais recente do aplicativo'
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao verificar atualizações');
    } finally {
      setLoading(false);
    }
  };

  const settings = [
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
          value: preferences.darkMode,
          onToggle: () =>
            handleUpdatePreference('darkMode', !preferences.darkMode),
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
          icon: Bell,
          label: 'Atualizações Automáticas',
          value: preferences.autoUpdate,
          onToggle: () =>
            handleUpdatePreference('autoUpdate', !preferences.autoUpdate),
          type: 'switch',
        },
        {
          icon: RefreshCw,
          label: 'Verificar Atualizações',
          onPress: handleCheckUpdates,
          type: 'button',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Desempenho',
      items: [
        {
          icon: Wifi,
          label: 'Modo Offline',
          value: preferences.offlineMode,
          onToggle: () =>
            handleUpdatePreference('offlineMode', !preferences.offlineMode),
          type: 'switch',
        },
        {
          icon: Vibration,
          label: 'Feedback Tátil',
          value: preferences.hapticFeedback,
          onToggle: () =>
            handleUpdatePreference(
              'hapticFeedback',
              !preferences.hapticFeedback
            ),
          type: 'switch',
        },
        {
          icon: Trash,
          label: 'Limpar Cache',
          onPress: handleClearCache,
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
                  disabled={loading}
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
                    <Text style={styles.buttonText}>
                      {item.label === 'Limpar Cache' ? 'Limpar' : 'Verificar'}
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
