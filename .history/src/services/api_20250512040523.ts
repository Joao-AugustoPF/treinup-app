import { ClassType } from '@/types';
import { Models, Query } from 'appwrite';
import { db } from '../api/appwrite-client';

// Constants for database and collection
const DATABASE_ID = 'treinup';
const CLASSES_COLLECTION_ID = '682165c800115a54111f';
const PROFILES_COLLECTION_ID = 'profiles'; // ajuste para o ID real da sua collection de perfis

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
  trainerId: string;
  trainerName: string; // NOVO
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
  trainerId: string;
  duration: string;
  capacity: number;
  enrolled: number;
  location: string;
  image: string;
  start: string;
  end: string;
};

// Type for profile document
type ProfileDocument = Models.Document & {
  userId: string;
  name: string;
  role: string;
  avatarUrl?: string;
};

export class Api {
  static async getClasses(
    type?: ClassType
  ): Promise<ApiResponse<ClassesResponse>> {
    try {
      // 1) Monta query para tipo, se existir
      const queries = type ? [Query.equal('type', type)] : [];

      // 2) Busca classes
      const response = await db.listDocuments<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        queries
      );

      // 3) Extrai trainerIds únicos
      const trainerIds = Array.from(
        new Set(response.documents.map((doc) => doc.trainerId))
      );

      // 4) Busca perfil de cada trainer
      const trainerDocs = await Promise.all(
        trainerIds.map(
          (id) =>
            db
              .getDocument<ProfileDocument>(
                DATABASE_ID,
                PROFILES_COLLECTION_ID,
                id
              )
              .catch(() => null) // ignora erro se perfil não existir
        )
      );

      // 5) Cria mapa id → name
      const trainerMap = new Map<string, string>();
      trainerIds.forEach((id, idx) => {
        const doc = trainerDocs[idx];
        if (doc) trainerMap.set(id, doc.name);
      });

      // console.log(trainerIds);

      // 6) Mapeia resposta final incluindo trainerName
      const classes = response.documents.map((doc) => ({
        id: doc.$id,
        type: doc.type,
        name: doc.name,
        trainerId: doc.trainerId,
        trainerName: trainerMap.get(doc.trainerId) ?? '—',
        start: doc.start,
        end: doc.end,
        duration: doc.duration,
        capacity: doc.capacity,
        enrolled: doc.enrolled,
        location: doc.location,
        image: doc.image,
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
      const classDoc = await db.getDocument<ClassDocument>(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        classId
      );

      await db.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
        enrolled: classDoc.enrolled + 1,
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

      const newEnrolled = Math.max(0, classDoc.enrolled - 1);

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
