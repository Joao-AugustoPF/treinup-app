import VideoPlayer from '@/components/VideoPlayer';
import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
  WorkoutService,
  type Exercise,
  type Workout,
} from '@/src/services/workouts';
import {
  CircleCheck as CheckCircle2,
  ChevronRight,
  Dumbbell,
  Info,
  Play,
  Repeat,
  Timer,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Define a complete exercise type that includes all the fields needed by the UI
type WorkoutExercise = Exercise & {
  imageUrl?: string;
  video?: string;
  sets?: number;
  reps?: string;
  rest?: string;
  instructions?: string[];
  tips?: string[];
  muscle?: string;
};

// Define uma interface para representar o treino no formato que a UI espera
interface UIWorkout {
  id: string;
  name: string;
  focus: string;
  imageUrl: string;
  exercises: WorkoutExercise[];
}

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const { paperTheme } = useTheme();
  const [workouts, setWorkouts] = useState<UIWorkout[]>([]);
  const [selectedExercise, setSelectedExercise] =
    useState<WorkoutExercise | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (currentGym) {
      loadWorkouts();
    }
  }, [user, currentGym]);

  const loadWorkouts = async () => {
    if (!currentGym) {
      setError('Por favor, selecione uma academia nas configurações do perfil');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(
        'Loading workouts for gym:',
        currentGym.name,
        'with tenantId:',
        currentGym.tenantId
      );
      const userWorkouts = await WorkoutService.getUserWorkouts(
        user,
        currentGym.tenantId
      );

      console.log(`Found ${userWorkouts.length} workouts`);

      // Converter os treinos para o formato usado pela UI
      const uiWorkouts = userWorkouts.map((workout) =>
        formatWorkoutForUI(workout)
      );
      setWorkouts(uiWorkouts);
    } catch (err) {
      setError('Falha ao carregar os treinos. Por favor, tente novamente.');
      console.error('Error loading workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExercisePress = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
    setShowModal(true);
    setShowVideo(false);
  };

  const handleWatchVideo = () => {
    setShowVideo(true);
  };

  const formatRestTime = (seconds: number | undefined): string => {
    console.log('seconds', seconds);
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes} min ${remainingSeconds}s`
      : `${minutes} min`;
  };

  // Transform a workout to a format compatible with the UI
  const formatWorkoutForUI = (workout: Workout): UIWorkout => {
    return {
      id: workout.id,
      name: workout.title,
      focus: workout.plan,
      imageUrl: workout.imageUrl || '',
      exercises:
        workout.sets?.map((set) => {
          const exerciseInfo = set.exercise!;
          return {
            id: exerciseInfo.id,
            name: exerciseInfo.name,
            muscle: exerciseInfo.muscleGroup,
            sets: set.series,
            reps: `${set.reps}`,
            rest: formatRestTime(set.rest),
            imageUrl: set.imageUrl || '',
            video: exerciseInfo.tutorialUrl || '',
            instructions: ['Execute o movimento com foco na técnica correta.'],
            tips: ['Mantenha a postura adequada durante todo o exercício.'],
          } as WorkoutExercise;
        }) || [],
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: paperTheme.colors.surface }]}>
          <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>Plano de Treino</Text>
          <Text style={[styles.subtitle, { color: paperTheme.colors.onSurfaceVariant }]}>
            Seu programa de treinamento personalizado
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.workoutsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: paperTheme.colors.error }]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: paperTheme.colors.primary }]}
                  onPress={loadWorkouts}
                >
                  <Text style={[styles.retryButtonText, { color: paperTheme.colors.onPrimary }]}>
                    Tentar Novamente
                  </Text>
                </TouchableOpacity>
              </View>
            ) : workouts.length === 0 ? (
              <View style={[styles.noWorkoutsContainer, { backgroundColor: paperTheme.colors.surface }]}>
                <Text style={[styles.noWorkoutsText, { color: paperTheme.colors.onSurfaceVariant }]}>
                  Nenhum treino disponível
                </Text>
              </View>
            ) : (
              workouts.map((workout) => (
                <View key={workout.id} style={[styles.workoutCard, { backgroundColor: paperTheme.colors.surface }]}>
                  <Image
                    source={{ uri: workout.imageUrl }}
                    style={styles.workoutImage}
                  />
                  <View style={[styles.workoutOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                  <View style={styles.workoutContent}>
                    <View>
                      <Text style={[styles.workoutName, { color: paperTheme.colors.onSurface }]}>{workout.name}</Text>
                      <Text style={[styles.workoutFocus, { color: paperTheme.colors.onSurface }]}>{workout.focus}</Text>
                    </View>
                    <View style={[styles.exerciseCount, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                      <Text style={[styles.exerciseCountText, { color: paperTheme.colors.onSurface }]}>
                        {workout.exercises.length} exercícios
                      </Text>
                    </View>
                  </View>

                  <View style={styles.exerciseList}>
                    {workout.exercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise.id}
                        style={styles.exerciseItem}
                        onPress={() => handleExercisePress(exercise)}
                      >
                        <View style={[styles.exerciseInfo, { backgroundColor: paperTheme.colors.surfaceVariant }]}>
                          <Image
                            source={{ uri: exercise.imageUrl }}
                            style={styles.exerciseImage}
                          />
                          <View style={styles.exerciseDetails}>
                            <Text style={[styles.exerciseName, { color: paperTheme.colors.onSurface }]}>
                              {exercise.name}
                            </Text>
                            <Text style={[styles.exerciseMuscle, { color: paperTheme.colors.onSurfaceVariant }]}>
                              {exercise.muscle}
                            </Text>
                            <View style={[styles.exerciseStats, { backgroundColor: paperTheme.colors.surface }]}>
                              <View style={styles.statColumn}>
                                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                                  Séries
                                </Text>
                                <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>
                                  {exercise.sets}
                                </Text>
                              </View>
                              <View style={styles.statColumn}>
                                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                                  Repetições
                                </Text>
                                <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>
                                  {exercise.reps}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.restContainer}>
                              <Timer size={14} color={paperTheme.colors.onSurfaceVariant} />
                              <Text style={[styles.restText, { color: paperTheme.colors.onSurfaceVariant }]}>
                                Descanso: {exercise.rest}
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={20} color={paperTheme.colors.onSurfaceVariant} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <View style={[styles.modalContent, { backgroundColor: paperTheme.colors.background }]}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={() => {
                setShowModal(false);
                setShowVideo(false);
              }}
            >
              <X size={24} color={paperTheme.colors.onSurface} />
            </TouchableOpacity>

            {selectedExercise && (
              <ScrollView>
                {showVideo && selectedExercise.video ? (
                  <VideoPlayer
                    uri={selectedExercise.video}
                    style={styles.modalVideo}
                  />
                ) : (
                  <Image
                    source={{ uri: selectedExercise.imageUrl }}
                    style={styles.modalImage}
                  />
                )}

                <View style={styles.modalBody}>
                  <Text style={[styles.modalTitle, { color: paperTheme.colors.onSurface }]}>
                    {selectedExercise.name}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: paperTheme.colors.onSurfaceVariant }]}>
                    {selectedExercise.muscle}
                  </Text>

                  <View style={[styles.modalStats, { backgroundColor: paperTheme.colors.surface }]}>
                    <View style={styles.modalStatsRow}>
                      <View style={styles.modalStatItem}>
                        <Dumbbell size={24} color={paperTheme.colors.primary} />
                        <Text style={[styles.modalStatValue, { color: paperTheme.colors.onSurface }]}>
                          {selectedExercise.sets} séries
                        </Text>
                        <Text style={[styles.modalStatLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                          Séries
                        </Text>
                      </View>
                      <View style={styles.modalStatItem}>
                        <Repeat size={24} color={paperTheme.colors.primary} />
                        <Text style={[styles.modalStatValue, { color: paperTheme.colors.onSurface }]}>
                          {selectedExercise.reps} repetições
                        </Text>
                        <Text style={[styles.modalStatLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                          Repetições
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.modalRestContainer, { borderTopColor: paperTheme.colors.surfaceVariant }]}>
                      <Timer size={24} color={paperTheme.colors.primary} />
                      <Text style={[styles.modalRestValue, { color: paperTheme.colors.onSurface }]}>
                        {selectedExercise.rest}
                      </Text>
                      <Text style={[styles.modalRestLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                        Descanso
                      </Text>
                    </View>
                  </View>

                  {selectedExercise.instructions && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Info size={20} color={paperTheme.colors.primary} />
                        <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                          Instruções
                        </Text>
                      </View>
                      {selectedExercise.instructions.map((instruction, index) => (
                        <View key={index} style={styles.instructionItem}>
                          <CheckCircle2 size={20} color={paperTheme.colors.primary} />
                          <Text style={[styles.instructionText, { color: paperTheme.colors.onSurface }]}>
                            {instruction}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedExercise.tips && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Info size={20} color={paperTheme.colors.primary} />
                        <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                          Dicas
                        </Text>
                      </View>
                      {selectedExercise.tips.map((tip, index) => (
                        <View key={index} style={styles.tipItem}>
                          <Text style={[styles.tipText, { color: paperTheme.colors.onSurface }]}>
                            • {tip}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedExercise.video && (
                    <TouchableOpacity
                      style={[styles.watchButton, { backgroundColor: paperTheme.colors.primary }]}
                      onPress={handleWatchVideo}
                    >
                      <Play size={20} color={paperTheme.colors.onPrimary} />
                      <Text style={[styles.watchButtonText, { color: paperTheme.colors.onPrimary }]}>
                        {showVideo ? 'Ocultar Tutorial' : 'Assistir Tutorial'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  workoutsContainer: {
    padding: 20,
    minHeight: 200,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noWorkoutsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  noWorkoutsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  workoutCard: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  workoutImage: {
    width: '100%',
    height: 200,
  },
  workoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 200,
  },
  workoutContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 16,
    opacity: 0.8,
  },
  exerciseCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exerciseCountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseList: {
    padding: 20,
  },
  exerciseItem: {
    marginBottom: 15,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 14,
    marginBottom: 8,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderRadius: 8,
    padding: 8,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  restText: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalVideo: {
    width: '100%',
    height: 300,
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalStats: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  modalStatLabel: {
    fontSize: 14,
  },
  modalRestContainer: {
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  modalRestValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  modalRestLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 16,
    lineHeight: 24,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  watchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
