import { useGym } from '@/src/context/GymContext';
import { Api, Class } from '@/src/services/api';
import type { ClassType } from '@/types';
import {
  Clock,
  Dumbbell,
  Heart,
  MapPin,
  Music,
  Users as UsersIcon,
  Cog as Yoga,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
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
        console.log(response.data.classes);
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
                  <Image
                    source={{ uri: fitnessClass.image }}
                    style={styles.classImage}
                  />
                  <View style={styles.classContent}>
                    <View style={styles.classHeader}>
                      <View style={styles.classTypeContainer}>
                        <ClassTypeIcon type={fitnessClass.type} />
                        <Text style={styles.className}>
                          {fitnessClass.name}
                        </Text>
                      </View>
                      {/* {fitnessClass.isCheckedIn ? (
                        <View style={styles.checkedInBadge}>
                          <CheckCircle2 size={16} color="#00E6C3" />
                          <Text style={styles.checkedInText}>
                            Check-in Realizado
                          </Text>
                        </View>
                      ) : null} */}
                    </View>

                    <View style={styles.classDetails}>
                      <View style={styles.detailItem}>
                        <Clock size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {/* {fitnessClass.time} • {fitnessClass.duration} */}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <UsersIcon size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {fitnessClass.enrolled}/{fitnessClass.capacity} vagas
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MapPin size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {fitnessClass.location}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.instructorContainer}>
                      <Image
                        source={{
                          uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
                        }}
                        style={styles.instructorImage}
                      />
                      <Text style={styles.instructorName}>
                        {fitnessClass.instructor}
                      </Text>
                    </View>

                    {/* {fitnessClass.isCheckedIn ? (
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
                    )} */}
                  </View>
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
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  classImage: {
    width: '100%',
    height: 200,
  },
  classContent: {
    padding: 20,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  classTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  className: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 195, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  checkedInText: {
    color: '#00E6C3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  classDetails: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#666',
    fontSize: 14,
  },
  instructorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  instructorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  instructorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E6C3',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
