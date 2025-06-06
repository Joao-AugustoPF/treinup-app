import { faker } from '@faker-js/faker/locale/pt_BR';
import dotenv from 'dotenv';
import { Client, Databases, ID, Query } from 'node-appwrite';

dotenv.config();

const endpoint = 'http://10.0.0.100/v1';
const projectId = 'treinup';
const apiKey =
  'standard_38511a79c77255a4f71482a2dcce3bbb9a51138b7ad9ddd1735b4075e479623f160d3c72cae5d0aa54e4388e31483d4337a642a723428b3572d13aeef4ff235555f51c5fc5afa1ea7c8ecfe1e737782863fabdc474b4c08894ba0131c6b13df1ba438fcbc5ba1c2673423cb48e18fdd800e9b0ab5a4bfd397b83caee7063a9df';

// Configuração do cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// IDs e constantes
const TENANT_ID = '6821988e0022060185a9';
const MEMBER_PROFILE_ID = '68290d9a000c32f61893';
const DATABASE_ID = 'treinup';
const WORKOUTS_COLLECTION_ID = '682160a30035b21f533a';
const WORKOUT_SETS_COLLECTION_ID = '682276d1003cc08a7b8e';
const EXERCISES_COLLECTION_ID = '68215f730001584f3d04';

// Planos de treino disponíveis
const WORKOUT_PLANS = [
  'Treino A - Peito e Tríceps',
  'Treino B - Costas e Bíceps',
  'Treino C - Pernas',
  'Treino D - Ombros e Abdômen',
  'Treino E - Full Body',
];

// Lista de exercícios de exemplo
const EXAMPLE_EXERCISES = [
  {
    name: 'Supino Reto',
    muscleGroup: 'Peito',
    tutorialUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  },
  {
    name: 'Supino Inclinado',
    muscleGroup: 'Peito',
    tutorialUrl: 'https://www.youtube.com/watch?v=0G2_XV7slIg',
  },
  {
    name: 'Puxada Frontal',
    muscleGroup: 'Costas',
    tutorialUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  },
  {
    name: 'Remada Baixa',
    muscleGroup: 'Costas',
    tutorialUrl: 'https://www.youtube.com/watch?v=G8l_8chR5BE',
  },
  {
    name: 'Agachamento',
    muscleGroup: 'Pernas',
    tutorialUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  },
  {
    name: 'Leg Press',
    muscleGroup: 'Pernas',
    tutorialUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  },
  {
    name: 'Elevação Lateral',
    muscleGroup: 'Ombros',
    tutorialUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  },
  {
    name: 'Desenvolvimento com Halteres',
    muscleGroup: 'Ombros',
    tutorialUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
  },
  {
    name: 'Rosca Direta',
    muscleGroup: 'Bíceps',
    tutorialUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  },
  {
    name: 'Tríceps Pulley',
    muscleGroup: 'Tríceps',
    tutorialUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
  },
  {
    name: 'Abdominal Crunch',
    muscleGroup: 'Abdômen',
    tutorialUrl: 'https://www.youtube.com/watch?v=5ER5Of4MOPI',
  },
  {
    name: 'Prancha',
    muscleGroup: 'Abdômen',
    tutorialUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
  },
  {
    name: 'Stiff',
    muscleGroup: 'Posterior',
    tutorialUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
  },
  {
    name: 'Extensão de Pernas',
    muscleGroup: 'Quadríceps',
    tutorialUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
  },
  {
    name: 'Flexão de Pernas',
    muscleGroup: 'Posterior',
    tutorialUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
  },
];

// Função para obter exercícios existentes
async function getExercises() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      EXERCISES_COLLECTION_ID,
      [Query.equal('tenantId', TENANT_ID)]
    );
    return response.documents;
  } catch (error) {
    console.error('Erro ao buscar exercícios:', error);
    return [];
  }
}

// Função para criar um workout
async function createWorkout(plan: string) {
  try {
    const workout = await databases.createDocument(
      DATABASE_ID,
      WORKOUTS_COLLECTION_ID,
      ID.unique(),
      {
        title: faker.helpers.arrayElement([
          'Treino Matinal',
          'Treino da Tarde',
          'Treino Noturno',
          'Treino Intenso',
          'Treino Recuperativo',
        ]),
        tenantId: TENANT_ID,
        plan: plan,
        memberProfileId: MEMBER_PROFILE_ID,
        imageUrl: faker.image.urlLoremFlickr({ category: 'fitness' }),
      }
    );
    return workout;
  } catch (error) {
    console.error('Erro ao criar workout:', error);
    return null;
  }
}

// Função para criar sets de exercícios para um workout
async function createWorkoutSets(workoutId: string, exercises: any[]) {
  const numExercises = faker.number.int({ min: 4, max: 8 });
  const selectedExercises = faker.helpers.arrayElements(
    exercises,
    numExercises
  );

  for (let i = 0; i < selectedExercises.length; i++) {
    const exercise = selectedExercises[i];
    const numSets = faker.number.int({ min: 3, max: 5 });

    for (let j = 0; j < numSets; j++) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          WORKOUT_SETS_COLLECTION_ID,
          ID.unique(),
          {
            workoutId: workoutId,
            exerciseId: exercise.$id,
            order: i + 1,
            series: numSets,
            reps: faker.number.int({ min: 8, max: 15 }),
            loadKg: faker.number.float({ min: 5, max: 100, fractionDigits: 1 }),
            rest: faker.number.int({ min: 30, max: 90 }),
            imageUrl: faker.image.urlLoremFlickr({ category: 'fitness' }),
          }
        );
      } catch (error) {
        console.error('Erro ao criar set:', error);
      }
    }
  }
}

// Função para criar exercícios de exemplo
async function createExampleExercises() {
  console.log('Criando exercícios de exemplo...');
  const createdExercises = [];

  for (const exercise of EXAMPLE_EXERCISES) {
    try {
      const createdExercise = await databases.createDocument(
        DATABASE_ID,
        EXERCISES_COLLECTION_ID,
        ID.unique(),
        {
          ...exercise,
          tenantId: TENANT_ID,
        }
      );
      createdExercises.push(createdExercise);
      console.log(`Exercício criado: ${exercise.name}`);
    } catch (error) {
      console.error(`Erro ao criar exercício ${exercise.name}:`, error);
    }
  }

  return createdExercises;
}

// Função principal para popular workouts
async function populateWorkouts() {
  try {
    console.log('Buscando exercícios...');
    let exercises = await getExercises();

    if (exercises.length === 0) {
      console.log(
        'Nenhum exercício encontrado. Criando exercícios de exemplo...'
      );
      exercises = await createExampleExercises();

      if (exercises.length === 0) {
        console.error(
          'Não foi possível criar exercícios de exemplo. Abortando...'
        );
        return;
      }
    }

    console.log(`${exercises.length} exercícios encontrados.`);

    // Criar workouts para cada plano
    for (const plan of WORKOUT_PLANS) {
      console.log(`Criando workout para o plano: ${plan}`);
      const workout = await createWorkout(plan);

      if (workout) {
        console.log(`Criando sets para o workout: ${workout.$id}`);
        await createWorkoutSets(workout.$id, exercises);
      }
    }

    console.log('Workouts criados com sucesso!');
  } catch (error) {
    console.error('Erro ao popular workouts:', error);
  }
}

// Executar o script
populateWorkouts();
