import NotificationsButton from '@/components/NotificationsButton';
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

  if (isLoading || isLoadingPrivacy) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  // Helper to generate tab options with visibility control
  const getTabOptions = (
    title: string,
    icon: (props: { size: number; color: string }) => JSX.Element,
    isVisible: boolean
  ) => ({
    title,
    tabBarIcon: icon,
    tabBarStyle: isVisible
      ? { backgroundColor: '#1a1a1a', borderTopColor: '#333' }
      : { display: 'none', height: 0 },
    href: isVisible ? undefined : null,
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' },
          tabBarActiveTintColor: '#00E6C3',
          tabBarInactiveTintColor: '#666',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
        }}
      >
        <Tabs.Screen
          name="classes"
          options={getTabOptions(
            'Aulas',
            ({ size, color }) => (
              <Yoga size={size} color={color} />
            ),
            privacySettings.showClasses
          )}
        />

        <Tabs.Screen
          name="workouts"
          options={getTabOptions(
            'Treinos',
            ({ size, color }) => (
              <ClipboardList size={size} color={color} />
            ),
            privacySettings.showWorkouts
          )}
        />

        <Tabs.Screen
          name="schedule"
          options={getTabOptions(
            'Avaliação',
            ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
            privacySettings.showEvaluation
          )}
        />

        <Tabs.Screen
          name="progress"
          options={getTabOptions(
            'Progresso',
            ({ size, color }) => (
              <LineChart size={size} color={color} />
            ),
            privacySettings.showProgress
          )}
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
          options={getTabOptions(
            'Comunidade',
            ({ size, color }) => (
              <Users size={size} color={color} />
            ),
            privacySettings.publicProfile
          )}
        />
      </Tabs>
      <NotificationsButton />
    </View>
  );
}
