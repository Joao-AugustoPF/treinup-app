import { useGym } from '@/src/context/GymContext';
import {
  Api,
  CLASSES_COLLECTION_ID,
  CLASS_BOOKINGS_COLLECTION_ID,
  DATABASE_ID,
} from '@/src/services/api';
// import type { ClassType } from '@/types';
import type { ClassType } from '@/types';
import { Client } from 'appwrite';
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

// Mock data for classes
const MOCK_CLASSES: Class[] = [
  {
    id: '1',
    type: 'functional',
    name: 'Treino Funcional',
    trainerId: {
      name: 'João Silva',
      imageUrl: 'https://i.pravatar.cc/150?img=1',
      id: '1',
      email: 'joao@example.com',
    },
    start: new Date(Date.now() + 3600000).toISOString(),
    end: new Date(Date.now() + 7200000).toISOString(),
    duration: '60min',
    capacity: 20,
    bookingsCount: 15,
    location: 'Sala 1',
    imageUrl: 'https://example.com/class1.jpg',
  },
  {
    id: '2',
    type: 'yoga',
    name: 'Yoga Flow',
    trainerId: {
      name: 'Maria Santos',
      imageUrl: 'https://i.pravatar.cc/150?img=2',
      id: '2',
      email: 'maria@example.com',
    },
    start: new Date(Date.now() + 7200000).toISOString(),
    end: new Date(Date.now() + 9000000).toISOString(),
    duration: '30min',
    capacity: 15,
    bookingsCount: 12,
    location: 'Sala 2',
    imageUrl: 'https://example.com/class2.jpg',
  },
  {
    id: '3',
    type: 'pilates',
    name: 'Pilates Mat',
    trainerId: {
      name: 'Ana Oliveira',
      imageUrl: 'https://i.pravatar.cc/150?img=3',
      id: '3',
      email: 'ana@example.com',
    },
    start: new Date(Date.now() + 10800000).toISOString(),
    end: new Date(Date.now() + 12600000).toISOString(),
    duration: '30min',
    capacity: 10,
    bookingsCount: 8,
    location: 'Sala 3',
    imageUrl: 'https://example.com/class3.jpg',
  },
];

const CLASS_ICONS: Record<ClassType, any> = {
  yoga: Yoga,
  pilates: Heart,
  zumba: Music,
  functional: Dumbbell,
  jump: Dumbbell,
};

const CLASS_TYPE_DISPLAY_NAMES: Record<ClassType, string> = {
  yoga: 'Yoga',
  pilates: 'Pilates',
  zumba: 'Zumba',
  functional: 'Funcional',
  jump: 'Jump',
};

export default function ClassesScreen() {
  const { currentGym } = useGym();
  const [classes] = useState<Class[]>(MOCK_CLASSES);
  const [selectedType] = useState<ClassType | 'all'>('all');
  const [classTypes] = useState<ClassType[]>(['functional', 'yoga', 'pilates']);

  const ClassTypeIcon = ({ type }: { type: ClassType }) => {
    const IconComponent = CLASS_ICONS[type] || Dumbbell;
    return <IconComponent size={24} color="rgba(255,20,147,0.7)" />;
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
            {classTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedType === type && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedType === type && styles.filterTextActive,
                  ]}
                >
                  {CLASS_TYPE_DISPLAY_NAMES[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.classesContainer}>
            {classes.map((fitnessClass) => (
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
                          {new Date(fitnessClass.start).toLocaleTimeString()} -{' '}
                          {new Date(fitnessClass.end).toLocaleTimeString()}
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Text style={styles.durationText}>
                          {fitnessClass.duration}
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
                          {fitnessClass.bookingsCount}/{fitnessClass.capacity}{' '}
                          vagas
                        </Text>
                      </View>
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

                <TouchableOpacity
                  style={styles.checkInButton}
                >
                  <CheckCircle2 size={20} color="#fff" />
                  <Text style={styles.checkInButtonText}>
                    Fazer Check-in
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
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
    backgroundColor: 'rgba(255,20,147,0.7)',
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
    color: 'rgba(255,20,147,0.7)',
    fontSize: 13,
    fontWeight: '500',
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
    backgroundColor: 'rgba(255,20,147,0.7)',
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
});
