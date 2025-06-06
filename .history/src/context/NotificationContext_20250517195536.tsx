import { client } from '@/src/api/appwrite-client';
import {
  Notification as AppwriteNotification,
  NotificationService,
} from '@/src/services/notification';
import { ProfileService } from '@/src/services/profile';
import { RealtimeResponseEvent } from 'appwrite';
import { useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
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
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

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
    if (!user?.$id) return;

    try {
      const profile = await ProfileService.getUserProfile(user);
      if (!profile?.tenantId) return;

      const [fetchedNotifications, count] = await Promise.all([
        NotificationService.getNotifications(profile.tenantId),
        NotificationService.getUnreadCount(profile.tenantId, user.$id),
      ]);

      setNotifications(fetchedNotifications.map(mapAppwriteNotification));
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  useEffect(() => {
    if (user?.$id) {
      refreshNotifications();

      // Subscribe to realtime notifications
      const unsubscribe = client.subscribe(
        `databases.treinup.collections.treinup.documents`,
        (response: RealtimeResponseEvent<AppwriteNotification>) => {
          if (
            response.events.includes(
              'databases.*.collections.*.documents.*.create'
            )
          ) {
            // New notification created
            refreshNotifications();
          } else if (
            response.events.includes(
              'databases.*.collections.*.documents.*.update'
            )
          ) {
            // Notification updated (e.g., marked as read)
            refreshNotifications();
          } else if (
            response.events.includes(
              'databases.*.collections.*.documents.*.delete'
            )
          ) {
            // Notification deleted
            refreshNotifications();
          }
        }
      );

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [user?.$id]);

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
      const profile = await ProfileService.getUserProfile(user);
      if (!profile?.tenantId) return;

      await NotificationService.markAllAsRead(profile.tenantId, user.$id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      await NotificationService.deleteNotification(id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.$id) return;

    try {
      const profile = await ProfileService.getUserProfile(user);
      if (!profile?.tenantId) return;

      await NotificationService.deleteAllNotifications(profile.tenantId);
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
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }
  return context;
};
