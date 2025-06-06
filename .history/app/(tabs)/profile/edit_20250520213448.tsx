import { useAuth } from '@/src/context/AuthContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';

// Função para formatar o telefone no padrão brasileiro (xx) xxxxx-xxxx
const formatPhoneNumber = (value: string) => {
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');

  // Aplica a formatação
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
      7
    )}`;
  } else {
    // Limita a 11 dígitos (com DDD)
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
      7,
      11
    )}`;
  }
};

// Função para formatar a data de nascimento no padrão dd/mm/aaaa
const formatBirthDate = (value: string) => {
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');

  // Aplica a formatação
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 4) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  } else if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
  } else {
    // Limita a 8 dígitos (dd/mm/aaaa)
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(
      4,
      8
    )}`;
  }
};

// Função para formatar o CEP no padrão XXXXX-XXX
const formatZipCode = (value: string) => {
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');
  // Limita a 8 dígitos
  const limited = cleaned.slice(0, 8);
  // Formata como XXXXX-XXX
  return limited.replace(/(\d{5})(\d{3})?/, (_, p1, p2) => {
    return p2 ? `${p1}-${p2}` : p1;
  });
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const { paperTheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await ProfileService.getUserProfile(user);

      // Configura o telefone
      setPhoneNumber(profile.phoneNumber || '');

      // Configura os campos de endereço
      setStreet(profile.addressStreet || '');
      setNumber(profile.addressNumber || '');
      setComplement(profile.addressComplement || '');
      setCity(profile.addressCity || '');
      setState(profile.addressState || '');
      setZipCode(profile.addressZip || '');
      setBirthDate(profile.birthDate || '');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar dados do perfil');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await ProfileService.updateContactInfo(user, {
        phoneNumber,
        birthDate,
        address: {
          street: street,
          number: number,
          complement: complement,
          city: city,
          state: state,
          zip: zipCode,
        },
      });

      Alert.alert('Sucesso', 'Dados do perfil atualizados com sucesso.');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar os dados do perfil');
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleBirthDateChange = (text: string) => {
    setBirthDate(formatBirthDate(text));
  };

  const handleZipCodeChange = (text: string) => {
    setZipCode(formatZipCode(text));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: paperTheme.colors.background }]}>
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: paperTheme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: paperTheme.colors.onSurface }]}>{t('editProfile')}</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.section, { backgroundColor: paperTheme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>{t('personalInformation')}</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>{t('name')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: paperTheme.colors.surfaceVariant,
                  color: paperTheme.colors.onSurface,
                  borderColor: paperTheme.colors.outline
                }]}
                value={formData.displayName}
                onChangeText={(text) => handleInputChange('displayName', text)}
                placeholder={t('enterName')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>{t('email')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: paperTheme.colors.surfaceVariant,
                  color: paperTheme.colors.onSurface,
                  borderColor: paperTheme.colors.outline
                }]}
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder={t('enterEmail')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>{t('phone')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: paperTheme.colors.surfaceVariant,
                  color: paperTheme.colors.onSurface,
                  borderColor: paperTheme.colors.outline
                }]}
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                placeholder={t('enterPhone')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: paperTheme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>{t('address')}</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>{t('street')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: paperTheme.colors.surfaceVariant,
                  color: paperTheme.colors.onSurface,
                  borderColor: paperTheme.colors.outline
                }]}
                value={formData.addressStreet}
                onChangeText={(text) => handleInputChange('addressStreet', text)}
                placeholder={t('enterStreet')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>{t('city')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: paperTheme.colors.surfaceVariant,
                  color: paperTheme.colors.onSurface,
                  borderColor: paperTheme.colors.outline
                }]}
                value={formData.addressCity}
                onChangeText={(text) => handleInputChange('addressCity', text)}
                placeholder={t('enterCity')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>{t('state')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: paperTheme.colors.surfaceVariant,
                  color: paperTheme.colors.onSurface,
                  borderColor: paperTheme.colors.outline
                }]}
                value={formData.addressState}
                onChangeText={(text) => handleInputChange('addressState', text)}
                placeholder={t('enterState')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>{t('zipCode')}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: paperTheme.colors.surfaceVariant,
                  color: paperTheme.colors.onSurface,
                  borderColor: paperTheme.colors.outline
                }]}
                value={formData.addressZip}
                onChangeText={(text) => handleInputChange('addressZip', text)}
                placeholder={t('enterZipCode')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: paperTheme.colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={paperTheme.colors.onPrimary} />
            ) : (
              <Text style={[styles.saveButtonText, { color: paperTheme.colors.onPrimary }]}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
