export type MetricType =
  | 'weight'
  | 'body_fat_pct'
  | 'lean_mass_pct'
  | 'bmi'
  | 'muscle_mass'
  | 'bone_mass'
  | 'body_water_pct'
  | 'bmr'
  | 'metabolic_age'
  | 'visceral_fat'
  | 'waist_circ'
  | 'hip_circ'
  | 'wh_ratio'
  | 'chest_circ'
  | 'arm_circ'
  | 'thigh_circ'
  | 'calf_circ'
  | 'rest_hr'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'vo2max'
  | 'height'
  | 'body_temp';

export type Metric = {
  id: string;
  value: number;
  type: MetricType;
  recordedAt: Date;
  tenantId: string;
};

export type MetricGroup = {
  date: Date;
  metrics: Record<MetricType, number | undefined>;
};

// Tipo antigo, mantido para compatibilidade temporária
export type Assessment = {
  id: string;
  gymId: string;
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

// ID do time padrão do Appwrite para ser usado como tenantId
export const DEFAULT_TENANT_ID = '6821988e0022060185a9'; // Lidiane Moretto - Estúdio Personal

// Dados simulados para diferentes academias
const USER_METRICS: Record<string, Metric[]> = {
  '6822c139dcce804a0582': [
    // Dados de 90 dias atrás
    {
      id: '1',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'weight',
      value: 75,
    },
    {
      id: '2',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'height',
      value: 175,
    },
    {
      id: '3',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'body_fat_pct',
      value: 18,
    },
    {
      id: '4',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'muscle_mass',
      value: 35,
    },
    {
      id: '5',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'bmi',
      value: 24.5,
    },
    {
      id: '6',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'chest_circ',
      value: 95,
    },
    {
      id: '7',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'waist_circ',
      value: 82,
    },
    {
      id: '8',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'hip_circ',
      value: 98,
    },
    {
      id: '9',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'arm_circ',
      value: 32,
    },
    {
      id: '10',
      tenantId: '1',
      recordedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      type: 'thigh_circ',
      value: 55,
    },

    // Dados atuais
    {
      id: '11',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'weight',
      value: 73,
    },
    {
      id: '12',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'height',
      value: 175,
    },
    {
      id: '13',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'body_fat_pct',
      value: 16,
    },
    {
      id: '14',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'muscle_mass',
      value: 36,
    },
    {
      id: '15',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'bmi',
      value: 23.8,
    },
    {
      id: '16',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'chest_circ',
      value: 96,
    },
    {
      id: '17',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'waist_circ',
      value: 80,
    },
    {
      id: '18',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'hip_circ',
      value: 97,
    },
    {
      id: '19',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'arm_circ',
      value: 33,
    },
    {
      id: '20',
      tenantId: '1',
      recordedAt: new Date(),
      type: 'thigh_circ',
      value: 56,
    },
  ],
  '2': [
    // PowerHouse Gym metrics
    {
      id: '21',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'weight',
      value: 80,
    },
    {
      id: '22',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'height',
      value: 180,
    },
    {
      id: '23',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'body_fat_pct',
      value: 15,
    },
    {
      id: '24',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'muscle_mass',
      value: 40,
    },
    {
      id: '25',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'bmi',
      value: 24.7,
    },
    {
      id: '26',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'chest_circ',
      value: 100,
    },
    {
      id: '27',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'waist_circ',
      value: 85,
    },
    {
      id: '28',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'hip_circ',
      value: 100,
    },
    {
      id: '29',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'arm_circ',
      value: 35,
    },
    {
      id: '30',
      tenantId: '2',
      recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'thigh_circ',
      value: 60,
    },
  ],
};

export class ProgressService {
  static async getUserMetrics(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID
  ): Promise<Metric[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Return metrics specific to the selected gym
    return USER_METRICS[gymId] || [];
  }

  static async getMetricsByDate(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID
  ): Promise<MetricGroup[]> {
    const metrics = await this.getUserMetrics(user, gymId);

    // Agrupar métricas por data
    const metricsByDate = new Map<string, MetricGroup>();

    metrics.forEach((metric) => {
      const dateKey = metric.recordedAt.toISOString().split('T')[0];

      if (!metricsByDate.has(dateKey)) {
        metricsByDate.set(dateKey, {
          date: metric.recordedAt,
          metrics: {} as Record<MetricType, number | undefined>,
        });
      }

      const group = metricsByDate.get(dateKey)!;
      group.metrics[metric.type] = metric.value;
    });

    // Converter o mapa em array e ordenar por data
    return Array.from(metricsByDate.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }

  static async getLatestMetrics(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID
  ): Promise<Record<MetricType, number | undefined>> {
    const metricGroups = await this.getMetricsByDate(user, gymId);
    return metricGroups.length > 0
      ? metricGroups[metricGroups.length - 1].metrics
      : ({} as Record<MetricType, number | undefined>);
  }

  static async addMetric(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID,
    metric: Omit<Metric, 'id' | 'recordedAt' | 'tenantId'>
  ): Promise<Metric> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!user) {
      throw new Error('User not authenticated');
    }

    const newMetric: Metric = {
      id: Math.random().toString(36).substring(7),
      tenantId: gymId,
      recordedAt: new Date(),
      ...metric,
    };

    // In a real app, we would save to a database
    if (!USER_METRICS[gymId]) {
      USER_METRICS[gymId] = [];
    }
    USER_METRICS[gymId].push(newMetric);

    return newMetric;
  }

  static async addMetricBatch(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID,
    metrics: Omit<Metric, 'id' | 'recordedAt' | 'tenantId'>[]
  ): Promise<Metric[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!user) {
      throw new Error('User not authenticated');
    }

    const newMetrics: Metric[] = metrics.map((metric) => ({
      id: Math.random().toString(36).substring(7),
      tenantId: gymId,
      recordedAt: new Date(),
      ...metric,
    }));

    // In a real app, we would save to a database
    if (!USER_METRICS[gymId]) {
      USER_METRICS[gymId] = [];
    }
    USER_METRICS[gymId].push(...newMetrics);

    return newMetrics;
  }

  static async getProgressStats(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID
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
    const metricGroups = await this.getMetricsByDate(user, gymId);

    if (metricGroups.length < 2) {
      return {
        weightChange: 0,
        bodyFatChange: 0,
        muscleMassChange: 0,
        measurementsChange: {
          chest: 0,
          waist: 0,
          hips: 0,
          biceps: 0,
          thighs: 0,
        },
      };
    }

    const latest = metricGroups[metricGroups.length - 1].metrics;
    const oldest = metricGroups[0].metrics;

    return {
      weightChange: (latest.weight ?? 0) - (oldest.weight ?? 0),
      bodyFatChange: (latest.body_fat_pct ?? 0) - (oldest.body_fat_pct ?? 0),
      muscleMassChange: (latest.muscle_mass ?? 0) - (oldest.muscle_mass ?? 0),
      measurementsChange: {
        chest: (latest.chest_circ ?? 0) - (oldest.chest_circ ?? 0),
        waist: (latest.waist_circ ?? 0) - (oldest.waist_circ ?? 0),
        hips: (latest.hip_circ ?? 0) - (oldest.hip_circ ?? 0),
        biceps: (latest.arm_circ ?? 0) - (oldest.arm_circ ?? 0),
        thighs: (latest.thigh_circ ?? 0) - (oldest.thigh_circ ?? 0),
      },
    };
  }

  // Método temporário para compatibilidade
  static async getUserAssessments(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID
  ): Promise<Assessment[]> {
    const metricGroups = await this.getMetricsByDate(user, gymId);

    return metricGroups.map((group, index) => {
      const metrics = group.metrics;
      return {
        id: index.toString(),
        gymId,
        date: group.date,
        weight: metrics.weight ?? 0,
        height: metrics.height ?? 0,
        bodyFat: metrics.body_fat_pct ?? 0,
        muscleMass: metrics.muscle_mass ?? 0,
        bmi: metrics.bmi ?? 0,
        measurements: {
          chest: metrics.chest_circ ?? 0,
          waist: metrics.waist_circ ?? 0,
          hips: metrics.hip_circ ?? 0,
          biceps: metrics.arm_circ ?? 0,
          thighs: metrics.thigh_circ ?? 0,
        },
      };
    });
  }

  static async getLatestAssessment(
    user: any | null,
    gymId: string = DEFAULT_TENANT_ID
  ): Promise<Assessment> {
    const assessments = await this.getUserAssessments(user, gymId);
    if (assessments.length === 0) {
      throw new Error('No assessments found');
    }
    return assessments[assessments.length - 1];
  }
}
