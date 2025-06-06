import { DATABASE_ID, db } from '@/src/api/appwrite-client';
import { ID, Query } from 'appwrite';

const COLLECTION_ID = '68281a17001502a83bd4';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  tenantId: string;
  readBy: string[];
  createdAt: Date;
};

export class NotificationService {
  static async getNotifications(tenantId: string): Promise<Notification[]> {
    try {
      const response = await db.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('tenantId', tenantId),
        Query.orderDesc('$createdAt'),
      ]);
      console.log(tenantId)
      console.log(response);

      return response.documents.map((doc) => ({
        id: doc.$id,
        type: doc.type,
        title: doc.title,
        message: doc.message,
        tenantId: doc.tenantId,
        readBy: doc.readBy || [],
        createdAt: new Date(doc.$createdAt),
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(
    tenantId: string,
    userId: string
  ): Promise<number> {
    try {
      const response = await db.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('tenantId', tenantId),
        Query.notEqual('readBy', userId),
      ]);

      return response.total;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const notification = await db.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        notificationId
      );

      const readBy = notification.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }

      await db.updateDocument(DATABASE_ID, COLLECTION_ID, notificationId, {
        readBy,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(tenantId);
      const unreadNotifications = notifications.filter(
        (n) => !n.readBy.includes(userId)
      );

      await Promise.all(
        unreadNotifications.map((notification) =>
          this.markAsRead(notification.id, userId)
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await db.deleteDocument(DATABASE_ID, COLLECTION_ID, notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  static async deleteAllNotifications(tenantId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(tenantId);
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
    notification: Omit<Notification, 'id' | 'createdAt' | 'readBy'>
  ): Promise<Notification> {
    try {
      const response = await db.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...notification,
          readBy: [],
        }
      );

      return {
        id: response.$id,
        type: response.type,
        title: response.title,
        message: response.message,
        tenantId: response.tenantId,
        readBy: response.readBy || [],
        createdAt: new Date(response.$createdAt),
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}
