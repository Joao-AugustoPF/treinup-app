import NotificationsButton from '@/components/NotificationsButton';
import { useTheme } from '@/src/context/ThemeContext';
import { Redirect, Tabs } from 'expo-router';
import {
  Calendar,
  ClipboardList,
  ChartLine as LineChart,
  User,
  Users,
  Cog as Yoga,
} from 'lucide-react-native';
import { View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { usePrivacy } from '../../src/context/PrivacyContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { privacySettings, isLoading: isLoadingPrivacy } = usePrivacy();
  const { isDarkMode } = useTheme();

  if (isLoading || isLoadingPrivacy) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  // Dark mode colors
  const darkColors = {
    background: '#121212',
    tabBar: '#1a1a1a',
    border: '#333',
    active: '#00E6C3',
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

  console.log('privacySettings', privacySettings.showNotificationIcon);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.active,
          tabBarInactiveTintColor: colors.inactive,
          headerStyle: { backgroundColor: colors.headerBg },
          headerTitleStyle: { color: colors.headerText, fontWeight: 'bold' },
        }}
      >
        <Tabs.Screen
          name="classes"
          options={{
            title: 'Aulas',
            tabBarIcon: ({ size, color }) => <Yoga size={size} color={color} />,
            href: privacySettings.showClasses ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="workouts"
          options={{
            title: 'Treinos',
            tabBarIcon: ({ size, color }) => (
              <ClipboardList size={size} color={color} />
            ),
            href: privacySettings.showWorkouts ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Avaliação',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
            href: privacySettings.showEvaluation ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progresso',
            tabBarIcon: ({ size, color }) => (
              <LineChart size={size} color={color} />
            ),
            href: privacySettings.showProgress ? undefined : null,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="community"
          options={{
            title: 'Comunidade',
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} />
            ),
            href: privacySettings.publicProfile ? undefined : null,
          }}
        />
      </Tabs>
      {privacySettings.showNotificationIcon && <NotificationsButton />}
    </View>
  );
}
