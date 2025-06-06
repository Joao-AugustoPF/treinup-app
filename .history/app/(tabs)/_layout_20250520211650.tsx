import NotificationsButton from '@/components/NotificationsButton';
import { useLocalization } from '@/src/context/LocalizationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Redirect, Tabs } from 'expo-router';
import {
  Calendar,
  CalendarClock as Classes,
  ClipboardList,
  ChartLine as LineChart,
  User,
  Users,
} from 'lucide-react-native';
import { View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { usePrivacy } from '../../src/context/PrivacyContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { privacySettings, isLoading: isLoadingPrivacy } = usePrivacy();
  const { isDarkMode } = useTheme();
  const { t } = useLocalization();

  if (isLoading || isLoadingPrivacy) return null;
  if (!user) return <Redirect href="//login" />;

  // Dark mode colors
  const darkColors = {
    background: '#121212',
    tabBar: '#1a1a1a',
    border: '#333',
    active: 'rgba(255,20,147,0.7)',
    inactive: '#666',
    headerBg: '#1a1a1a',
    headerText: '#fff',
  };

  // Light mode colors
  const lightColors = {
    background: '#f5f5f5',
    tabBar: '#ffffff',
    border: '#e0e0e0',
    active: '#00A090',
    inactive: '#757575',
    headerBg: '#ffffff',
    headerText: '#121212',
  };

  // Current theme colors
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.outline,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.onSurface, fontWeight: 'bold' },
        }}
      >
        <Tabs.Screen
          name="classes"
          options={{
            title: t('classes'),
            tabBarIcon: ({ size, color }) => (
              <Classes size={size} color={color} />
            ),
            href: privacySettings.showClasses ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="workouts"
          options={{
            title: t('workouts'),
            tabBarIcon: ({ size, color }) => (
              <ClipboardList size={size} color={color} />
            ),
            href: privacySettings.showWorkouts ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="schedule"
          options={{
            title: t('evaluation'),
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
            href: privacySettings.showEvaluation ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="progress"
          options={{
            title: t('progress'),
            tabBarIcon: ({ size, color }) => (
              <LineChart size={size} color={color} />
            ),
            href: privacySettings.showProgress ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="community"
          options={{
            title: t('community'),
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} />
            ),
            href: privacySettings.publicProfile ? undefined : null,
          }}
        />
      </Tabs>
      {privacySettings.showNotificationIcon ? <NotificationsButton /> : null}
    </View>
  );
}
