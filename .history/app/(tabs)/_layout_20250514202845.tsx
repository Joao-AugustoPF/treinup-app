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

  // Only render tabs that are visible according to privacy settings
  const visibleTabs = [
    {
      name: 'classes',
      title: 'Aulas',
      icon: ({ size, color }: { size: number; color: string }) => (
        <Yoga size={size} color={color} />
      ),
      visible: privacySettings.showClasses,
    },
    {
      name: 'workouts',
      title: 'Treinos',
      icon: ({ size, color }: { size: number; color: string }) => (
        <ClipboardList size={size} color={color} />
      ),
      visible: privacySettings.showWorkouts,
    },
    {
      name: 'schedule',
      title: 'Avaliação',
      icon: ({ size, color }: { size: number; color: string }) => (
        <Calendar size={size} color={color} />
      ),
      visible: privacySettings.showEvaluation,
    },
    {
      name: 'progress',
      title: 'Progresso',
      icon: ({ size, color }: { size: number; color: string }) => (
        <LineChart size={size} color={color} />
      ),
      visible: privacySettings.showProgress,
    },
    {
      name: 'profile',
      title: 'Perfil',
      icon: ({ size, color }: { size: number; color: string }) => (
        <User size={size} color={color} />
      ),
      visible: true, // Always visible
    },
    {
      name: 'community',
      title: 'Comunidade',
      icon: ({ size, color }: { size: number; color: string }) => (
        <Users size={size} color={color} />
      ),
      visible: privacySettings.publicProfile,
    },
  ];

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
        {visibleTabs
          .filter((tab) => tab.visible)
          .map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                foc
                tabBarIcon: tab.icon,
              }}
            />
          ))}
      </Tabs>
      <NotificationsButton />
    </View>
  );
}
