import { ID, Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  PROFILES_COLLECTION_ID,
} from '../api/appwrite-client';

// Collection IDs
const METRICS_COLLECTION_ID = '682166bf001a71427a38';

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

// ID do tenant padrão (time)
export const DEFAULT_TENANT_ID = '6821988e0022060185a9';

// ID da academia no sistema
export const DEFAULT_GYM_ID = '1';

export class ProgressService {
  /**
   * Obtém o perfil do usuário pelo ID
   * @param userId ID do usuário
   * @returns Perfil do usuário
   */
  private static async getUserProfile(userId: string) {
    try {
      const profiles = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (profiles.documents.length === 0) {
        throw new Error('Perfil não encontrado');
      }

      return profiles.documents[0];
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas do usuário para uma academia específica
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @returns Lista de métricas do usuário
   */
  static async getUserMetrics(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID
  ): Promise<Metric[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // 1. Buscar o perfil do usuário
      console.log('Buscando perfil do usuário...');
      console.log('user.id:', user.$id);

      const profile = await this.getUserProfile(user.$id);
      console.log('Perfil encontrado:', profile);
      const profileId = profile.$id;

      // 2. Buscar métricas associadas ao perfil
      const metrics = await db.listDocuments(
        DATABASE_ID,
        METRICS_COLLECTION_ID,
        [
          Query.equal('memberProfileId', profileId),
          Query.equal('tenantId', DEFAULT_TENANT_ID),
          Query.orderAsc('recordedAt'),
        ]
      );

      // 3. Converter documentos para o formato da aplicação
      return metrics.documents.map((doc) => ({
        id: doc.$id,
        type: doc.type as MetricType,
        value: doc.value,
        recordedAt: new Date(doc.recordedAt),
        tenantId: doc.tenantId,
      }));
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas agrupadas por data
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @returns Lista de grupos de métricas por data
   */
  static async getMetricsByDate(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID
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

  /**
   * Adiciona uma métrica para o usuário
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @param metric Dados da métrica a ser adicionada
   * @returns Métrica adicionada
   */
  static async addMetric(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID,
    metric: Omit<Metric, 'id' | 'recordedAt' | 'tenantId'>
  ): Promise<Metric> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // 1. Buscar o perfil do usuário
      const profile = await this.getUserProfile(user.id);
      const profileId = profile.$id;

      // 2. Criar documento de métrica
      const newMetric = await db.createDocument(
        DATABASE_ID,
        METRICS_COLLECTION_ID,
        ID.unique(),
        {
          type: metric.type,
          value: metric.value,
          recordedAt: new Date().toISOString(),
          tenantId: DEFAULT_TENANT_ID,
          memberProfileId: profileId,
        }
      );

      // 3. Converter e retornar a métrica criada
      return {
        id: newMetric.$id,
        type: newMetric.type as MetricType,
        value: newMetric.value,
        recordedAt: new Date(newMetric.recordedAt),
        tenantId: newMetric.tenantId,
      };
    } catch (error) {
      console.error('Erro ao adicionar métrica:', error);
      throw error;
    }
  }

  /**
   * Obtém as métricas mais recentes do usuário
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @returns Record com as métricas mais recentes por tipo
   */
  static async getLatestMetrics(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID
  ): Promise<Record<MetricType, number | undefined>> {
    const metricGroups = await this.getMetricsByDate(user, gymId);
    return metricGroups.length > 0
      ? metricGroups[metricGroups.length - 1].metrics
      : ({} as Record<MetricType, number | undefined>);
  }

  /**
   * Adiciona um lote de métricas para o usuário
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @param metrics Array de métricas a serem adicionadas
   * @returns Array de métricas adicionadas
   */
  static async addMetricBatch(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID,
    metrics: Omit<Metric, 'id' | 'recordedAt' | 'tenantId'>[]
  ): Promise<Metric[]> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // 1. Buscar o perfil do usuário
      const profile = await this.getUserProfile(user.id);
      const profileId = profile.$id;

      // 2. Criar documentos de métricas em lote
      const newMetrics = await Promise.all(
        metrics.map((metric) =>
          db.createDocument(DATABASE_ID, METRICS_COLLECTION_ID, ID.unique(), {
            type: metric.type,
            value: metric.value,
            recordedAt: new Date().toISOString(),
            tenantId: DEFAULT_TENANT_ID,
            memberProfileId: profileId,
          })
        )
      );

      // 3. Converter e retornar as métricas criadas
      return newMetrics.map((doc) => ({
        id: doc.$id,
        type: doc.type as MetricType,
        value: doc.value,
        recordedAt: new Date(doc.recordedAt),
        tenantId: doc.tenantId,
      }));
    } catch (error) {
      console.error('Erro ao adicionar métricas em lote:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de progresso do usuário
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @returns Objeto com estatísticas de progresso
   */
  static async getProgressStats(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID
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

  /**
   * Método temporário para compatibilidade com a versão antiga
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @returns Lista de avaliações no formato antigo
   */
  static async getUserAssessments(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID
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

  /**
   * Método temporário para compatibilidade com a versão antiga
   * @param user Usuário logado
   * @param gymId ID da academia (opcional, usa DEFAULT_GYM_ID por padrão)
   * @returns A avaliação mais recente no formato antigo
   */
  static async getLatestAssessment(
    user: any | null,
    gymId: string = DEFAULT_GYM_ID
  ): Promise<Assessment> {
    const assessments = await this.getUserAssessments(user, gymId);
    if (assessments.length === 0) {
      throw new Error('No assessments found');
    }
    return assessments[assessments.length - 1];
  }
}

/*
 * EXEMPLO DE IMPLEMENTAÇÃO REAL COM APPWRITE
 *
 * Abaixo está um exemplo de como seria a implementação real utilizando
 * o SDK do Appwrite. Este código é um guia para quando for implementar
 * a versão real que se conecta ao Appwrite.
 */

/*
// Importações do Appwrite
import { Client, Databases, ID, Query } from 'appwrite';

// Configurações do Appwrite
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('68212810000b9a5c7a3d'); // TreinUP - Backend
const databases = new Databases(client);

// IDs das coleções
const DATABASE_ID = 'treinup';
const METRICS_COLLECTION_ID = '682166bf001a71427a38';
const PROFILES_COLLECTION_ID = '682161970028be4664f2';

export class AppwriteProgressService {
  // Obter o perfil do usuário pelo ID
  static async getUserProfile(userId: string) {
    try {
      const profiles = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (profiles.documents.length === 0) {
        throw new Error('Perfil não encontrado');
      }

      return profiles.documents[0];
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  // Obter métricas do usuário
  static async getUserMetrics(userId: string) {
    try {
      // 1. Buscar o perfil do usuário
      const profile = await this.getUserProfile(userId);
      const profileId = profile.$id;

      // 2. Buscar métricas associadas ao perfil
      const metrics = await databases.listDocuments(
        DATABASE_ID,
        METRICS_COLLECTION_ID,
        [
          Query.equal('memberProfileId', profileId),
          Query.equal('tenantId', DEFAULT_TENANT_ID),
          Query.orderAsc('recordedAt')
        ]
      );

      // 3. Converter documentos para o formato da aplicação
      return metrics.documents.map(doc => ({
        id: doc.$id,
        type: doc.type as MetricType,
        value: doc.value,
        recordedAt: new Date(doc.recordedAt),
        tenantId: doc.tenantId
      }));
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      throw error;
    }
  }

  // Adicionar uma métrica
  static async addMetric(userId: string, metric: Omit<Metric, 'id' | 'recordedAt' | 'tenantId'>) {
    try {
      // 1. Buscar o perfil do usuário
      const profile = await this.getUserProfile(userId);
      const profileId = profile.$id;

      // 2. Criar documento de métrica
      const newMetric = await databases.createDocument(
        DATABASE_ID,
        METRICS_COLLECTION_ID,
        ID.unique(),
        {
          type: metric.type,
          value: metric.value,
          recordedAt: new Date().toISOString(),
          tenantId: DEFAULT_TENANT_ID,
          memberProfileId: profileId
        }
      );

      // 3. Converter e retornar a métrica criada
      return {
        id: newMetric.$id,
        type: newMetric.type as MetricType,
        value: newMetric.value,
        recordedAt: new Date(newMetric.recordedAt),
        tenantId: newMetric.tenantId
      };
    } catch (error) {
      console.error('Erro ao adicionar métrica:', error);
      throw error;
    }
  }
}
*/
