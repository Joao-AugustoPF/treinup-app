import { Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  EXERCISES_COLLECTION_ID,
  WORKOUT_SETS_COLLECTION_ID,
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
  exercise?: Exercise | null;
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
    tenantId: string
  ): Promise<Workout[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!tenantId) {
      console.warn('TenantId não fornecido, usando valor padrão');
      tenantId = '1'; // Valor padrão para evitar erros
    }

    try {
      console.log('Fetching workouts for tenantId:', tenantId);

      // First get the workouts
      const workoutsResponse = await db.listDocuments(
        DATABASE_ID,
        WORKOUTS_COLLECTION_ID,
        [Query.equal('tenantId', tenantId)]
      );

      console.log('Workouts found:', workoutsResponse.documents.length);

      // Then get the workout sets for each workout
      const workouts = await Promise.all(
        workoutsResponse.documents.map(async (workout) => {
          try {
            console.log(`Processing workout: ${workout.$id}`);

            const setsResponse = await db.listDocuments(
              DATABASE_ID,
              WORKOUT_SETS_COLLECTION_ID,
              [Query.equal('workoutId', workout.$id)]
            );

            console.log(
              `Sets found for workout ${workout.$id}:`,
              setsResponse.documents.length
            );

            // Get exercise details for each set
            const sets = await Promise.all(
              setsResponse.documents.map(async (set) => {
                let exerciseInfo = null;
                if (set.exerciseId) {
                  try {
                    const exerciseDoc = await db.getDocument(
                      DATABASE_ID,
                      EXERCISES_COLLECTION_ID,
                      set.exerciseId
                    );
                    exerciseInfo = {
                      id: exerciseDoc.$id,
                      name: exerciseDoc.name,
                      muscleGroup: exerciseDoc.muscleGroup,
                      tutorialUrl: exerciseDoc.tutorialUrl,
                      equipmentId: exerciseDoc.equipmentId,
                    };
                  } catch (error) {
                    console.error(
                      `Error fetching exercise ${set.exerciseId}:`,
                      error
                    );
                  }
                }

                return {
                  id: set.$id,
                  exerciseId: set.exerciseId,
                  order: set.order,
                  series: set.series,
                  reps: set.reps,
                  loadKg: set.loadKg,
                  exercise: exerciseInfo,
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
          } catch (error) {
            console.error('Error processing workout:', workout.$id, error);
            // Return a minimal workout object when there's an error
            return {
              id: workout.$id,
              title: workout.title || 'Treino sem título',
              plan: workout.plan || '',
              tenantId: workout.tenantId,
              memberProfileId: workout.memberProfileId,
              sets: [],
            };
          }
        })
      );

      return workouts;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      throw new Error('Failed to fetch workouts');
    }
  }
}
