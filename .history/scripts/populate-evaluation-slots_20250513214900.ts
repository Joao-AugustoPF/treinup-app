import { faker } from '@faker-js/faker/locale/pt_BR';
import dotenv from 'dotenv';
import { Client, Databases, ID, Query } from 'node-appwrite';

dotenv.config();

const endpoint = 'http://10.0.0.100:7001/v1';
const projectId = '68212810000b9a5c7a3d';
const apiKey =
  'standard_f41dea63f205830f50a4498b35cec7299e406af25e8a2bbd68ad535be014399bb57d702ee1fa93242909e5b40bbfe6289795361af9f2b6d22834466973b89b6c9749ed79f7fbfef3de1ea721f49bc6cc75b8c631793758624de14198f802c8cc9ae4522d3a5b08a1c036f68fc12b3420b2c1ecc7c4eccb732b41becdfda95b42';

// Configuração do cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// ID do tenant "Lidiane Moretto - Estúdio Personal"
const TENANT_ID = '6821988e0022060185a9';

// Coleções e Database IDs
const DATABASE_ID = 'treinup';
const EVALUATION_SLOTS_COLLECTION_ID = '68227a80001b40eaaaec';
const PROFILES_COLLECTION_ID = '682161970028be4664f2';

// Locais para avaliações
const LOCATIONS = [
  'Sala de Avaliação 1',
  'Sala de Avaliação 2',
  'Consultório Principal',
];

// Horários disponíveis durante o dia
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

// Função para gerar slots pelos próximos dias
async function generateSlotsForNextDays(
  numberOfDays: number,
  trainerIds: string[]
) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  for (let day = 1; day <= numberOfDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    // Pular finais de semana
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue; // Pular sábado (6) e domingo (0)
    }

    console.log(`Gerando slots para ${currentDate.toLocaleDateString()}`);

    // Gerar slots para cada treinador neste dia
    for (const trainerId of trainerIds) {
      // Selecionar slots aleatórios para este treinador (não disponível em todos os horários)
      const availableSlots = faker.helpers.arrayElements(
        TIME_SLOTS,
        faker.number.int({ min: 3, max: TIME_SLOTS.length })
      );

      for (const timeSlot of availableSlots) {
        const [hours, minutes] = timeSlot.split(':').map(Number);

        const slotStart = new Date(currentDate);
        slotStart.setHours(hours, minutes, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 50); // Slots de 50 minutos

        const location = faker.helpers.arrayElement(LOCATIONS);

        try {
          await databases.createDocument(
            DATABASE_ID,
            EVALUATION_SLOTS_COLLECTION_ID,
            ID.unique(),
            {
              tenantId: TENANT_ID,
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              location: location,
              trainerProfileId: trainerId,
            }
          );

          console.log(
            `Criado slot: ${slotStart.toLocaleTimeString()} - Treinador: ${trainerId}`
          );
        } catch (error) {
          console.error('Erro ao criar slot:', error);
        }
      }
    }
  }
}

// Função principal para obter treinadores e criar slots
async function populateEvaluationSlots() {
  try {
    // Obter todos os treinadores
    console.log('Buscando treinadores...');
    const trainersResponse = await databases.listDocuments(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      [Query.equal('role', 'TRAINER')]
    );

    if (trainersResponse.documents.length === 0) {
      console.log(
        'Nenhum treinador encontrado. Criando um treinador de exemplo...'
      );

      // Criar um treinador de exemplo se não existir nenhum
      const trainerName = 'Carlos Trainer';
      const trainerDoc = await databases.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        ID.unique(),
        {
          name: trainerName,
          role: 'TRAINER',
          userId: ID.unique(),
          email: `${trainerName.toLowerCase().replace(' ', '.')}@example.com`,
          tenantId: TENANT_ID,
        }
      );

      const trainerIds = [trainerDoc.$id];
      console.log(`Treinador criado com ID: ${trainerDoc.$id}`);

      // Gerar slots para os próximos 30 dias
      await generateSlotsForNextDays(30, trainerIds);
    } else {
      // Extrair IDs dos treinadores
      const trainerIds = trainersResponse.documents.map((doc) => doc.$id);
      console.log(`${trainerIds.length} treinadores encontrados.`);

      // Gerar slots para os próximos 30 dias
      await generateSlotsForNextDays(30, trainerIds);
    }

    console.log('Slots de avaliação criados com sucesso!');
  } catch (error) {
    console.error('Erro ao popular slots de avaliação:', error);
  }
}

// Executar o script
populateEvaluationSlots();
