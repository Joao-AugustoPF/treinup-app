import { Notification, NotificationService } from '@/src/services/notification';
import { useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
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

  const refreshNotifications = async () => {
    if (!user?.tenantId || !user?.id) return;

    try {
      const [fetchedNotifications, count] = await Promise.all([
        NotificationService.getNotifications(user.tenantId),
        NotificationService.getUnreadCount(user.tenantId, user.id),
      ]);

      setNotifications(fetchedNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  useEffect(() => {
    if (user?.tenantId && user?.id) {
      refreshNotifications();
    }
  }, [user?.tenantId, user?.id]);

  const markAsRead = async (id: string) => {
    if (!user?.id) return;

    try {
      await NotificationService.markAsRead(id, user.id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.tenantId || !user?.id) return;

    try {
      await NotificationService.markAllAsRead(user.tenantId, user.id);
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
    if (!user?.tenantId) return;

    try {
      await NotificationService.deleteAllNotifications(user.tenantId);
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
