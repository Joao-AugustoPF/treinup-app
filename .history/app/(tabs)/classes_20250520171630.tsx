import { useGym } from '@/src/context/GymContext';
import {
  Api,
  CLASSES_COLLECTION_ID,
  CLASS_BOOKINGS_COLLECTION_ID,
  DATABASE_ID,
} from '@/src/services/api';
// import type { ClassType } from '@/types';
import { Client } from 'appwrite';
import { differenceInMinutes, format, parseISO } from 'date-fns';
// import {
//   CheckCircle2,
//   Clock,
//   Dumbbell,
//   Heart,
//   MapPin,
//   Music,
//   Users as UsersIcon,
//   XCircle,
//   Cog as Yoga,
// } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  // ActivityIndicator,
  // Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  // TouchableOpacity,
  View,
} from 'react-native';

// Define the Class type based on the API
// type Class = {
//   id: string;
//   type: ClassType;
//   name: string;
//   trainerId: {
//     name: string;
//     imageUrl: string;
//     id: string;
//     email: string;
//   };
//   start: string;
//   end: string;
//   duration: string;
//   capacity: number;
//   bookingsCount: number;
//   location: string;
//   imageUrl: string;
//   isCheckedIn?: boolean;
// };

// Mock data for classes
// const MOCK_CLASSES: Class[] = [
//   {
//     id: '1',
//     type: 'functional',
//     name: 'Treino Funcional',
//     trainerId: {
//       name: 'João Silva',
//       imageUrl: 'https://i.pravatar.cc/150?img=1',
//       id: '1',
//       email: 'joao@example.com',
//     },
//     start: new Date(Date.now() + 3600000).toISOString(),
//     end: new Date(Date.now() + 7200000).toISOString(),
//     duration: '60min',
//     capacity: 20,
//     bookingsCount: 15,
//     location: 'Sala 1',
//     imageUrl: 'https://example.com/class1.jpg',
//   },
//   {
//     id: '2',
//     type: 'yoga',
//     name: 'Yoga Flow',
//     trainerId: {
//       name: 'Maria Santos',
//       imageUrl: 'https://i.pravatar.cc/150?img=2',
//       id: '2',
//       email: 'maria@example.com',
//     },
//     start: new Date(Date.now() + 7200000).toISOString(),
//     end: new Date(Date.now() + 9000000).toISOString(),
//     duration: '30min',
//     capacity: 15,
//     bookingsCount: 12,
//     location: 'Sala 2',
//     imageUrl: 'https://example.com/class2.jpg',
//   },
//   {
//     id: '3',
//     type: 'pilates',
//     name: 'Pilates Mat',
//     trainerId: {
//       name: 'Ana Oliveira',
//       imageUrl: 'https://i.pravatar.cc/150?img=3',
//       id: '3',
//       email: 'ana@example.com',
//     },
//     start: new Date(Date.now() + 10800000).toISOString(),
//     end: new Date(Date.now() + 12600000).toISOString(),
//     duration: '30min',
//     capacity: 10,
//     bookingsCount: 8,
//     location: 'Sala 3',
//     imageUrl: 'https://example.com/class3.jpg',
//   },
// ];

// const CLASS_ICONS: Record<ClassType, any> = {
//   yoga: Yoga,
//   pilates: Heart,
//   zumba: Music,
//   functional: Dumbbell,
//   jump: Dumbbell,
// };

// const CLASS_TYPE_DISPLAY_NAMES: Record<ClassType, string> = {
//   yoga: 'Yoga',
//   pilates: 'Pilates',
//   zumba: 'Zumba',
//   functional: 'Funcional',
//   jump: 'Jump',
// };

export default function ClassesScreen() {
  const { currentGym } = useGym();
  // const [classes] = useState<Class[]>(MOCK_CLASSES);
  // const [selectedType] = useState<ClassType | 'all'>('all');
  // const [classTypes] = useState<ClassType[]>(['functional', 'yoga', 'pilates']);

  // const ClassTypeIcon = ({ type }: { type: ClassType }) => {
  //   const IconComponent = CLASS_ICONS[type] || Dumbbell;
  //   return <IconComponent size={24} color="rgba(255,20,147,0.7)" />;
  // };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Aulas de Fitness</Text>
          <Text style={styles.subtitle}>
            Participe das nossas sessões em grupo
          </Text>
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
});
