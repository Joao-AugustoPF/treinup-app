import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const { t } = useLocalization();
  const { paperTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await ProfileService.getUserProfile(user);

      setFormData({
        displayName: profile.displayName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        birthDate: profile.birthDate || '',
        addressStreet: profile.addressStreet || '',
        addressNumber: profile.addressNumber || '',
        addressComplement: profile.addressComplement || '',
        addressCity: profile.addressCity || '',
        addressState: profile.addressState || '',
        addressZip: profile.addressZip || '',
      });
    } catch (error) {
      setError('Falha ao carregar dados do perfil');
      Alert.alert('Erro', 'Falha ao carregar dados do perfil');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await ProfileService.updateContactInfo(user, {
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate,
        address: {
          street: formData.addressStreet,
          number: formData.addressNumber,
          complement: formData.addressComplement,
          city: formData.addressCity,
          state: formData.addressState,
          zip: formData.addressZip,
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
    handleInputChange('phoneNumber', formatPhoneNumber(text));
  };

  const handleBirthDateChange = (text: string) => {
    handleInputChange('birthDate', formatBirthDate(text));
  };

  const handleZipCodeChange = (text: string) => {
    handleInputChange('addressZip', formatZipCode(text));
  };

  if (loading) {
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
          onPress={loadUserProfile}
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
      <ScrollView>
        <View
          style={[
            styles.header,
            { backgroundColor: paperTheme.colors.surface },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={paperTheme.colors.onSurface} />
            </TouchableOpacity>
            <Text
              style={[styles.headerTitle, { color: paperTheme.colors.onSurface }]}
            >
              {t('editProfile')}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View
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
              {t('personalInformation')}
            </Text>

            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                {t('name')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paperTheme.colors.onSurfaceVariant,
                    backgroundColor: paperTheme.colors.surfaceVariant,
                    borderColor: paperTheme.colors.outline,
                  },
                ]}
                value={formData.displayName}
                editable={false}
                placeholder={t('enterName')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                {t('email')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paperTheme.colors.onSurfaceVariant,
                    backgroundColor: paperTheme.colors.surfaceVariant,
                    borderColor: paperTheme.colors.outline,
                  },
                ]}
                value={formData.email}
                editable={false}
                placeholder={t('enterEmail')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                {t('phone')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paperTheme.colors.onSurface,
                    backgroundColor: paperTheme.colors.surfaceVariant,
                    borderColor: paperTheme.colors.outline,
                  },
                ]}
                value={formData.phoneNumber}
                onChangeText={(text) => handlePhoneChange(text)}
                placeholder={t('enterPhone')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View
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
              {t('address')}
            </Text>

            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                {t('street')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paperTheme.colors.onSurface,
                    backgroundColor: paperTheme.colors.surfaceVariant,
                    borderColor: paperTheme.colors.outline,
                  },
                ]}
                value={formData.addressStreet}
                onChangeText={(text) =>
                  handleInputChange('addressStreet', text)
                }
                placeholder={t('enterStreet')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                {t('city')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paperTheme.colors.onSurface,
                    backgroundColor: paperTheme.colors.surfaceVariant,
                    borderColor: paperTheme.colors.outline,
                  },
                ]}
                value={formData.addressCity}
                onChangeText={(text) => handleInputChange('addressCity', text)}
                placeholder={t('enterCity')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                {t('state')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paperTheme.colors.onSurface,
                    backgroundColor: paperTheme.colors.surfaceVariant,
                    borderColor: paperTheme.colors.outline,
                  },
                ]}
                value={formData.addressState}
                onChangeText={(text) => handleInputChange('addressState', text)}
                placeholder={t('enterState')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.label,
                  { color: paperTheme.colors.onSurfaceVariant },
                ]}
              >
                {t('zipCode')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paperTheme.colors.onSurface,
                    backgroundColor: paperTheme.colors.surfaceVariant,
                    borderColor: paperTheme.colors.outline,
                  },
                ]}
                value={formData.addressZip}
                onChangeText={(text) => handleZipCodeChange(text)}
                placeholder={t('enterZipCode')}
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: paperTheme.colors.primary },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={paperTheme.colors.onPrimary} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  { color: paperTheme.colors.onPrimary },
                ]}
              >
                {t('save')}
              </Text>
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
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
