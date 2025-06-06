import { ClassType } from '@/types';
import { Models, Query } from 'appwrite';
import { db } from '../api/appwrite-client';

// Constants for database and collection
const DATABASE_ID = 'treinup';
const CLASSES_COLLECTION_ID = '682165c800115a54111f';

// Types for the API responses
export type ApiResponse<T> = {
  data: T;
  error?: string;
};

export type ClassesResponse = {
  classes: Class[];
  total: number;
};

export type Class = {
  id: string;
  gymId: string;
  type: ClassType;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  capacity: number;
  enrolled: number;
  location: string;
  image: string;
  isCheckedIn?: boolean;
};

// Type for the class document from Appwrite
type ClassDocument = Models.Document & {
  gymId: string;
  type: ClassType;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  capacity: number;
  enrolled: number;
  location: string;
  image: string;
  isCheckedIn?: boolean;
};

// API class
export class Api {
  static async getClasses(
    gymId: string,
    type?: ClassType
  ): Promise<ApiResponse<ClassesResponse>> {
    try {
      if (!gymId) {
        throw new Error('No gym selected');
      }

      // Create query to filter by gym
      const queries = [Query.equal('gymId', gymId)];

      // Add type filter if provided
      if (type) {
        queries.push(Query.equal('type', type));
      }

      // Fetch classes from Appwrite
      const response = await db.listDocuments<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        queries
      );

      // Transform the response to match our Class type
      const classes = response.documents.map((doc) => ({
        id: doc.$id,
        gymId: doc.gymId,
        type: doc.type,
        name: doc.name,
        instructor: doc.instructor,
        time: doc.time,
        duration: doc.duration,
        capacity: doc.capacity,
        enrolled: doc.enrolled,
        location: doc.location,
        image: doc.image,
        isCheckedIn: doc.isCheckedIn,
      }));

      return {
        data: {
          classes,
          total: response.total,
        },
      };
    } catch (error) {
      console.error('Error fetching classes:', error);
      return {
        data: { classes: [], total: 0 },
        error: 'Failed to fetch classes',
      };
    }
  }

  static async checkIn(
    classId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // First, get the current user ID (assuming you have authentication set up)
      // const currentUser = await account.get();
      // const userId = currentUser.$id;

      // For now, just update the class document to mark as checked in
      await db.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
        isCheckedIn: true,
      });

      return {
        data: { success: true },
      };
    } catch (error) {
      console.error('Error checking in:', error);
      return {
        data: { success: false },
        error: 'Failed to check in',
      };
    }
  }

  static async cancelCheckIn(
    classId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // Update the class document to remove checked in status
      await db.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
        isCheckedIn: false,
      });

      return {
        data: { success: true },
      };
    } catch (error) {
      console.error('Error canceling check-in:', error);
      return {
        data: { success: false },
        error: 'Failed to cancel check-in',
      };
    }
  }
}
