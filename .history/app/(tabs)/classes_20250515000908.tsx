import { useGym } from '@/src/context/GymContext';
import { Api } from '@/src/services/api';
import type { ClassType } from '@/types';
import { differenceInMinutes, format, parseISO } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Heart,
  MapPin,
  Music,
  Users as UsersIcon,
  XCircle,
  Cog as Yoga,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CLASS_ICONS = {
  yoga: Yoga,
  pilates: Heart,
  zumba: Music,
  functional: Dumbbell,
  jump: Dumbbell,
};

export default function ClassesScreen() {
  const { currentGym } = useGym();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedType, setSelectedType] = useState<ClassType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentGym) {
      fetchClasses();
    }
  }, [selectedType, currentGym]);

  const fetchClasses = async () => {
    if (!currentGym) {
      setError('Por favor, selecione uma academia nas configurações do perfil');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await Api.getClasses(
        selectedType === 'all' ? undefined : selectedType
      );

      if (response.error) {
        setError(response.error);
      } else {
        console.log(response);
        setClasses(response.data.classes);
      }
    } catch (err) {
      setError('Falha ao carregar as aulas');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (classId: string) => {
    Alert.alert('Confirmar Check-in', 'Deseja fazer check-in nesta aula?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Check-in',
        onPress: async () => {
          try {
            const response = await Api.checkIn(classId);
            if (response.error) {
              Alert.alert('Erro', response.error);
              return;
            }
            setClasses((prevClasses) =>
              prevClasses.map((c) =>
                c.id === classId ? { ...c, isCheckedIn: true } : c
              )
            );
            Alert.alert('Sucesso', 'Check-in realizado com sucesso!');
          } catch (error) {
            Alert.alert(
              'Erro',
              'Falha ao fazer check-in. Por favor, tente novamente.'
            );
          }
        },
      },
    ]);
  };

  const handleCancelCheckIn = async (classId: string) => {
    Alert.alert('Cancelar Check-in', 'Deseja cancelar seu check-in?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, Cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await Api.cancelCheckIn(classId);
            if (response.error) {
              Alert.alert('Erro', response.error);
              return;
            }
            setClasses((prevClasses) =>
              prevClasses.map((c) =>
                c.id === classId ? { ...c, isCheckedIn: false } : c
              )
            );
            Alert.alert('Sucesso', 'Check-in cancelado com sucesso.');
          } catch (error) {
            Alert.alert(
              'Erro',
              'Falha ao cancelar check-in. Por favor, tente novamente.'
            );
          }
        },
      },
    ]);
  };

  const ClassTypeIcon = ({ type }: { type: ClassType }) => {
    const IconComponent = CLASS_ICONS[type];
    return <IconComponent size={24} color="#00E6C3" />;
  };

  const formatDuration = (start: string, end: string) => {
    const minutes = differenceInMinutes(parseISO(end), parseISO(start));
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h${
        remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''
      }`;
    }
    return `${minutes}min`;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Aulas de Fitness</Text>
          <Text style={styles.subtitle}>
            Participe das nossas sessões em grupo
          </Text>
        </View>

        <View style={styles.content}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedType === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedType('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedType === 'all' && styles.filterTextActive,
                ]}
              >
                Todas as Aulas
              </Text>
            </TouchableOpacity>
            {(
              ['yoga', 'pilates', 'zumba', 'functional', 'jump'] as ClassType[]
            ).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedType === type && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedType === type && styles.filterTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.classesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00E6C3" />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchClasses}
                >
                  <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
              </View>
            ) : classes.length === 0 ? (
              <View style={styles.noClassesContainer}>
                <Text style={styles.noClassesText}>
                  Nenhuma aula disponível
                </Text>
              </View>
            ) : (
              classes.map((fitnessClass) => (
                <View key={fitnessClass.id} style={styles.classCard}>
                  <View style={styles.classCardContent}>
                    <View style={styles.classInfo}>
                      <View style={styles.classTypeContainer}>
                        <ClassTypeIcon type={fitnessClass.type} />
                        <Text style={styles.className}>
                          {fitnessClass.name}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Clock size={14} color="#666" />
                          <Text style={styles.detailText}>
                            {format(parseISO(fitnessClass.start), 'HH:mm')} -{' '}
                            {format(parseISO(fitnessClass.end), 'HH:mm')}
                          </Text>
                        </View>

                        <View style={styles.detailItem}>
                          <Text style={styles.durationText}>
                            {formatDuration(
                              fitnessClass.start,
                              fitnessClass.end
                            )}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <MapPin size={14} color="#666" />
                          <Text style={styles.detailText}>
                            {fitnessClass.location}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <UsersIcon size={14} color="#666" />
                          <Text style={styles.detailText}>
                            {fitnessClass.enrolled}/{fitnessClass.capacity}{' '}
                            vagas
                          </Text>
                        </View>
                        {fitnessClass.capacity - fitnessClass.enrolled <= 3 && (
                          <Text style={styles.limitedSpotsText}>
                            Restam apenas{' '}
                            {fitnessClass.capacity - fitnessClass.enrolled}{' '}
                            vagas!
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.instructorRow}>
                    <Image
                      source={{
                        uri: fitnessClass.trainerId.imageUrl,
                      }}
                      style={styles.instructorImage}
                    />
                    <Text style={styles.instructorName}>
                      {fitnessClass.trainerId.name}
                    </Text>
                  </View>

                  {fitnessClass.isCheckedIn ? (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelCheckIn(fitnessClass.id)}
                    >
                      <XCircle size={20} color="#FF4444" />
                      <Text style={styles.cancelButtonText}>
                        Cancelar Check-in
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.checkInButton}
                      onPress={() => handleCheckIn(fitnessClass.id)}
                    >
                      <CheckCircle2 size={20} color="#fff" />
                      <Text style={styles.checkInButtonText}>
                        Fazer Check-in
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 40,
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
    padding: 20,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterContent: {
    paddingRight: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#252525',
  },
  filterButtonActive: {
    backgroundColor: '#00E6C3',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  classesContainer: {
    flex: 1,
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
  noClassesContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
  },
  noClassesText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  classCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    padding: 12,
  },
  classCardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  classImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  classInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  classTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#999',
    fontSize: 13,
  },
  durationText: {
    color: '#00E6C3',
    fontSize: 13,
    fontWeight: '500',
  },
  limitedSpotsText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#252525',
    gap: 8,
  },
  instructorImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  instructorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E6C3',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
