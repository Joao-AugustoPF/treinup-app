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

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await ProfileService.getUserProfile(user);

      // Configura o telefone
      setPhoneNumber(profile.phoneNumber || '');

      // Tenta extrair componentes de endereço se existir
      if (profile.location) {
        const addressParts = profile.location
          .split(',')
          .map((part) => part.trim());

        // Tenta preencher os campos de endereço se possível
        if (addressParts.length >= 1) setStreet(addressParts[0] || '');
        if (addressParts.length >= 2) setNumber(addressParts[1] || '');
        if (addressParts.length >= 3) setComplement(addressParts[2] || '');
        if (addressParts.length >= 4) setCity(addressParts[3] || '');
        if (addressParts.length >= 5) setState(addressParts[4] || '');
      }

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

      // Combina os campos de endereço em uma única string
      const location = [street, number, complement, city, state]
        .filter(Boolean) // Remove campos vazios
        .join(', ');

      await ProfileService.updateContactInfo(user, {
        phoneNumber,
        location,
        birthDate,
        addressZip: zipCode,
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={saving}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(255,20,147,0.7)" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações de Contato</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#666"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                editable={!saving}
                maxLength={15}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#666"
                value={birthDate}
                onChangeText={handleBirthDateChange}
                editable={!saving}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>CEP</Text>
              <TextInput
                style={[styles.input, !zipCode && styles.requiredInput]}
                placeholder="00000-000"
                placeholderTextColor="#666"
                value={zipCode}
                onChangeText={handleZipCodeChange}
                editable={!saving}
                keyboardType="numeric"
                maxLength={9}
              />
              {!zipCode && (
                <Text style={styles.requiredText}>
                  CEP é obrigatório para continuar
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rua/Avenida</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome da rua"
                placeholderTextColor="#666"
                value={street}
                onChangeText={setStreet}
                editable={!saving}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formColumn]}>
                <Text style={styles.label}>Número</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nº"
                  placeholderTextColor="#666"
                  value={number}
                  onChangeText={setNumber}
                  editable={!saving}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, styles.formColumn]}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apto, Bloco, etc."
                  placeholderTextColor="#666"
                  value={complement}
                  onChangeText={setComplement}
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formColumn]}>
                <Text style={styles.label}>Cidade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  placeholderTextColor="#666"
                  value={city}
                  onChangeText={setCity}
                  editable={!saving}
                />
              </View>

              <View style={[styles.formGroup, styles.formColumn]}>
                <Text style={styles.label}>Estado</Text>
                <TextInput
                  style={styles.input}
                  placeholder="UF"
                  placeholderTextColor="#666"
                  value={state}
                  onChangeText={(text) => setState(text.toUpperCase())}
                  editable={!saving}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formColumn: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  requiredInput: {
    borderColor: '#FF4444',
  },
  requiredText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: 'rgba(255,20,147,0.7)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
