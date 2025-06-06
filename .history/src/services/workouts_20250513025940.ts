import { Query, Models } from 'appwrite';
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
      console.log('[WorkoutService] Fetching workouts for tenantId:', tenantId);
      console.log('[WorkoutService] Using DATABASE_ID:', DATABASE_ID);
      console.log(
        '[WorkoutService] Using WORKOUTS_COLLECTION_ID:',
        WORKOUTS_COLLECTION_ID
      );

      // Verificar todas as coleções
      try {
        console.log('[WorkoutService] Database ID:', DATABASE_ID);
        console.log('[WorkoutService] Listing all collections in database');
        const collections = await db.listCollections(DATABASE_ID);
        console.log(
          '[WorkoutService] Collections:',
          collections.collections.map((c) => ({ id: c.$id, name: c.name }))
        );
      } catch (e) {
        console.error('[WorkoutService] Error listing collections:', e);
      }

      // First get the workouts - vamos tentar listar todos os workouts primeiro
      try {
        const allWorkouts = await db.listDocuments(
          DATABASE_ID,
          WORKOUTS_COLLECTION_ID,
          []
        );
        console.log('[WorkoutService] All workouts count:', allWorkouts.total);
        console.log('[WorkoutService] All workouts:', allWorkouts.documents);
      } catch (e) {
        console.error('[WorkoutService] Error listing all workouts:', e);
      }

      // Agora vamos buscar os workouts filtrados por tenantId
      const workoutsResponse = await db.listDocuments(
        DATABASE_ID,
        WORKOUTS_COLLECTION_ID,
        [Query.equal('tenantId', tenantId)]
      );

      console.log(
        '[WorkoutService] Filtered workouts found:',
        workoutsResponse.total
      );
      console.log(
        '[WorkoutService] Filtered workouts documents:',
        workoutsResponse.documents
      );

      // Se não houver workouts, retornar array vazio
      if (workoutsResponse.documents.length === 0) {
        console.log(
          '[WorkoutService] No workouts found for tenantId:',
          tenantId
        );
        return [];
      }

      // Then get the workout sets for each workout
      const workouts = await Promise.all(
        workoutsResponse.documents.map(async (workout) => {
          try {
            console.log(`[WorkoutService] Processing workout: ${workout.$id}`);

            const setsResponse = await db.listDocuments(
              DATABASE_ID,
              WORKOUT_SETS_COLLECTION_ID,
              [Query.equal('workoutId', workout.$id)]
            );

            console.log(
              `[WorkoutService] Sets found for workout ${workout.$id}:`,
              setsResponse.documents.length
            );

            // Se não tiver sets, retornar workout sem sets
            if (setsResponse.documents.length === 0) {
              console.log(
                `[WorkoutService] No sets found for workout ${workout.$id}`
              );
              return {
                id: workout.$id,
                title: workout.title || 'Treino sem título',
                plan: workout.plan || '',
                tenantId: workout.tenantId,
                memberProfileId: workout.memberProfileId,
                sets: [],
              };
            }

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
                      `[WorkoutService] Error fetching exercise ${set.exerciseId}:`,
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
            console.error(
              '[WorkoutService] Error processing workout:',
              workout.$id,
              error
            );
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

      console.log('[WorkoutService] Final processed workouts:', workouts);
      return workouts;
    } catch (error) {
      console.error('[WorkoutService] Error fetching workouts:', error);
      throw new Error('Failed to fetch workouts');
    }
  }
}
