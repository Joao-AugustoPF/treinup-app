import { useAuth } from '@/src/context/AuthContext';
import { usePrivacy } from '@/src/context/PrivacyContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Eye,
  Key,
  Lock,
  Shield,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
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

export default function PrivacyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    privacySettings,
    updatePrivacySetting,
    isLoading: privacyLoading,
  } = usePrivacy();
  const [loading, setLoading] = useState(false);

  const handleTogglePrivacy = async (
    key: keyof typeof privacySettings,
    value: boolean
  ) => {
    try {
      setLoading(true);
      await updatePrivacySetting(key, value);
      Alert.alert(
        'Sucesso',
        'Configurações de privacidade atualizadas com sucesso'
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar configurações de privacidade');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      await ProfileService.initiatePasswordReset(user);
      Alert.alert(
        'Redefinir Senha',
        'Um link para redefinir sua senha foi enviado para seu endereço de email.'
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao iniciar redefinição de senha');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ProfileService.deleteAccount(user);
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir conta');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const settings = [
    {
      id: 'visibility',
      title: 'Visibilidade do Perfil',
      items: [
        {
          icon: Users,
          label: 'Perfil Público',
          value: privacySettings.publicProfile,
          onToggle: () =>
            handleTogglePrivacy(
              'publicProfile',
              !privacySettings.publicProfile
            ),
          type: 'switch',
        },
        {
          icon: Eye,
          label: 'Mostrar Treinos',
          value: privacySettings.showWorkouts,
          onToggle: () =>
            handleTogglePrivacy('showWorkouts', !privacySettings.showWorkouts),
          type: 'switch',
        },
        {
          icon: Calendar,
          label: 'Mostrar Aulas',
          value: privacySettings.showClasses,
          onToggle: () =>
            handleTogglePrivacy('showClasses', !privacySettings.showClasses),
          type: 'switch',
        },
        {
          icon: BookOpen,
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
          icon: Eye,
          label: 'Mostrar Progresso',
          value: privacySettings.showProgress,
          onToggle: () =>
            handleTogglePrivacy('showProgress', !privacySettings.showProgress),
          type: 'switch',
        },
      ],
    },
    {
      id: 'security',
      title: 'Segurança',
      items: [
        {
          icon: Lock,
          label: 'Autenticação de Dois Fatores',
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
          label: 'Alterar Senha',
          type: 'button',
          onPress: handleChangePassword,
        },
        {
          icon: Shield,
          label: 'Política de Privacidade',
          type: 'link',
          onPress: () =>
            router.navigate({ pathname: '/(tabs)/profile/privacy-policy' }),
        },
      ],
    },
    {
      id: 'danger',
      title: 'Zona de Perigo',
      items: [
        {
          icon: Lock,
          label: 'Excluir Conta',
          type: 'danger',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  if (privacyLoading) {
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
        <Text style={styles.title}>Configurações de Privacidade</Text>
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
                      color={item.type === 'danger' ? '#FF4444' : '#666'}
                    />
                    <Text
                      style={[
                        styles.settingLabel,
                        item.type === 'danger' && styles.dangerText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#333', true: '#00E6C3' }}
                      thumbColor="#fff"
                      disabled={loading}
                    />
                  )}
                  {item.type === 'button' && (
                    <Text style={styles.buttonText}>Alterar</Text>
                  )}
                  {item.type === 'link' && (
                    <Text style={styles.linkText}>Ver</Text>
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
  buttonText: {
    color: '#00E6C3',
    fontSize: 16,
    fontWeight: '500',
  },
  linkText: {
    color: '#666',
    fontSize: 16,
  },
  dangerText: {
    color: '#FF4444',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
