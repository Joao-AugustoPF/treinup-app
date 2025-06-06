import { ClassType } from '@/types';
import { Models, Query } from 'appwrite';
import { db } from '../api/appwrite-client';

// Constants for database and collection
const DATABASE_ID = 'treinup';
const CLASSES_COLLECTION_ID = '6822788f002fef678707';

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
  trainerId: {
    name: string;
    imageUrl: string;
    id: string;
    email: string;
  };
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
  tenantId: string;
  type: ClassType;
  start: string;
  end: string;
  capacity: number;
  location: string;
  trainerProfileId: string;
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

      // Transform the response to match our Class type
      const classes = await Promise.all(
        response.documents.map(async (doc) => {
          try {
            // Validate trainerProfileId
            if (
              !doc.trainerProfileId ||
              doc.trainerProfileId.length > 36 ||
              !/^[a-zA-Z0-9_][a-zA-Z0-9_]*$/.test(doc.trainerProfileId)
            ) {
              console.error('Invalid trainerProfileId:', doc.trainerProfileId);
              return null;
            }

            // Fetch trainer profile
            const trainerProfile = await db.getDocument(
              DATABASE_ID,
              '682161970028be4664f2', // Profiles collection ID
              doc.trainerProfileId
            );

            // Calculate duration
            const start = new Date(doc.start);
            const end = new Date(doc.end);
            const durationMs = end.getTime() - start.getTime();
            const durationMinutes = Math.floor(durationMs / (1000 * 60));
            const duration = `${durationMinutes} min`;

            return {
              id: doc.$id,
              type: doc.type,
              name: `${doc.type} Class`, // You might want to add a name field to the schema
              trainerId: {
                name: trainerProfile.name,
                imageUrl: trainerProfile.avatarUrl || '',
                id: trainerProfile.$id,
                email: trainerProfile.email,
              },
              start: doc.start,
              end: doc.end,
              duration,
              capacity: doc.capacity,
              enrolled: 0, // You might want to add this to the schema
              location: doc.location,
              image: '', // You might want to add this to the schema
            };
          } catch (error) {
            console.error('Error processing class document:', error);
            return null;
          }
        })
      );

      // Filter out any null values from failed processing
      const validClasses = classes.filter(
        (class_): class_ is Class => class_ !== null
      );

      return {
        data: {
          classes: validClasses,
          total: validClasses.length,
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
