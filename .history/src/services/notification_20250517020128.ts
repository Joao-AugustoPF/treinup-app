import { appwriteDatabases } from '@/src/lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = 'treinup';
const COLLECTION_ID = 'notifications';

export type Notification = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionLabel?: string;
  actionRoute?: string;
  profileId: string;
  tenantId: string;
};

export class NotificationService {
  static async getNotifications(profileId: string): Promise<Notification[]> {
    try {
      const response = await appwriteDatabases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('profileId', profileId), Query.orderDesc('$createdAt')]
      );

      return response.documents.map((doc) => ({
        id: doc.$id,
        type: doc.type,
        title: doc.title,
        message: doc.message,
        read: doc.read,
        createdAt: new Date(doc.$createdAt),
        actionLabel: doc.actionLabel,
        actionRoute: doc.actionRoute,
        profileId: doc.profileId,
        tenantId: doc.tenantId,
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(profileId: string): Promise<number> {
    try {
      const response = await appwriteDatabases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('profileId', profileId), Query.equal('read', false)]
      );

      return response.total;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await appwriteDatabases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        notificationId,
        {
          read: true,
        }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(profileId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(profileId);
      const unreadNotifications = notifications.filter((n) => !n.read);

      await Promise.all(
        unreadNotifications.map((notification) =>
          this.markAsRead(notification.id)
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await appwriteDatabases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        notificationId
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  static async deleteAllNotifications(profileId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(profileId);
      await Promise.all(
        notifications.map((notification) =>
          this.deleteNotification(notification.id)
        )
      );
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  static async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> {
    try {
      const response = await appwriteDatabases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        notification
      );

      return {
        id: response.$id,
        type: response.type,
        title: response.title,
        message: response.message,
        read: response.read,
        createdAt: new Date(response.$createdAt),
        actionLabel: response.actionLabel,
        actionRoute: response.actionRoute,
        profileId: response.profileId,
        tenantId: response.tenantId,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}
