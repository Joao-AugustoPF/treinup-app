import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { usePlan } from '@/src/context/PlanContext';
import { PaymentService } from '@/src/services/payment';
import { ProfileService } from '@/src/services/profile';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronRight,
  Crown,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
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
  const { unreadCount } = useNotifications();
  const { t } = useLocalization();
  const [profile, setProfile] = useState<any | null>(null);
  const [paymentMethodsCount, setPaymentMethodsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Reload profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [user])
  );

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
      setError(t('failedToLoadProfile'));
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
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
      Alert.alert(t('error'), t('failedToUpdateLanguage'));
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logout'), t('logoutConfirmation'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert(t('error'), t('logoutFailed'));
          }
        },
      },
    ]);
  };

  const handleUploadPhoto = async () => {
    Alert.alert(t('comingSoon'), t('photoUploadSoon'));
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
        <Text style={styles.errorText}>{error || t('profileNotFound')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
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
      return t('expiryToday');
    } else if (diffDays === 1) {
      return t('expiryTomorrow');
    } else {
      return t('expiryDays').replace('{days}', diffDays.toString());
    }
  };

  const menuItems = [
    {
      icon: Crown,
      label: t('membershipPlan'),
      value: userPlan?.name || t('noPlan'),
      subtitle: userPlan ? formatExpiryDate(userPlan.expiresAt) : undefined,
      onPress: () => router.push('../plan'),
      type: 'link',
      color: userPlan?.color,
    },
    {
      icon: Bell,
      label: t('notifications'),
      subtitle: unreadCount > 0 ? `${unreadCount} ${t('unread')}` : undefined,
      onPress: () => router.push('/notifications'),
      type: 'link',
      badge: unreadCount > 0 ? unreadCount.toString() : undefined,
    },
    {
      icon: Bell,
      label: t('pushNotifications'),
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
      label: t('emailUpdates'),
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
      label: t('privacySettings'),
      onPress: () => router.push('/profile/privacy'),
      type: 'link',
    },
    {
      icon: Settings,
      label: t('appSettings'),
      onPress: () => router.push('/profile/settings'),
      type: 'link',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00E6C3']}
            tintColor="#00E6C3"
          />
        }
      >
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
            {currentGym && (
              <View style={styles.academyBadge}>
                <Text style={styles.academyName}>{currentGym.name}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.workouts}</Text>
            <Text style={styles.statLabel}>{t('workoutsLabel')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.classes}</Text>
            <Text style={styles.statLabel}>{t('classesLabel')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.achievements}</Text>
            <Text style={styles.statLabel}>{t('achievementsLabel')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Phone size={20} color="#00E6C3" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('phone')}</Text>
                <Text style={styles.infoValue}>
                  {profile.phoneNumber || t('notProvided')}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MapPin size={20} color="#00E6C3" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('address')}</Text>
                <Text style={styles.infoValue}>
                  {profile.location || t('addressNotRegistered')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Text style={styles.editButtonText}>{t('editInformation')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index !== menuItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.type === 'switch' ? undefined : item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuItemIcon,
                      item.color && { backgroundColor: item.color },
                    ]}
                  >
                    <item.icon size={20} color="#fff" />
                    {item.badge && (
                      <View style={styles.menuItemBadge}>
                        <Text style={styles.menuItemBadgeText}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    {item.subtitle && (
                      <Text style={styles.menuItemSubtitle}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={typeof item.value === 'boolean' ? item.value : false}
                    onValueChange={item.onPress}
                    trackColor={{ false: '#333', true: '#00E6C3' }}
                    thumbColor="#fff"
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
          <Text style={styles.logoutText}>{t('logout')}</Text>
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
  academyBadge: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  academyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#121212',
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
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
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
  editButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
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
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  menuItemBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
