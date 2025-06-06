import { User } from 'firebase/auth';

export type Schedule = {
  id: string;
  date: Date;
  time: string;
  trainerId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};

export type Trainer = {
  id: string;
  name: string;
  specialty: string;
  image: string;
  available: boolean;
};

// Mock data
const MOCK_TRAINERS: Trainer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    specialty: 'Strength & Conditioning',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop',
    available: true,
  },
  {
    id: '2',
    name: 'Mike Chen',
    specialty: 'Sports Performance',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop',
    available: true,
  },
];

// Mock schedules
const MOCK_SCHEDULES: Schedule[] = [
  {
    id: '1',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    time: '10:00',
    trainerId: '1',
    status: 'scheduled',
  },
  {
    id: '2',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    time: '14:00',
    trainerId: '2',
    status: 'completed',
  },
];

export class ScheduleService {
  static async getAvailableDates(): Promise<Date[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate next 7 days as available dates
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      dates.push(new Date(Date.now() + i * 24 * 60 * 60 * 1000));
    }
    return dates;
  }

  static async getAvailableTrainers(): Promise<Trainer[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_TRAINERS;
  }

  static async getAvailableSlots(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];
  }

  static async getUserSchedules(user: User | null): Promise<Schedule[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!user) throw new Error('User not authenticated');
    return MOCK_SCHEDULES;
  }

  static async createSchedule(
    user: User | null,
    date: Date,
    time: string,
    trainerId: string
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!user) throw new Error('User not authenticated');
    
    MOCK_SCHEDULES.push({
      id: Math.random().toString(36).substr(2, 9),
      date,
      time,
      trainerId,
      status: 'scheduled',
    });
  }

  static async cancelSchedule(user: User | null, scheduleId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!user) throw new Error('User not authenticated');

    const schedule = MOCK_SCHEDULES.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.status = 'cancelled';
    }
  }

  static async rescheduleAppointment(
    user: User | null,
    scheduleId: string,
    newDate: Date,
    newTime: string
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!user) throw new Error('User not authenticated');

    const schedule = MOCK_SCHEDULES.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.date = newDate;
      schedule.time = newTime;
    }
  }
}