import { faker } from '@faker-js/faker/locale/pt_BR';
import dotenv from 'dotenv';
import { Client, Databases, ID } from 'node-appwrite';

dotenv.config();

const endpoint = 'http://192.168.1.61/v1';
const projectId = 'treinup';
const apiKey =
  'standard_38511a79c77255a4f71482a2dcce3bbb9a51138b7ad9ddd1735b4075e479623f160d3c72cae5d0aa54e4388e31483d4337a642a723428b3572d13aeef4ff235555f51c5fc5afa1ea7c8ecfe1e737782863fabdc474b4c08894ba0131c6b13df1ba438fcbc5ba1c2673423cb48e18fdd800e9b0ab5a4bfd397b83caee7063a9df';

// Configuração do cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey); // Substitua pela sua API key

const databases = new Databases(client);

// ID do usuário para o qual vamos criar as métricas
const MEMBER_PROFILE_ID = '68419a8900071fef06d7'; // Substitua pelo ID do perfil do usuário
const TENANT_ID = '6821988e0022060185a9'; // ID do tenant "Lidiane Moretto - Estúdio Personal"

// Tipos de métricas disponíveis
const METRIC_TYPES = [
  'weight',
  'body_fat_pct',
  'lean_mass_pct',
  'bmi',
  'muscle_mass',
  'bone_mass',
  'body_water_pct',
  'bmr',
  'metabolic_age',
  'visceral_fat',
  'waist_circ',
  'hip_circ',
  'wh_ratio',
  'chest_circ',
  'arm_circ',
  'thigh_circ',
  'calf_circ',
  'rest_hr',
  'bp_systolic',
  'bp_diastolic',
  'vo2max',
  'height',
  'body_temp',
];

// Função para gerar um valor aleatório para cada tipo de métrica
function generateRandomValue(type: string): number {
  switch (type) {
    case 'weight':
      return faker.number.float({ min: 50, max: 120, fractionDigits: 1 });
    case 'body_fat_pct':
      return faker.number.float({ min: 5, max: 40, fractionDigits: 1 });
    case 'lean_mass_pct':
      return faker.number.float({ min: 60, max: 95, fractionDigits: 1 });
    case 'bmi':
      return faker.number.float({ min: 18.5, max: 35, fractionDigits: 1 });
    case 'muscle_mass':
      return faker.number.float({ min: 30, max: 50, fractionDigits: 1 });
    case 'bone_mass':
      return faker.number.float({ min: 2, max: 5, fractionDigits: 1 });
    case 'body_water_pct':
      return faker.number.float({ min: 45, max: 65, fractionDigits: 1 });
    case 'bmr':
      return faker.number.float({ min: 1200, max: 2500, fractionDigits: 0 });
    case 'metabolic_age':
      return faker.number.int({ min: 20, max: 60 });
    case 'visceral_fat':
      return faker.number.int({ min: 1, max: 20 });
    case 'waist_circ':
      return faker.number.float({ min: 60, max: 120, fractionDigits: 1 });
    case 'hip_circ':
      return faker.number.float({ min: 80, max: 140, fractionDigits: 1 });
    case 'wh_ratio':
      return faker.number.float({ min: 0.6, max: 1.2, fractionDigits: 2 });
    case 'chest_circ':
      return faker.number.float({ min: 80, max: 140, fractionDigits: 1 });
    case 'arm_circ':
      return faker.number.float({ min: 25, max: 45, fractionDigits: 1 });
    case 'thigh_circ':
      return faker.number.float({ min: 40, max: 80, fractionDigits: 1 });
    case 'calf_circ':
      return faker.number.float({ min: 30, max: 50, fractionDigits: 1 });
    case 'rest_hr':
      return faker.number.int({ min: 50, max: 100 });
    case 'bp_systolic':
      return faker.number.int({ min: 90, max: 140 });
    case 'bp_diastolic':
      return faker.number.int({ min: 60, max: 90 });
    case 'vo2max':
      return faker.number.float({ min: 20, max: 60, fractionDigits: 1 });
    case 'height':
      return faker.number.float({ min: 150, max: 200, fractionDigits: 1 });
    case 'body_temp':
      return faker.number.float({ min: 36.1, max: 37.2, fractionDigits: 1 });
    default:
      return 0;
  }
}

// Função para gerar uma data aleatória nos últimos 6 meses
function generateRandomDate(): string {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  return faker.date.between({ from: start, to: end }).toISOString();
}

// Função principal para criar métricas
async function createMetrics() {
  try {
    // Criar 10 registros de métricas
    for (let i = 0; i < 10; i++) {
      const date = generateRandomDate();

      // Para cada data, criar várias métricas diferentes
      for (const type of METRIC_TYPES) {
        const value = generateRandomValue(type);

        await databases.createDocument(
          'treinup',
          '682166bf001a71427a38', // ID da coleção Metrics
          ID.unique(),
          {
            value,
            type,
            recordedAt: date,
            tenantId: TENANT_ID,
            memberProfileId: MEMBER_PROFILE_ID,
            evaluationBookings: '683760560017aeb41324'
            // userId: MEMBER_USER_ID,
          }
        );

        console.log(`Created metric: ${type} = ${value} at ${date}`);
      }
    }

    console.log('All metrics created successfully!');
  } catch (error) {
    console.error('Error creating metrics:', error);
  }
}

// Executar o script
createMetrics();
