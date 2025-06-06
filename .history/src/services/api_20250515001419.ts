import { ClassType } from '@/types';
import { ID, Models, Query } from 'appwrite';
import { db } from '../api/appwrite-client';

// Constants for database and collection
const DATABASE_ID = 'treinup';
const CLASSES_COLLECTION_ID = '6822788f002fef678707';
const PROFILES_COLLECTION_ID = '682161970028be4664f2'; // Profiles collection ID
const CLASS_BOOKINGS_COLLECTION_ID = '68216658000f84c0f9b8';

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
  imageUrl: string;
  isCheckedIn: boolean;
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
      const queries = [];
      if (type) queries.push(Query.equal('type', type));

      const response = await db.listDocuments(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        queries
      );

      // Get current user ID - replace with actual user ID from auth context
      const userID = 'current'; // This should come from auth context
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', userID)]
      );

      let currentProfileId = null;
      if (profilesResponse.documents.length > 0) {
        currentProfileId = profilesResponse.documents[0].$id;
      }

      const classes = await Promise.all(
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

          // Check if user is checked in for this class
          let isCheckedIn = false;
          if (currentProfileId) {
            try {
              const bookings = await db.listDocuments(
                DATABASE_ID,
                CLASS_BOOKINGS_COLLECTION_ID,
                [
                  Query.equal('classId', doc.$id),
                  Query.equal('memberProfileId', currentProfileId),
                  Query.equal('status', 'booked'),
                ]
              );
              isCheckedIn = bookings.total > 0;
            } catch (error) {
              console.warn('Error checking booking status:', error);
            }
          }

          return {
            id: doc.$id,
            type: doc.type,
            name: doc.name,
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
            imageUrl: doc.imageUrl,
            isCheckedIn,
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
      // Get the current user profile - replace with actual user ID from auth context
      const userID = 'current'; // This should come from auth context
      const currentUser = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', userID)]
      );

      if (currentUser.documents.length === 0) {
        return {
          data: { success: false },
          error: 'Usuário não encontrado',
        };
      }

      const profileId = currentUser.documents[0].$id;
      const tenantId = '1'; // Should come from gym context

      // Check if user already has a booking for this class
      const existingBookings = await db.listDocuments(
        DATABASE_ID,
        CLASS_BOOKINGS_COLLECTION_ID,
        [
          Query.equal('classId', classId),
          Query.equal('memberProfileId', profileId),
        ]
      );

      if (existingBookings.total > 0) {
        // Update existing booking if it was cancelled
        const booking = existingBookings.documents[0];
        if (booking.status === 'cancelled') {
          await db.updateDocument(
            DATABASE_ID,
            CLASS_BOOKINGS_COLLECTION_ID,
            booking.$id,
            {
              status: 'booked',
              checkInAt: new Date().toISOString(),
            }
          );
          return { data: { success: true } };
        } else {
          return {
            data: { success: false },
            error: 'Você já está inscrito nesta aula',
          };
        }
      }

      // Create new booking
      await db.createDocument(
        DATABASE_ID,
        CLASS_BOOKINGS_COLLECTION_ID,
        ID.unique(),
        {
          classId: classId,
          memberProfileId: profileId,
          status: 'booked',
          checkInAt: new Date().toISOString(),
          tenantId: tenantId,
        }
      );

      return { data: { success: true } };
    } catch (error) {
      console.error('Error checking in:', error);
      return { data: { success: false }, error: 'Falha ao fazer check-in' };
    }
  }

  static async cancelCheckIn(
    classId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // Get the current user profile - replace with actual user ID
      const userID = 'current'; // This should come from auth context
      const currentUser = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', userID)]
      );

      if (currentUser.documents.length === 0) {
        return {
          data: { success: false },
          error: 'Usuário não encontrado',
        };
      }

      const profileId = currentUser.documents[0].$id;

      // Find the booking for this class and user
      const bookings = await db.listDocuments(
        DATABASE_ID,
        CLASS_BOOKINGS_COLLECTION_ID,
        [
          Query.equal('classId', classId),
          Query.equal('memberProfileId', profileId),
          Query.equal('status', 'booked'),
        ]
      );

      if (bookings.total === 0) {
        return {
          data: { success: false },
          error: 'Nenhum check-in encontrado para cancelar',
        };
      }

      // Update the booking status to cancelled
      await db.updateDocument(
        DATABASE_ID,
        CLASS_BOOKINGS_COLLECTION_ID,
        bookings.documents[0].$id,
        {
          status: 'cancelled',
        }
      );

      return { data: { success: true } };
    } catch (error) {
      console.error('Error canceling check-in:', error);
      return { data: { success: false }, error: 'Falha ao cancelar check-in' };
    }
  }
}
