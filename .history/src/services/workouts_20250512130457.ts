import { Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  WORKOUTS_COLLECTION_ID,
} from '../api/appwrite-client';

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: string;
  image: string;
  video: string;
  instructions: string[];
  tips: string[];
};

export type WorkoutDay = {
  id: string;
  gymId: string;
  name: string;
  focus: string;
  exercises: Exercise[];
  image: string;
};

export class WorkoutService {
  static async getUserWorkouts(
    user: any | null,
    gymId: string
  ): Promise<WorkoutDay[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await db.listDocuments(
        DATABASE_ID,
        WORKOUTS_COLLECTION_ID,
        [Query.equal('gymId', gymId)]
      );

      return response.documents.map((doc) => ({
        id: doc.$id,
        gymId: doc.gymId,
        name: doc.name,
        focus: doc.focus,
        exercises: doc.exercises,
        image: doc.image,
      }));
    } catch (error) {
      console.error('Error fetching workouts:', error);
      throw new Error('Failed to fetch workouts');
    }
  }
}
