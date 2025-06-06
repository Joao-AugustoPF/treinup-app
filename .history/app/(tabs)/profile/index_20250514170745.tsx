import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { usePlan } from '@/src/context/PlanContext';
import { PaymentService } from '@/src/services/payment';
import { ProfileService } from '@/src/services/profile';
import { useRouter } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronRight,
  CreditCard,
  Crown,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { userPlan } = usePlan();
  const { currentGym } = useGym();
  const [profile, setProfile] = useState<any | null>(null);
  const [paymentMethodsCount, setPaymentMethodsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userProfile, paymentMethods] = await Promise.all([
        ProfileService.getUserProfile(user),
        PaymentService.getSavedPaymentMethods(user),
      ]);
      setProfile(userProfile);
      setPaymentMethodsCount(paymentMethods.length);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreference = async (key: string, value: boolean) => {
    try {
      const updatedPreferences = await ProfileService.updatePreferences(user, {
        [key]: value,
      });
      setProfile((prev: any) =>
        prev
          ? {
              ...prev,
              preferences: updatedPreferences,
            }
          : null
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update preference');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleUploadPhoto = async () => {
    Alert.alert('Coming Soon', 'Photo upload will be available soon!');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00E6C3" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatExpiryDate = (date: Date) => {
    const today = new Date();
    const expiryDate = new Date(date);
    const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${diffDays} days`;
    }
  };

  const menuItems = [
    {
      icon: Crown,
      label: 'Membership Plan',
      value: userPlan?.name || 'No Plan',
      subtitle: userPlan ? formatExpiryDate(userPlan.expiresAt) : undefined,
      onPress: () => router.push('/(tabs)/plan'),
      type: 'link',
      color: userPlan?.color,
    },
    {
      icon: CreditCard,
      label: 'Payment Methods',
      subtitle: `${paymentMethodsCount} saved`,
      onPress: () => router.push('/(tabs)/payment'),
      type: 'link',
    },
    {
      icon: Bell,
      label: 'Push Notifications',
      value: profile.preferences.notifications,
      onPress: () =>
        handleUpdatePreference(
          'notifications',
          !profile.preferences.notifications
        ),
      type: 'switch',
    },
    {
      icon: Mail,
      label: 'Email Updates',
      value: profile.preferences.emailUpdates,
      onPress: () =>
        handleUpdatePreference(
          'emailUpdates',
          !profile.preferences.emailUpdates
        ),
      type: 'switch',
    },
    {
      icon: Shield,
      label: 'Privacy Settings',
      onPress: () => router.push('/(tabs)/profile/privacy'),
      type: 'link',
    },
    {
      icon: Settings,
      label: 'App Settings',
      onPress: () => router.push('/(tabs)/profile/settings'),
      type: 'link',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: profile.photoURL }}
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleUploadPhoto}
              >
                <Camera size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.workouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.classes}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.achievements}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Phone size={20} color="#666" />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phoneNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <MapPin size={20} color="#666" />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{profile.location}</Text>
            </View>
            {currentGym && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Current Gym</Text>
                <Text style={styles.infoValue}>{currentGym.name}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index !== menuItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <item.icon size={20} color={item.color || '#666'} />
                  <View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    {item.subtitle && (
                      <Text
                        style={[
                          styles.menuItemSubtitle,
                          item.subtitle.includes('Expires') &&
                            styles.expiryText,
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                    {item.type === 'link' && item.value && (
                      <Text
                        style={[
                          styles.menuItemValue,
                          item.color && { color: item.color },
                        ]}
                      >
                        {item.value}
                      </Text>
                    )}
                  </View>
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onPress}
                    trackColor={{ false: '#333', true: '#00E6C3' }}
                    thumbColor={
                      Platform.OS === 'ios'
                        ? '#fff'
                        : item.value
                        ? '#fff'
                        : '#f4f3f4'
                    }
                  />
                ) : (
                  <ChevronRight size={20} color="#666" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  header: {
    backgroundColor: '#1a1a1a',
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00E6C3',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#00E6C3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginTop: -20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
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
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  menuCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#fff',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  expiryText: {
    color: '#FFD93D',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#00E6C3',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
