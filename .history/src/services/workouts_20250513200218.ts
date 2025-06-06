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
  imageUrl?: string;
  rest?: number;
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
  imageUrl?: string;
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
      tenantId = '1';
    }

    try {
      console.log('Fetching workouts for tenantId:', tenantId);

      const workoutsResponse = await db.listDocuments(
        DATABASE_ID,
        WORKOUTS_COLLECTION_ID,
        [Query.equal('tenantId', tenantId)]
      );

      console.log('Workouts found:', workoutsResponse);

      const workouts: Workout[] = await Promise.all(
        workoutsResponse.documents.map(async (workoutDoc) => {
          try {
            console.log(`Processing workout: ${workoutDoc.$id}`);

            const setsResponse = await db.listDocuments(
              DATABASE_ID,
              WORKOUT_SETS_COLLECTION_ID,
              [Query.equal('workoutId', workoutDoc.$id)]
            );

            console.log(
              `Sets found for workout ${workoutDoc.$id}:`,
              setsResponse.documents.length
            );

            const sets: WorkoutSet[] = await Promise.all(
              setsResponse.documents.map(async (set) => {
                let exerciseInfo: Exercise | null = null;
                const rawExercise = set.exerciseId as any;

                if (rawExercise && typeof rawExercise === 'object') {
                  // Already embedded exercise object
                  exerciseInfo = {
                    id: rawExercise.$id,
                    name: rawExercise.name,
                    muscleGroup: rawExercise.muscleGroup,
                    tutorialUrl: rawExercise.tutorialUrl,
                    equipmentId: rawExercise.equipmentId,
                  };
                } else if (typeof rawExercise === 'string') {
                  // Fetch exercise by ID
                  try {
                    const exerciseDoc: any = await db.getDocument(
                      DATABASE_ID,
                      EXERCISES_COLLECTION_ID,
                      rawExercise
                    );
                    exerciseInfo = {
                      id: exerciseDoc.$id,
                      name: exerciseDoc.name,
                      muscleGroup: exerciseDoc.muscleGroup,
                      tutorialUrl: exerciseDoc.tutorialUrl,
                      equipmentId: exerciseDoc.equipmentId,
                    };
                  } catch (err) {
                    console.error(
                      `Error fetching exercise ${rawExercise}:`,
                      err
                    );
                  }
                }

                return {
                  id: set.$id,
                  exerciseId:
                    typeof rawExercise === 'string'
                      ? rawExercise
                      : rawExercise?.$id ?? '',
                  order: set.order,
                  series: set.series,
                  reps: set.reps,
                  loadKg: set.loadKg,
                  exercise: exerciseInfo,
                };
              })
            );

            return {
              id: workoutDoc.$id,
              title: workoutDoc.title,
              plan: workoutDoc.plan,
              tenantId: workoutDoc.tenantId,
              memberProfileId: workoutDoc.memberProfileId,
              imageUrl: workoutDoc.imageUrl,
              sets: sets.sort((a, b) => a.order - b.order),
            };
          } catch (error) {
            console.error('Error processing workout:', workoutDoc.$id, error);
            return {
              id: workoutDoc.$id,
              title: workoutDoc.title || 'Treino sem título',
              plan: workoutDoc.plan || '',
              tenantId: workoutDoc.tenantId,
              memberProfileId: workoutDoc.memberProfileId,
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
