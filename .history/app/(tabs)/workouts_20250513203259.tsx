import VideoPlayer from '@/components/VideoPlayer';
import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
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
      console.log('uiWorkouts', uiWorkouts);
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
      ? `${minutes}min ${remainingSeconds}s`
      : `${minutes}min`;
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
          console.log('set', set);
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
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Plano de Treino</Text>
          <Text style={styles.subtitle}>
            Seu programa de treinamento personalizado
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.workoutsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00E6C3" />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadWorkouts}
                >
                  <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
              </View>
            ) : workouts.length === 0 ? (
              <View style={styles.noWorkoutsContainer}>
                <Text style={styles.noWorkoutsText}>
                  Nenhum treino disponível
                </Text>
              </View>
            ) : (
              workouts.map((workout) => (
                <View style={styles.exerciseInfo}>
                  <Image
                    source={{ uri: exercise.imageUrl }}
                    style={styles.exerciseImage}
                  />
                  <View style={styles.exerciseDetails}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
                    {/* séries como ícones Repeat com reps dentro */}
                    <View style={styles.seriesContainer}>
                      {Array.from({ length: Math.min(exercise.sets, 5) }).map(
                        (_, i) => (
                          <View key={i} style={styles.seriesIconWrapper}>
                            <Repeat size={24} color="#00E6C3" />
                            <Text style={styles.seriesRepsText}>
                              {exercise.reps}
                            </Text>
                          </View>
                        )
                      )}
                      {exercise.sets > 5 && (
                        <Text
                          style={[
                            styles.exerciseMuscle,
                            { marginLeft: 5, alignSelf: 'center' },
                          ]}
                        >
                          +{exercise.sets - 5}
                        </Text>
                      )}
                    </View>

                    {/* descanso em linha separada */}
                    <Text style={styles.restText}>
                      Descanso: {exercise.rest}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#666" />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowModal(false);
                setShowVideo(false);
              }}
            >
              <X size={24} color="#fff" />
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
                  <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedExercise.muscle}
                  </Text>

                  <View style={styles.modalStats}>
                    <View style={styles.modalStatItem}>
                      <Dumbbell size={24} color="#00E6C3" />
                      <Text style={styles.modalStatValue}>
                        {selectedExercise.sets} séries
                      </Text>
                      <Text style={styles.modalStatLabel}>Séries</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Repeat size={24} color="#00E6C3" />
                      <Text style={styles.modalStatValue}>
                        {selectedExercise.reps} repetições
                      </Text>
                      <Text style={styles.modalStatLabel}>Repetições</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Timer size={24} color="#00E6C3" />
                      <Text style={styles.modalStatValue}>
                        {selectedExercise.rest} descanso
                      </Text>
                      <Text style={styles.modalStatLabel}>Descanso</Text>
                    </View>
                  </View>

                  {selectedExercise.instructions && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Info size={20} color="#00E6C3" />
                        <Text style={styles.sectionTitle}>Instruções</Text>
                      </View>
                      {selectedExercise.instructions.map(
                        (instruction, index) => (
                          <View key={index} style={styles.instructionItem}>
                            <CheckCircle2 size={20} color="#00E6C3" />
                            <Text style={styles.instructionText}>
                              {instruction}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}

                  {selectedExercise.tips && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Info size={20} color="#00E6C3" />
                        <Text style={styles.sectionTitle}>Dicas</Text>
                      </View>
                      {selectedExercise.tips.map((tip, index) => (
                        <View key={index} style={styles.tipItem}>
                          <Text style={styles.tipText}>• {tip}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedExercise.video && (
                    <TouchableOpacity
                      style={styles.watchButton}
                      onPress={handleWatchVideo}
                    >
                      <Play size={20} color="#fff" />
                      <Text style={styles.watchButtonText}>
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
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    color: '#FF4444',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noWorkoutsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
  },
  noWorkoutsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: '#1a1a1a',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    color: '#fff',
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  exerciseCount: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exerciseCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseList: {
    padding: 20,
  },
  seriesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  seriesIconWrapper: {
    width: 32, // ajusta tamanho do contêiner do ícone
    height: 32,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // pra sobrepor o texto na icon
  },
  seriesRepsText: {
    position: 'absolute', // sobrepõe em cima do ícone
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  restText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  exerciseItem: {
    marginBottom: 15,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
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
    color: '#fff',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exerciseStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statItem: {
    width: '33%', // cada bloco ocupa exatamente 1/3
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // centro horizontalmente dentro do terço
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#121212',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#666',
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
    color: '#fff',
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
    color: '#fff',
    lineHeight: 24,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E6C3',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
