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
      <NotificationsButton />
    </View>
  );
}
