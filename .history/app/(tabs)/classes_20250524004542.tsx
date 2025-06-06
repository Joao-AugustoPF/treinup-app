import { useGym } from '@/src/context/GymContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
  Api,
  CLASSES_COLLECTION_ID,
  CLASS_BOOKINGS_COLLECTION_ID,
  DATABASE_ID,
} from '@/src/services/api';
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
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Client } from 'react-native-appwrite';

// Define the Class type based on the API
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
  bookingsCount: number;
  location: string;
  imageUrl: string;
  isCheckedIn?: boolean;
};

const CLASS_ICONS: Record<ClassType, any> = {
  yoga: Yoga,
  pilates: Heart,
  zumba: Music,
  funcional: Dumbbell,
  jump: Dumbbell,
};

const CLASS_TYPE_DISPLAY_NAMES: Record<ClassType, string> = {
  yoga: 'Yoga',
  pilates: 'Pilates',
  zumba: 'Zumba',
  funcional: 'Funcional',
  jump: 'Jump',
};

export default function ClassesScreen() {
  const { currentGym } = useGym();
  const { isDark, paperTheme } = useTheme();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedType, setSelectedType] = useState<ClassType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classTypes, setClassTypes] = useState<ClassType[]>(['fun']);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchClassTypes(), fetchClasses()]);
    } catch (error) {
      console.warn('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentGym) {
      fetchClassTypes();
      fetchClasses();

      // Create Appwrite client instance
      const client = new Client()
        .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

      console.log('client', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
      console.log('client', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

      // Subscribe to realtime updates for classes
      const unsubscribe = client.subscribe(
        `databases.${DATABASE_ID}.collections.${CLASSES_COLLECTION_ID}.documents`,
        (response) => {
          // Handle different types of events
          if (
            response.events.includes(
              'databases.*.collections.*.documents.*.create'
            )
          ) {
            // New class created
            fetchClasses();
          } else if (
            response.events.includes(
              'databases.*.collections.*.documents.*.update'
            )
          ) {
            // Class updated
            fetchClasses();
          } else if (
            response.events.includes(
              'databases.*.collections.*.documents.*.delete'
            )
          ) {
            // Class deleted
            fetchClasses();
          }
        }
      );

      // Subscribe to realtime updates for class bookings
      const unsubscribeBookings = client.subscribe(
        `databases.${DATABASE_ID}.collections.${CLASS_BOOKINGS_COLLECTION_ID}.documents`,
        (response) => {
          // Refresh classes when bookings change
          fetchClasses();
        }
      );

      // Cleanup subscriptions when component unmounts
      return () => {
        try {
          unsubscribe();
          unsubscribeBookings();
        } catch (error) {
          console.warn('Error cleaning up realtime subscriptions:', error);
        }
      };
    }
  }, [currentGym]);

  const fetchClassTypes = async () => {
    try {
      const response = await Api.getClassTypes();
      if (response.error) {
        console.warn('Error fetching class types:', response.error);
      } else {
        console.log(response.data);
        setClassTypes(response.data.types);
      }
    } catch (err) {
      console.warn('Error fetching class types:', err);
    }
  };

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
    const IconComponent = CLASS_ICONS[type] || Dumbbell; // Use Dumbbell as fallback
    return <IconComponent size={24} color="rgba(255,20,147,0.7)" />;
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
    <View
      style={[
        styles.container,
        { backgroundColor: paperTheme.colors.background },
      ]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[paperTheme.colors.primary]}
            tintColor={paperTheme.colors.primary}
            titleColor={paperTheme.colors.primary}
          />
        }
      >
        <View
          style={[
            styles.header,
            { backgroundColor: paperTheme.colors.surface },
          ]}
        >
          <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
            Aulas de Fitness
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: paperTheme.colors.onSurfaceVariant },
            ]}
          >
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
                { backgroundColor: paperTheme.colors.surfaceVariant },
                selectedType === 'all' && {
                  backgroundColor: paperTheme.colors.primary,
                },
              ]}
              onPress={() => setSelectedType('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: paperTheme.colors.onSurfaceVariant },
                  selectedType === 'all' && {
                    color: paperTheme.colors.onPrimary,
                  },
                ]}
              >
                Todas as Aulas
              </Text>
            </TouchableOpacity>
            {classTypes &&
              classTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    { backgroundColor: paperTheme.colors.surfaceVariant },
                    selectedType === type && {
                      backgroundColor: paperTheme.colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: paperTheme.colors.onSurfaceVariant },
                      selectedType === type && {
                        color: paperTheme.colors.onPrimary,
                      },
                    ]}
                  >
                    {CLASS_TYPE_DISPLAY_NAMES[type]}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <View style={styles.classesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={paperTheme.colors.primary}
                />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text
                  style={[styles.errorText, { color: paperTheme.colors.error }]}
                >
                  {error}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: paperTheme.colors.primary },
                  ]}
                  onPress={fetchClasses}
                >
                  <Text
                    style={[
                      styles.retryButtonText,
                      { color: paperTheme.colors.onPrimary },
                    ]}
                  >
                    Tentar Novamente
                  </Text>
                </TouchableOpacity>
              </View>
            ) : classes.length === 0 ? (
              <View
                style={[
                  styles.noClassesContainer,
                  { backgroundColor: paperTheme.colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.noClassesText,
                    { color: paperTheme.colors.onSurfaceVariant },
                  ]}
                >
                  Nenhuma aula disponível
                </Text>
              </View>
            ) : (
              classes.map((fitnessClass) => (
                <View
                  key={fitnessClass.id}
                  style={[
                    styles.classCard,
                    { backgroundColor: paperTheme.colors.surface },
                  ]}
                >
                  <View style={styles.classCardContent}>
                    <View style={styles.classInfo}>
                      <View style={styles.classTypeContainer}>
                        <ClassTypeIcon type={fitnessClass.type} />
                        <Text
                          style={[
                            styles.className,
                            { color: paperTheme.colors.onSurface },
                          ]}
                        >
                          {fitnessClass.name}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Clock
                            size={14}
                            color={paperTheme.colors.onSurfaceVariant}
                          />
                          <Text
                            style={[
                              styles.detailText,
                              { color: paperTheme.colors.onSurfaceVariant },
                            ]}
                          >
                            {format(parseISO(fitnessClass.start), 'HH:mm')} -{' '}
                            {format(parseISO(fitnessClass.end), 'HH:mm')}
                          </Text>
                        </View>

                        <View style={styles.detailItem}>
                          <Text
                            style={[
                              styles.durationText,
                              { color: paperTheme.colors.primary },
                            ]}
                          >
                            {formatDuration(
                              fitnessClass.start,
                              fitnessClass.end
                            )}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <MapPin
                            size={14}
                            color={paperTheme.colors.onSurfaceVariant}
                          />
                          <Text
                            style={[
                              styles.detailText,
                              { color: paperTheme.colors.onSurfaceVariant },
                            ]}
                          >
                            {fitnessClass.location}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <UsersIcon
                            size={14}
                            color={paperTheme.colors.onSurfaceVariant}
                          />
                          <Text
                            style={[
                              styles.detailText,
                              { color: paperTheme.colors.onSurfaceVariant },
                            ]}
                          >
                            {fitnessClass.bookingsCount}/{fitnessClass.capacity}{' '}
                            vagas
                          </Text>
                        </View>
                        {fitnessClass.capacity - fitnessClass.bookingsCount <=
                          3 &&
                          fitnessClass.capacity >
                            fitnessClass.bookingsCount && (
                            <Text
                              style={[
                                styles.limitedSpotsText,
                                { color: paperTheme.colors.error },
                              ]}
                            >
                              Restam apenas{' '}
                              {fitnessClass.capacity -
                                fitnessClass.bookingsCount}{' '}
                              vagas!
                            </Text>
                          )}
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.instructorRow,
                      { borderTopColor: paperTheme.colors.surfaceVariant },
                    ]}
                  >
                    <Image
                      source={{
                        uri: fitnessClass.trainerId.imageUrl,
                      }}
                      style={styles.instructorImage}
                    />
                    <Text
                      style={[
                        styles.instructorName,
                        { color: paperTheme.colors.onSurface },
                      ]}
                    >
                      {fitnessClass.trainerId.name}
                    </Text>
                  </View>

                  {fitnessClass.isCheckedIn ? (
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        { backgroundColor: paperTheme.colors.errorContainer },
                      ]}
                      onPress={() => handleCancelCheckIn(fitnessClass.id)}
                    >
                      <XCircle size={20} color={paperTheme.colors.error} />
                      <Text
                        style={[
                          styles.cancelButtonText,
                          { color: paperTheme.colors.error },
                        ]}
                      >
                        Cancelar Check-in
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.checkInButton,
                        { backgroundColor: paperTheme.colors.primary },
                      ]}
                      onPress={() => handleCheckIn(fitnessClass.id)}
                    >
                      <CheckCircle2
                        size={20}
                        color={paperTheme.colors.onPrimary}
                      />
                      <Text
                        style={[
                          styles.checkInButtonText,
                          { color: paperTheme.colors.onPrimary },
                        ]}
                      >
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
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
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
  noClassesContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  noClassesText: {
    fontSize: 16,
    textAlign: 'center',
  },
  classCard: {
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
    fontSize: 13,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  limitedSpotsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  instructorImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
