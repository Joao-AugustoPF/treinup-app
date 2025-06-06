import { User } from 'firebase/auth';

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: string;
  image: string;
  video: string;
  instructions: string[];
  tips: string[];
};

export type WorkoutDay = {
  id: string;
  gymId: string; // Added gymId to associate workouts with specific gyms
  name: string;
  focus: string;
  exercises: Exercise[];
  image: string;
};

// Mock user-specific workouts for different gyms
const USER_WORKOUTS: Record<string, WorkoutDay[]> = {
  '1': [ // FitZone Elite workouts
    {
      id: '1',
      gymId: '1',
      name: 'Upper Body Power',
      focus: 'Chest, Back & Shoulders',
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
      exercises: [
        {
          id: '1',
          name: 'Bench Press',
          muscle: 'Chest',
          sets: 4,
          reps: '8-10',
          rest: '90 sec',
          image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop',
          video: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
          instructions: [
            'Lie on the bench with feet flat on the ground',
            'Grip the bar slightly wider than shoulder width',
            'Lower the bar to your chest with control',
            'Press the bar back up to starting position',
          ],
          tips: [
            'Keep your wrists straight',
            'Drive your feet into the ground',
            'Keep your core tight throughout the movement',
          ],
        },
      ],
    },
  ],
  '2': [ // PowerHouse Gym workouts
    {
      id: '2',
      gymId: '2',
      name: 'CrossFit WOD',
      focus: 'Full Body Conditioning',
      image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
      exercises: [
        {
          id: '3',
          name: 'Clean and Jerk',
          muscle: 'Full Body',
          sets: 5,
          reps: '5',
          rest: '120 sec',
          image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a34?q=80&w=1000&auto=format&fit=crop',
          video: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
          instructions: [
            'Start with the barbell on the ground',
            'Explosively pull the bar to your shoulders',
            'Drive the bar overhead',
            'Return to starting position',
          ],
          tips: [
            'Keep the bar close to your body',
            'Use your legs for power',
            'Maintain a strong core',
          ],
        },
      ],
    },
  ],
};

export class WorkoutService {
  static async getUserWorkouts(user: User | null, gymId: string): Promise<WorkoutDay[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Return workouts specific to the selected gym
    return USER_WORKOUTS[gymId] || [];
  }
}