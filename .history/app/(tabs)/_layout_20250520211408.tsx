import NotificationsButton from '@/components/NotificationsButton';
import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { usePrivacy } from '@/src/context/PrivacyContext';
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

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { privacySettings, isLoading: isLoadingPrivacy } = usePrivacy();
  const { isLoading: themeLoading, paperTheme } = useTheme();
  const { t } = useLocalization();

  if (isLoading || isLoadingPrivacy || themeLoading) return null;
  if (!user) return <Redirect href="/login" />;

  const { colors } = paperTheme;

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
        {privacySettings.showClasses && (
          <Tabs.Screen
            name="classes"
            options={{
              title: t('classes'),
              tabBarIcon: ({ size, color }) => (
                <Classes size={size} color={color} />
              ),
            }}
          />
        )}

        {privacySettings.showWorkouts && (
          <Tabs.Screen
            name="workouts"
            options={{
              title: t('workouts'),
              tabBarIcon: ({ size, color }) => (
                <ClipboardList size={size} color={color} />
              ),
            }}
          />
        )}

        {privacySettings.showEvaluation && (
          <Tabs.Screen
            name="schedule"
            options={{
              title: t('evaluation'),
              tabBarIcon: ({ size, color }) => (
                <Calendar size={size} color={color} />
              ),
            }}
          />
        )}

        {privacySettings.showProgress && (
          <Tabs.Screen
            name="progress"
            options={{
              title: t('progress'),
              tabBarIcon: ({ size, color }) => (
                <LineChart size={size} color={color} />
              ),
            }}
          />
        )}

        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />

        {privacySettings.publicProfile && (
          <Tabs.Screen
            name="community"
            options={{
              title: t('community'),
              tabBarIcon: ({ size, color }) => (
                <Users size={size} color={color} />
              ),
            }}
          />
        )}
      </Tabs>
      {privacySettings.showNotificationIcon && <NotificationsButton />}
    </View>
  );
}
