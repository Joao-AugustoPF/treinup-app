import { ClassType } from '@/types';
import { Models, Query } from 'appwrite';
import { db } from '../api/appwrite-client';

// Constants for database and collection
const DATABASE_ID = 'treinup';
const CLASSES_COLLECTION_ID = '6822788f002fef678707';
const PROFILES_COLLECTION_ID = '682161970028be4664f2'; // Profiles collection ID

// Types for the API responses
type ApiResponse<T> = {
  data: T;
  error?: string;
};

type ClassesResponse = {
  classes: Class[];
  total: number;
};

type Class = {
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
  trainerProfileId: string | Record<string, any>;
  enrolled?: number;
};

export class Api {
  static async getClasses(
    type?: ClassType
  ): Promise<ApiResponse<ClassesResponse>> {
    try {
      const queries: Query[] = [];
      if (type) queries.push(Query.equal('type', type));

      const response = await db.listDocuments<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        queries
      );

      const classes: Class[] = await Promise.all(
        response.documents.map(async (doc) => {
          // Determine trainer profile: if object, use it; if string, fetch it
          let trainerProfile: any;
          if (
            typeof doc.trainerProfileId === 'object' &&
            doc.trainerProfileId !== null
          ) {
            trainerProfile = doc.trainerProfileId;
          } else if (typeof doc.trainerProfileId === 'string') {
            try {
              trainerProfile = await db.getDocument(
                DATABASE_ID,
                PROFILES_COLLECTION_ID,
                doc.trainerProfileId
              );
            } catch (err) {
              console.warn(
                `Failed to fetch trainer profile ${doc.trainerProfileId}:`,
                err
              );
              trainerProfile = {
                name: '—',
                avatarUrl: '',
                $id: '',
                email: '',
              };
            }
          } else {
            trainerProfile = {
              name: '—',
              avatarUrl: '',
              $id: '',
              email: '',
            };
          }

          // Calculate duration
          const startDate = new Date(doc.start);
          const endDate = new Date(doc.end);
          const durationMinutes = Math.floor(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60)
          );

          return {
            id: doc.$id,
            type: doc.type,
            name: doc.name, // Or derive from schema
            trainerId: {
              id: trainerProfile.$id || '',
              name: trainerProfile.name || '—',
              imageUrl: trainerProfile.avatarUrl || '',
              email: trainerProfile.email || '',
            },
            start: doc.start,
            end: doc.end,
            duration: `${durationMinutes} min`,
            capacity: doc.capacity,
            enrolled: typeof doc.enrolled === 'number' ? doc.enrolled : 0,
            location: doc.location,
            imageUrl: '', // Populate if available
          };
        })
      );

      return { data: { classes, total: response.total } };
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
      const classDoc = await db.getDocument<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        classId
      );
      const current =
        typeof classDoc.enrolled === 'number' ? classDoc.enrolled : 0;
      await db.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
        enrolled: current + 1,
      });
      return { data: { success: true } };
    } catch (error) {
      console.error('Error checking in:', error);
      return { data: { success: false }, error: 'Failed to check in' };
    }
  }

  static async cancelCheckIn(
    classId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const classDoc = await db.getDocument<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        classId
      );
      const current =
        typeof classDoc.enrolled === 'number' ? classDoc.enrolled : 0;
      const newEnrolled = Math.max(0, current - 1);
      await db.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
        enrolled: newEnrolled,
      });
      return { data: { success: true } };
    } catch (error) {
      console.error('Error canceling check-in:', error);
      return { data: { success: false }, error: 'Failed to cancel check-in' };
    }
  }
}
