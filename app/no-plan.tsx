import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { usePlan } from '@/src/context/PlanContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Lock,
    MessageCircle,
    Phone,
    RefreshCw
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NoPlanScreen() {
  const { user, logout } = useAuth();
  const { academyInfo, loading, checkPlanStatus, hasActivePlan } = usePlan();
  const { profile } = useProfile();
  const { paperTheme } = useTheme();
  const { t } = useLocalization();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleCall = () => {
    if (academyInfo?.phone) {
      Linking.openURL(`tel:${academyInfo.phone}`);
    } else {
      Alert.alert('Erro', 'Telefone da academia não disponível');
    }
  };

  const handleWhatsApp = () => {
    if (academyInfo?.phone) {
      const phoneNumber = academyInfo.phone.replace(/\D/g, '');
      const message = encodeURIComponent(
        'Olá! Gostaria de informações sobre os planos disponíveis na academia.'
      );
      const whatsappUrl = `whatsapp://send?phone=55${phoneNumber}&text=${message}`;
      
      Linking.canOpenURL(whatsappUrl).then((supported) => {
        try {
            Linking.openURL(whatsappUrl);
        } catch (error) {
            Alert.alert('Erro', 'WhatsApp não está instalado no seu dispositivo');
            console.log(error);
        }
      });
    } else {
      Alert.alert('Erro', 'Telefone da academia não disponível');
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await checkPlanStatus();
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      setTimeout(() => {
        // Verificar se agora tem plano ativo ou é OWNER/TRAINER
        if (hasActivePlan || profile?.role === 'OWNER' || profile?.role === 'TRAINER') {
          // Redirecionar para as abas principais
          router.replace('/profile');
        } else {
          Alert.alert('Sem Plano', 'Você ainda não possui um plano ativo. Entre em contato com a academia.');
        }
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao verificar plano:', error);
      Alert.alert('Erro', 'Erro ao verificar plano. Tente novamente.');
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setTimeout(() => {
        router.push('/login');
      }, 500);
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Erro', 'Erro ao fazer logout. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
        <Text style={[styles.loadingText, { color: paperTheme.colors.onBackground }]}>
          Verificando seu plano...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.backButton}>
          <ArrowLeft size={24} color={paperTheme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: paperTheme.colors.onBackground }]}>
          Acesso Restrito
        </Text>
      </View>

      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: paperTheme.colors.surfaceVariant }]}>
          <Lock size={80} color={paperTheme.colors.primary} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: paperTheme.colors.onBackground }]}>
          Plano Necessário
        </Text>
        
        <Text style={[styles.message, { color: paperTheme.colors.onSurfaceVariant }]}>
          Para acessar o aplicativo, você precisa ter um plano ativo na academia.
        </Text>

        {academyInfo && (
          <View style={[styles.academyInfo, { backgroundColor: paperTheme.colors.surface }]}>
            <Text style={[styles.academyName, { color: paperTheme.colors.onSurface }]}>
              {academyInfo.name}
            </Text>
            {academyInfo.phone && (
              <Text style={[styles.academyPhone, { color: paperTheme.colors.onSurfaceVariant }]}>
                {academyInfo.phone}
              </Text>
            )}
          </View>
        )}

        <Text style={[styles.contactMessage, { color: paperTheme.colors.onSurfaceVariant }]}>
          Entre em contato conosco para conhecer nossos planos e ativar seu acesso:
        </Text>

        <View style={styles.contactButtons}>
          {academyInfo?.phone && (
            <>
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: paperTheme.colors.primary }]}
                onPress={handleCall}
              >
                <Phone size={24} color="#fff" />
                <Text style={styles.contactButtonText}>Ligar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: '#25D366' }]}
                onPress={handleWhatsApp}
              >
                <MessageCircle size={24} color="#fff" />
                <Text style={styles.contactButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: paperTheme.colors.surfaceVariant }]}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={paperTheme.colors.onSurfaceVariant} />
          ) : (
            <RefreshCw size={20} color={paperTheme.colors.onSurfaceVariant} />
          )}
          <Text style={[styles.refreshButtonText, { color: paperTheme.colors.onSurfaceVariant }]}>
            {refreshing ? 'Verificando...' : 'Verificar Novamente'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  academyInfo: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    minWidth: 280,
  },
  academyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  academyPhone: {
    fontSize: 16,
  },
  contactMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
}); 