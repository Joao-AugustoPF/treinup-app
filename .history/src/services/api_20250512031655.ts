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
  type: ClassType;
  name: string;
  instructor: string;
  start: string;
  end: string;
  duration: string;
  capacity: number;
  enrolled: number;
  location: string;
  image: string;
};

// Type for the class document from Appwrite
type ClassDocument = Models.Document & {
  type: ClassType;
  name: string;
  instructor: string;
  duration: string;
  capacity: number;
  enrolled: number;
  location: string;
  image: string;
  start: string;
  end: string;
};

// API class
export class Api {
  static async getClasses(
    type?: ClassType
  ): Promise<ApiResponse<ClassesResponse>> {
    try {
      // Create query to filter by type if provided
      const queries = [];

      if (type) {
        queries.push(Query.equal('type', type));
      }

      // Fetch classes from Appwrite
      const response = await db.listDocuments<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        queries
      );

      console.log(response.documents);

      // Transform the response to match our Class type
      const classes = response.documents.map((doc) => ({
        id: doc.$id,
        type: doc.type,
        name: doc.name,
        instructor: doc.instructor,
        start: doc.start,
        end: doc.end,
        duration: doc.duration,
        capacity: doc.capacity,
        enrolled: doc.enrolled,
        location: doc.location,
        image: doc.image,
      }));

      console.log(classes);

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
      // First, get the current class to get the enrolled count
      const classDoc = await db.getDocument<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        classId
      );

      // Increment the enrolled count
      await db.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
        enrolled: classDoc.enrolled + 1,
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
      // First, get the current class to get the enrolled count
      const classDoc = await db.getDocument<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        classId
      );

      // Ensure we don't go below zero
      const newEnrolled = Math.max(0, classDoc.enrolled - 1);

      // Decrement the enrolled count
      await db.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
        enrolled: newEnrolled,
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
