import dotenv from 'dotenv';
import { Client, Databases, ID } from 'node-appwrite';

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
const PLANS_COLLECTION_ID = 'plans';
const SUBSCRIPTIONS_COLLECTION_ID = 'subscriptions';

// Função para criar um plano
async function createPlan() {
  try {
    const plan = await databases.createDocument(
      DATABASE_ID,
      PLANS_COLLECTION_ID,
      ID.unique(),
      {
        name: 'Plano Mensal - Treinamento Personalizado',
        durationDays: 30,
        price: 299.90,
        tenantId: TENANT_ID,
      }
    );

    console.log('Plano criado com sucesso:', plan);

    // Criar uma assinatura para o perfil
    const subscription = await databases.createDocument(
      DATABASE_ID,
      SUBSCRIPTIONS_COLLECTION_ID,
      ID.unique(),
      {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias a partir de hoje
        isActive: true,
        profileId: MEMBER_PROFILE_ID,
        planId: plan.$id,
        tenantId: TENANT_ID,
      }
    );

    console.log('Assinatura criada com sucesso:', subscription);

    return { plan, subscription };
  } catch (error) {
    console.error('Erro ao criar plano ou assinatura:', error);
    return null;
  }
}

// Executar o script
createPlan(); 