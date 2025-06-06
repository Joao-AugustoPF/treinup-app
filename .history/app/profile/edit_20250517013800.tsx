import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
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

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await ProfileService.getUserProfile(user);
      setProfile(userProfile);
      setAddress({
        street: userProfile.addressStreet || '',
        city: userProfile.addressCity || '',
        state: userProfile.addressState || '',
        zip: userProfile.addressZip || '',
      });
    } catch (err) {
      Alert.alert(t('error'), t('failedToLoadProfile'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ProfileService.updateProfile(user, {
        addressStreet: address.street,
        addressCity: address.city,
        addressState: address.state,
        addressZip: address.zip,
      });
      Alert.alert(t('success'), t('profileUpdated'), [
        {
          text: t('ok'),
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      Alert.alert(t('error'), t('failedToUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="rgba(255,20,147,0.7)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('address')}</Text>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('street')}</Text>
              <TextInput
                style={styles.input}
                value={address.street}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, street: text }))
                }
                placeholder={t('enterStreet')}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>{t('city')}</Text>
                <TextInput
                  style={styles.input}
                  value={address.city}
                  onChangeText={(text) =>
                    setAddress((prev) => ({ ...prev, city: text }))
                  }
                  placeholder={t('enterCity')}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>{t('state')}</Text>
                <TextInput
                  style={styles.input}
                  value={address.state}
                  onChangeText={(text) =>
                    setAddress((prev) => ({ ...prev, state: text }))
                  }
                  placeholder={t('enterState')}
                  placeholderTextColor="#666"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('zipCode')}</Text>
              <TextInput
                style={styles.input}
                value={address.zip}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, zip: text }))
                }
                placeholder={t('enterZipCode')}
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={8}
              />
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{t('cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>{t('save')}</Text>
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
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  form: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: 'rgba(255,20,147,0.7)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
