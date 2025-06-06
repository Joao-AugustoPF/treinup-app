import { DATABASE_ID, db } from '@/src/api/appwrite-client';
import { ID, Query } from 'appwrite';

export const COLLECTION_ID = '68281a17001502a83bd4';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  tenantId: string;
  readBy: string[];
  deletedBy: string[];
  createdAt: Date;
};

export class NotificationService {
  static async getNotifications(
    tenantId: string,
    userId: string
  ): Promise<Notification[]> {
    try {
      const response = await db.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('tenantId', tenantId),
        Query.orderDesc('$createdAt'),
      ]);

      // Filter out notifications that were deleted by this user
      return response.documents
        .filter((doc) => !doc.deletedBy?.includes(userId))
        .map((doc) => ({
          id: doc.$id,
          type: doc.type,
          title: doc.title,
          message: doc.message,
          tenantId: doc.tenantId,
          readBy: doc.readBy || [],
          deletedBy: doc.deletedBy || [],
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
      ]);

      // Filter notifications where userId is not in readBy array and not in deletedBy array
      const unreadCount = response.documents.filter(
        (doc) =>
          !doc.readBy?.includes(userId) && !doc.deletedBy?.includes(userId)
      ).length;

      return unreadCount;
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
      const notifications = await this.getNotifications(tenantId, userId);
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

  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const notification = await db.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        notificationId
      );

      const deletedBy = notification.deletedBy || [];
      if (!deletedBy.includes(userId)) {
        deletedBy.push(userId);
      }

      await db.updateDocument(DATABASE_ID, COLLECTION_ID, notificationId, {
        deletedBy,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  static async deleteAllNotifications(
    tenantId: string,
    userId: string
  ): Promise<void> {
    try {
      const notifications = await this.getNotifications(tenantId, userId);
      await Promise.all(
        notifications.map((notification) =>
          this.deleteNotification(notification.id, userId)
        )
      );
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  static async createNotification(
    notification: Omit<
      Notification,
      'id' | 'createdAt' | 'readBy' | 'deletedBy'
    >
  ): Promise<Notification> {
    try {
      const response = await db.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...notification,
          readBy: [],
          deletedBy: [],
        }
      );

      return {
        id: response.$id,
        type: response.type,
        title: response.title,
        message: response.message,
        tenantId: response.tenantId,
        readBy: response.readBy || [],
        deletedBy: response.deletedBy || [],
        createdAt: new Date(response.$createdAt),
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}
