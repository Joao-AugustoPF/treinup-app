import { DATABASE_ID } from '@/src/api/appwrite-client';
import {
  Notification as AppwriteNotification,
  COLLECTION_ID,
  NotificationService,
} from '@/src/services/notification';
import { ProfileService } from '@/src/services/profile';
import {
  pushNotificationService,
  PushNotificationToken,
} from '@/src/services/pushNotification';
import { PushTokenService } from '@/src/services/pushToken';
import { RealtimeResponseEvent } from 'appwrite';
import type { EventSubscription } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { Client } from 'react-native-appwrite';
import { useAuth } from './AuthContext';

export type NotificationCategory = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  action?: {
    label: string;
    onPress: () => void;
  };
};

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  pushToken: PushNotificationToken | null;
  isPushRegistered: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
  scheduleLocalNotification: (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => Promise<string>;
  scheduleWorkoutReminder: (
    title: string,
    body: string,
    scheduledTime: Date,
    data?: Record<string, any>
  ) => Promise<string>;
  scheduleDailyReminder: (
    title: string,
    body: string,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ) => Promise<string>;
  scheduleWeeklyReminder: (
    title: string,
    body: string,
    weekday: number,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  getBadgeCount: () => Promise<number>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
};

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushToken, setPushToken] = useState<PushNotificationToken | null>(
    null
  );
  const [isPushRegistered, setIsPushRegistered] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const mapAppwriteNotification = (
    notification: AppwriteNotification
  ): Notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.readBy?.includes(user?.$id || '') || false,
    createdAt: notification.createdAt,
  });

  const refreshNotifications = async () => {
    if (!user?.$id) {
      console.log('No user ID available, skipping refresh');
      return;
    }

    try {
      const profile = await ProfileService.getUserProfile(user);
      if (!profile?.tenantId) {
        console.log('No tenant ID available, skipping refresh');
        return;
      }

      const [fetchedNotifications, count] = await Promise.all([
        NotificationService.getNotifications(profile.tenantId, user.$id),
        NotificationService.getUnreadCount(profile.tenantId, user.$id),
      ]);

      setNotifications(fetchedNotifications.map(mapAppwriteNotification));
      setUnreadCount(count);

      // Update badge count
      await pushNotificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const registerForPushNotifications = async () => {
    console.log('🚀 Starting push notification registration...');
    try {
      const token =
        await pushNotificationService.registerForPushNotifications();
      if (token) {
        setPushToken(token);
        setIsPushRegistered(true);
        console.log('Push notifications registered successfully');
        console.log('🔔 Expo Token:', token.expoToken);
        console.log('📱 Device Token:', token.deviceToken);
        console.log('✅ Push Token Object:', token);

        // Registrar o token no Appwrite se o usuário estiver logado
        if (user?.$id && token.expoToken) {
          console.log('📝 Registrando push target no Appwrite...');
          const result = await PushTokenService.registerPushToken(token);
          if (result.success) {
            console.log(
              '✅ Push target registrado no Appwrite:',
              result.action
            );
          } else {
            console.warn('⚠️ Falha ao registrar push target no Appwrite');
          }
        }
      } else {
        console.log('❌ No push token received');
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> => {
    return await pushNotificationService.scheduleLocalNotification(
      title,
      body,
      data
    );
  };

  const scheduleWorkoutReminder = async (
    title: string,
    body: string,
    scheduledTime: Date,
    data?: Record<string, any>
  ): Promise<string> => {
    return await pushNotificationService.scheduleWorkoutReminder(
      title,
      body,
      scheduledTime,
      data
    );
  };

  const scheduleDailyReminder = async (
    title: string,
    body: string,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ): Promise<string> => {
    return await pushNotificationService.scheduleDailyReminder(
      title,
      body,
      hour,
      minute,
      data
    );
  };

  const scheduleWeeklyReminder = async (
    title: string,
    body: string,
    weekday: number,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ): Promise<string> => {
    return await pushNotificationService.scheduleWeeklyReminder(
      title,
      body,
      weekday,
      hour,
      minute,
      data
    );
  };

  const cancelNotification = async (notificationId: string): Promise<void> => {
    await pushNotificationService.cancelNotification(notificationId);
  };

  const cancelAllNotifications = async (): Promise<void> => {
    await pushNotificationService.cancelAllNotifications();
  };

  const getBadgeCount = async (): Promise<number> => {
    return await pushNotificationService.getBadgeCount();
  };

  const setBadgeCount = async (count: number): Promise<void> => {
    await pushNotificationService.setBadgeCount(count);
  };

  const clearBadge = async (): Promise<void> => {
    await pushNotificationService.clearBadge();
  };

  useEffect(() => {
    if (user?.$id) {
      refreshNotifications();
      registerForPushNotifications();

      let notificationListener: EventSubscription | null = null;
      let responseListener: EventSubscription | null = null;

      // Setup notification listeners
      pushNotificationService
        .addNotificationReceivedListener((notification) => {
          console.log('Notification received:', notification);
          // Refresh notifications when a new one is received
          refreshNotifications();
        })
        .then((listener) => {
          notificationListener = listener;
        });

      pushNotificationService
        .addNotificationResponseReceivedListener((response) => {
          console.log('Notification response received:', response);
          // Handle notification tap
          const data = response.notification.request.content.data;
          if (data?.screen) {
            router.push(data.screen as any);
          }
        })
        .then((listener) => {
          responseListener = listener;
        });

      // Check for initial notification response
      pushNotificationService.getLastNotificationResponse().then((response) => {
        if (response) {
          console.log('Initial notification response:', response);
          const data = response.notification.request.content.data;
          if (data?.screen) {
            router.push(data.screen as any);
          }
        }
      });

      try {
        const unsubscribe = client.subscribe(
          `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
          (response: RealtimeResponseEvent<AppwriteNotification>) => {
            if (
              response.events.includes(
                'databases.*.collections.*.documents.*.create'
              ) ||
              response.events.includes(
                'databases.*.collections.*.documents.*.update'
              ) ||
              response.events.includes(
                'databases.*.collections.*.documents.*.delete'
              )
            ) {
              refreshNotifications();
            }
          }
        );

        // Cleanup subscription on unmount
        return () => {
          unsubscribe();
          if (notificationListener) {
            notificationListener.remove();
          }
          if (responseListener) {
            responseListener.remove();
          }
        };
      } catch (error) {
        console.error('Failed to setup realtime subscription:', error);
      }
    }
  }, [user?.$id]);

  // Monitor pushToken changes
  useEffect(() => {
    if (pushToken) {
      console.log('🔄 Push Token Updated:');
      console.log('🔔 Expo Token:', pushToken.expoToken);
      console.log('📱 Device Token:', pushToken.deviceToken);
      console.log('✅ Full Token Object:', pushToken);
    }
  }, [pushToken]);

  const markAsRead = async (id: string) => {
    if (!user?.$id) return;

    try {
      await NotificationService.markAsRead(id, user.$id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.$id) return;

    try {
      await NotificationService.markAllAsRead(user.$id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotification = async (id: string) => {
    if (!user?.$id) return;

    try {
      await NotificationService.deleteNotification(id, user.$id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.$id) return;

    try {
      await NotificationService.deleteAllNotifications(user.$id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        pushToken,
        isPushRegistered,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        refreshNotifications,
        registerForPushNotifications,
        scheduleLocalNotification,
        scheduleWorkoutReminder,
        scheduleDailyReminder,
        scheduleWeeklyReminder,
        cancelNotification,
        cancelAllNotifications,
        getBadgeCount,
        setBadgeCount,
        clearBadge,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider.'
    );
  }
  return context;
};
