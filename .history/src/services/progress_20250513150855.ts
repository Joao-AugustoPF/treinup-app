export type Assessment = {
  id: string;
  gymId: string; // Added gymId to associate assessments with specific gyms
  date: Date;
  weight: number;
  height: number;
  bodyFat: number;
  muscleMass: number;
  bmi: number;
  measurements: {
    chest: number;
    waist: number;
    hips: number;
    biceps: number;
    thighs: number;
  };
  notes?: string;
};

// Mock user assessments data for different gyms
const USER_ASSESSMENTS: Record<string, Assessment[]> = {
  '1': [
    // FitZone Elite assessments
    {
      id: '1',
      gymId: '1',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      weight: 75,
      height: 175,
      bodyFat: 18,
      muscleMass: 35,
      bmi: 24.5,
      measurements: {
        chest: 95,
        waist: 82,
        hips: 98,
        biceps: 32,
        thighs: 55,
      },
    },
    {
      id: '2',
      gymId: '1',
      date: new Date(),
      weight: 73,
      height: 175,
      bodyFat: 16,
      muscleMass: 36,
      bmi: 23.8,
      measurements: {
        chest: 96,
        waist: 80,
        hips: 97,
        biceps: 33,
        thighs: 56,
      },
    },
  ],
  '2': [
    // PowerHouse Gym assessments
    {
      id: '3',
      gymId: '2',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      weight: 80,
      height: 180,
      bodyFat: 15,
      muscleMass: 40,
      bmi: 24.7,
      measurements: {
        chest: 100,
        waist: 85,
        hips: 100,
        biceps: 35,
        thighs: 60,
      },
    },
  ],
};

export class ProgressService {
  static async getUserAssessments(
    user: any | null,
    gymId: string
  ): Promise<Assessment[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Return assessments specific to the selected gym
    return USER_ASSESSMENTS[gymId] || [];
  }

  static async getLatestAssessment(
    user: null,
    gymId: string
  ): Promise<Assessment> {
    const assessments = await this.getUserAssessments(user, gymId);
    return assessments[assessments.length - 1];
  }

  static async addAssessment(
    user: any | null,
    gymId: string,
    assessment: Omit<Assessment, 'id' | 'date' | 'gymId'>
  ): Promise<Assessment> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!user) {
      throw new Error('User not authenticated');
    }

    const newAssessment: Assessment = {
      id: Math.random().toString(36).substring(7),
      gymId,
      date: new Date(),
      ...assessment,
    };

    // In a real app, we would save to a database
    if (!USER_ASSESSMENTS[gymId]) {
      USER_ASSESSMENTS[gymId] = [];
    }
    USER_ASSESSMENTS[gymId].push(newAssessment);

    return newAssessment;
  }

  static async getProgressStats(
    user: User | null,
    gymId: string
  ): Promise<{
    weightChange: number;
    bodyFatChange: number;
    muscleMassChange: number;
    measurementsChange: {
      chest: number;
      waist: number;
      hips: number;
      biceps: number;
      thighs: number;
    };
  }> {
    const assessments = await this.getUserAssessments(user, gymId);
    const latest = assessments[assessments.length - 1];
    const oldest = assessments[0];

    return {
      weightChange: latest.weight - oldest.weight,
      bodyFatChange: latest.bodyFat - oldest.bodyFat,
      muscleMassChange: latest.muscleMass - oldest.muscleMass,
      measurementsChange: {
        chest: latest.measurements.chest - oldest.measurements.chest,
        waist: latest.measurements.waist - oldest.measurements.waist,
        hips: latest.measurements.hips - oldest.measurements.hips,
        biceps: latest.measurements.biceps - oldest.measurements.biceps,
        thighs: latest.measurements.thighs - oldest.measurements.thighs,
      },
    };
  }
}
