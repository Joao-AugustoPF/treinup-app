import { client, DATABASE_ID } from '@/src/api/appwrite-client';
import {
  Notification as AppwriteNotification,
  COLLECTION_ID,
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
    console.log('refreshNotifications called');
    if (!user?.$id) {
      console.log('No user ID available, skipping refresh');
      return;
    }

    try {
      const profile = await ProfileService.getUserProfile(user);
      console.log('User profile loaded:', profile?.tenantId);
      if (!profile?.tenantId) {
        console.log('No tenant ID available, skipping refresh');
        return;
      }

      const [fetchedNotifications, count] = await Promise.all([
        NotificationService.getNotifications(profile.tenantId),
        NotificationService.getUnreadCount(profile.tenantId, user.$id),
      ]);

      console.log('Fetched notifications:', fetchedNotifications.length);
      console.log('Unread count:', count);

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
      console.log('Setting up realtime subscription for notifications...');
      console.log('Subscription channel:', `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`);
      
      try {
        const unsubscribe = client.subscribe(
          `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
          (response: RealtimeResponseEvent<AppwriteNotification>) => {
            console.log('Realtime event received:', response.events);
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
              console.log('Change detected in notifications, refreshing...');
              refreshNotifications();
            }
          }
        );

        console.log('Realtime subscription successful');

        // Cleanup subscription on unmount
        return () => {
          console.log('Cleaning up realtime subscription...');
          unsubscribe();
        };
      } catch (error) {
        console.error('Failed to setup realtime subscription:', error);
      }
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
