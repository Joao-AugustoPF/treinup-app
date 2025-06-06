import { Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  WORKOUTS_COLLECTION_ID,
} from '../api/appwrite-client';

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  tutorialUrl?: string;
  equipmentId?: string;
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  order: number;
  series: number;
  reps: number;
  loadKg?: number;
};

export type Workout = {
  id: string;
  title: string;
  plan: string;
  tenantId: string;
  memberProfileId?: string;
  sets?: WorkoutSet[];
};

export class WorkoutService {
  static async getUserWorkouts(
    user: any | null,
    gymId: string
  ): Promise<Workout[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // First get the workouts
      const workoutsResponse = await db.listDocuments(
        DATABASE_ID,
        WORKOUTS_COLLECTION_ID,
        [Query.equal('tenantId', gymId)]
      );

      // Then get the workout sets for each workout
      const workouts = await Promise.all(
        workoutsResponse.documents.map(async (workout) => {
          const setsResponse = await db.listDocuments(
            DATABASE_ID,
            '682276d1003cc08a7b8e', // WorkoutSets collection ID
            [Query.equal('workoutId', workout.$id)]
          );

          // Get exercise details for each set
          const sets = await Promise.all(
            setsResponse.documents.map(async (set) => {
              let exercise: Exercise | null = null;
              if (set.exerciseId) {
                try {
                  const exerciseDoc = await db.getDocument(
                    DATABASE_ID,
                    '68215f730001584f3d04', // Exercises collection ID
                    set.exerciseId
                  );
                  exercise = {
                    id: exerciseDoc.$id,
                    name: exerciseDoc.name,
                    muscleGroup: exerciseDoc.muscleGroup,
                    tutorialUrl: exerciseDoc.tutorialUrl,
                    equipmentId: exerciseDoc.equipmentId,
                  };
                } catch (error) {
                  console.error('Error fetching exercise:', error);
                }
              }

              return {
                id: set.$id,
                exerciseId: set.exerciseId,
                order: set.order,
                series: set.series,
                reps: set.reps,
                loadKg: set.loadKg,
                exercise,
              };
            })
          );

          return {
            id: workout.$id,
            title: workout.title,
            plan: workout.plan,
            tenantId: workout.tenantId,
            memberProfileId: workout.memberProfileId,
            sets: sets.sort((a, b) => a.order - b.order),
          };
        })
      );

      return workouts;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      throw new Error('Failed to fetch workouts');
    }
  }
}
