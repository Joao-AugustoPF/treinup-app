import { ClassType } from '@/types';

// Types for the API responses
export type ApiResponse<T> = {
  data: T;
  error?: string;
};

export type ClassesResponse = {
  classes: Class[];
  total: number;
};

export type Class = {
  id: string;
  gymId: string;
  type: ClassType;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  capacity: number;
  enrolled: number;
  location: string;
  image: string;
  isCheckedIn?: boolean;
};

// Mock data with gym-specific classes
const MOCK_CLASSES: Class[] = [
  // FitZone Elite Classes (Gym ID: 1)
  {
    id: '1',
    gymId: '1',
    type: 'yoga',
    name: 'Morning Flow Yoga',
    instructor: 'Sarah Johnson',
    time: '08:00',
    duration: '60 min',
    capacity: 20,
    enrolled: 15,
    location: 'Zen Studio',
    image:
      'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '2',
    gymId: '1',
    type: 'pilates',
    name: 'Core Power Pilates',
    instructor: 'Emma Wilson',
    time: '10:00',
    duration: '45 min',
    capacity: 15,
    enrolled: 12,
    location: 'Mind-Body Studio',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '3',
    gymId: '1',
    type: 'zumba',
    name: 'Dance Cardio Party',
    instructor: 'Maria Rodriguez',
    time: '17:30',
    duration: '45 min',
    capacity: 25,
    enrolled: 20,
    location: 'Dance Studio',
    image:
      'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?q=80&w=1000&auto=format&fit=crop',
  },

  // PowerHouse Gym Classes (Gym ID: 2)
  {
    id: '4',
    gymId: '2',
    type: 'functional',
    name: 'CrossFit WOD',
    instructor: 'Mike Chen',
    time: '06:00',
    duration: '60 min',
    capacity: 12,
    enrolled: 10,
    location: 'CrossFit Box',
    image:
      'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '5',
    gymId: '2',
    type: 'functional',
    name: 'HIIT Blast',
    instructor: 'Alex Rivera',
    time: '18:00',
    duration: '45 min',
    capacity: 15,
    enrolled: 13,
    location: 'Functional Zone',
    image:
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '6',
    gymId: '2',
    type: 'jump',
    name: 'Power Jump',
    instructor: 'Lisa Thompson',
    time: '19:00',
    duration: '30 min',
    capacity: 20,
    enrolled: 15,
    location: 'Cardio Studio',
    image:
      'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1000&auto=format&fit=crop',
  },
];

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API class
export class Api {
  static async getClasses(
    gymId: string,
    type?: ClassType
  ): Promise<ApiResponse<ClassesResponse>> {
    try {
      await delay(1000);

      if (!gymId) {
        throw new Error('No gym selected');
      }

      // Filter classes by gym and type if provided
      let filteredClasses = MOCK_CLASSES.filter((c) => c.gymId === gymId);
      if (type) {
        filteredClasses = filteredClasses.filter((c) => c.type === type);
      }

      return {
        data: {
          classes: filteredClasses,
          total: filteredClasses.length,
        },
      };
    } catch (error) {
      return {
        data: { classes: [], total: 0 },
        error: 'Failed to fetch classes',
      };
    }
  }

  static async checkIn(
    classId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      await delay(500);
      return {
        data: { success: true },
      };
    } catch (error) {
      return {
        data: { success: false },
        error: 'Failed to check in',
      };
    }
  }

  static async cancelCheckIn(
    classId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      await delay(500);
      return {
        data: { success: true },
      };
    } catch (error) {
      return {
        data: { success: false },
        error: 'Failed to cancel check-in',
      };
    }
  }
}
