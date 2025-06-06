import ImageUploader from '@/src/components/ImageUploader';
import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { usePlan } from '@/src/context/PlanContext';
import { useTheme } from '@/src/context/ThemeContext';
import { PaymentService } from '@/src/services/payment';
import { ProfileService } from '@/src/services/profile';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  Calendar,
  ChevronRight,
  Crown,
  LogOut,
  LucideIcon,
  MapPin,
  Phone,
  Settings,
  Shield,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type MenuItem = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onPress: () => void;
  type: 'link' | 'switch';
  badge?: string;
  color?: string;
  value?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { userPlan } = usePlan();
  const { currentGym } = useGym();
  const { unreadCount } = useNotifications();
  const { t } = useLocalization();
  const { paperTheme } = useTheme();
  const [profile, setProfile] = useState<any | null>(null);
  const [paymentMethodsCount, setPaymentMethodsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  if (error || !profile) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: paperTheme.colors.error }]}>
          {error || t('profileNotFound')}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: paperTheme.colors.primary },
          ]}
          onPress={loadProfile}
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

  const menuItems: MenuItem[] = [
    {
      icon: Bell,
      label: t('notifications'),
      subtitle: unreadCount > 0 ? `${unreadCount} ${t('unread')}` : undefined,
      onPress: () => router.push('/notifications'),
      type: 'link',
      badge: unreadCount > 0 ? unreadCount.toString() : undefined,
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
    <View
      style={[
        styles.container,
        { backgroundColor: paperTheme.colors.background },
      ]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[paperTheme.colors.primary]}
            tintColor={paperTheme.colors.primary}
          />
        }
      >
        <View
          style={[
            styles.header,
            { backgroundColor: paperTheme.colors.surface },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.profileImageContainer}>
              {uploading ? (
                <View style={[styles.profileImage, styles.uploadingContainer]}>
                  <ActivityIndicator
                    color={paperTheme.colors.onPrimary}
                    size="small"
                  />
                </View>
              ) : (
                <ImageUploader
                  onUploadComplete={loadProfile}
                  image={profile.photoURL}
                  size={100}
                  borderColor={paperTheme.colors.primary}
                  iconColor={paperTheme.colors.onPrimary}
                />
              )}
            </View>
            <Text style={[styles.name, { color: paperTheme.colors.onSurface }]}>
              {profile.displayName}
            </Text>
            <Text
              style={[
                styles.email,
                { color: paperTheme.colors.onSurfaceVariant },
              ]}
            >
              {profile.email}
            </Text>
            {currentGym && (
              <View
                style={[
                  styles.academyBadge,
                  { backgroundColor: paperTheme.colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.academyName,
                    { color: paperTheme.colors.onPrimary },
                  ]}
                >
                  {currentGym.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: paperTheme.colors.onSurface },
            ]}
          >
            {t('personalInformation')}
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: paperTheme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.infoItem,
                { borderBottomColor: paperTheme.colors.surfaceVariant },
              ]}
            >
              <Phone size={20} color={paperTheme.colors.primary} />
              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: paperTheme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('phone')}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: paperTheme.colors.onSurface },
                  ]}
                >
                  {profile.phoneNumber || t('notProvided')}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.infoItem,
                { borderBottomColor: paperTheme.colors.surfaceVariant },
              ]}
            >
              <MapPin size={20} color={paperTheme.colors.primary} />
              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: paperTheme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('address')}
                </Text>
                {profile.addressStreet ? (
                  <>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: paperTheme.colors.onSurface },
                      ]}
                    >
                      {profile.addressStreet}
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: paperTheme.colors.onSurface },
                      ]}
                    >
                      {`${profile.addressCity || ''}${
                        profile.addressCity && profile.addressState ? ', ' : ''
                      }${profile.addressState || ''}`}
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: paperTheme.colors.onSurface },
                      ]}
                    >
                      {profile.addressZip || ''}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={[
                      styles.infoValue,
                      { color: paperTheme.colors.onSurface },
                    ]}
                  >
                    {t('addressNotRegistered')}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: paperTheme.colors.primary },
              ]}
              onPress={() => router.push('/profile/edit')}
            >
              <Text
                style={[
                  styles.editButtonText,
                  { color: paperTheme.colors.onPrimary },
                ]}
              >
                {t('editInformation')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {(!profile.addressZip ||
          !profile.addressStreet ||
          !profile.addressCity ||
          !profile.addressState) && (
          <TouchableOpacity
            style={[
              styles.warningLine,
              { backgroundColor: paperTheme.colors.errorContainer },
            ]}
            onPress={() => router.push('/profile/edit')}
          >
            <Text
              style={[
                styles.warningLineText,
                { color: paperTheme.colors.error },
              ]}
            >
              {t('addressInfoRequired')}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: paperTheme.colors.onSurface },
            ]}
          >
            {t('membershipPlan')}
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: paperTheme.colors.surface },
            ]}
          >
            {userPlan ? (
              <>
                <View
                  style={[
                    styles.infoItem,
                    { borderBottomColor: paperTheme.colors.surfaceVariant },
                  ]}
                >
                  <Crown size={20} color={userPlan.color} />
                  <View style={styles.infoContent}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: paperTheme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('planName')}
                    </Text>
                    <Text style={[styles.infoValue, { color: userPlan.color }]}>
                      {userPlan.name}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.infoItem,
                    { borderBottomColor: paperTheme.colors.surfaceVariant },
                  ]}
                >
                  <Calendar size={20} color={userPlan.color} />
                  <View style={styles.infoContent}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: paperTheme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('expiryDate')}
                    </Text>
                    <Text style={[styles.infoValue, { color: userPlan.color }]}>
                      {formatExpiryDate(userPlan.expiresAt)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noPlanContainer}>
                <Text
                  style={[
                    styles.noPlanText,
                    { color: paperTheme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('noActivePlan')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: paperTheme.colors.onSurface },
            ]}
          >
            {t('settings')}
          </Text>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: paperTheme.colors.surface },
            ]}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index !== menuItems.length - 1 && [
                    styles.menuItemBorder,
                    { borderBottomColor: paperTheme.colors.surfaceVariant },
                  ],
                ]}
                onPress={item.type === 'switch' ? undefined : item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuItemIcon,
                      {
                        backgroundColor:
                          item.color || paperTheme.colors.primary,
                      },
                    ]}
                  >
                    <item.icon size={20} color={paperTheme.colors.onPrimary} />
                    {item.badge && (
                      <View
                        style={[
                          styles.menuItemBadge,
                          { backgroundColor: paperTheme.colors.error },
                        ]}
                      >
                        <Text
                          style={[
                            styles.menuItemBadgeText,
                            { color: paperTheme.colors.onError },
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        { color: paperTheme.colors.onSurface },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text
                        style={[
                          styles.menuItemSubtitle,
                          { color: paperTheme.colors.onSurfaceVariant },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={typeof item.value === 'boolean' ? item.value : false}
                    onValueChange={item.onPress}
                    trackColor={{
                      false: paperTheme.colors.surfaceVariant,
                      true: paperTheme.colors.primary,
                    }}
                    thumbColor={paperTheme.colors.onPrimary}
                  />
                ) : (
                  <ChevronRight
                    size={20}
                    color={paperTheme.colors.onSurfaceVariant}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: paperTheme.colors.surface },
          ]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={paperTheme.colors.error} />
          <Text style={[styles.logoutText, { color: paperTheme.colors.error }]}>
            {t('logout')}
          </Text>
        </TouchableOpacity>
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
  },
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    marginBottom: 15,
  },
  academyBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  academyName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoCard: {
    borderRadius: 15,
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuCard: {
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
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
  },
  menuItemSubtitle: {
    fontSize: 14,
  },
  menuItemValue: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  menuItemBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  noPlanContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noPlanText: {
    fontSize: 16,
    marginBottom: 15,
  },
  warningLine: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  warningLineText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
