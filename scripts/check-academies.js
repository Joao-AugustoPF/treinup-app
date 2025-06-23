const { Client, Databases } = require('node-appwrite');

const endpoint = 'http://10.0.0.100/v1';
const projectId = 'treinup';
const apiKey = 'standard_38511a79c77255a4f71482a2dcce3bbb9a51138b7ad9ddd1735b4075e479623f160d3c72cae5d0aa54e4388e31483d4337a642a723428b3572d13aeef4ff235555f51c5fc5afa1ea7c8ecfe1e737782863fabdc474b4c08894ba0131c6b13df1ba438fcbc5ba1c2673423cb48e18fdd800e9b0ab5a4bfd397b83caee7063a9df';

// Configuração do cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// IDs e constantes
const DATABASE_ID = 'treinup';
const ACADEMIES_COLLECTION_ID = 'academies';

// Função para verificar academias
async function checkAcademies() {
  try {
    console.log('Verificando academias cadastradas...');
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      ACADEMIES_COLLECTION_ID
    );

    console.log(`Total de academias encontradas: ${response.documents.length}`);
    
    if (response.documents.length > 0) {
      response.documents.forEach((academy, index) => {
        console.log(`\nAcademia ${index + 1}:`);
        console.log(`  ID: ${academy.$id}`);
        console.log(`  Nome: ${academy.name}`);
        console.log(`  Telefone: ${academy.phone || 'Não informado'}`);
        console.log(`  Tenant ID: ${academy.tenantId}`);
        console.log(`  Endereço: ${academy.addressStreet}, ${academy.addressCity} - ${academy.addressState}`);
      });
    } else {
      console.log('Nenhuma academia encontrada. Criando academia padrão...');
      
      // Criar academia padrão
      const defaultAcademy = await databases.createDocument(
        DATABASE_ID,
        ACADEMIES_COLLECTION_ID,
        'unique()',
        {
          name: 'Lidiane Moretto - Estúdio Personal',
          slug: 'lidiane-moretto-estudio-personal',
          addressStreet: 'Rua Exemplo, 123',
          addressCity: 'São Paulo',
          addressState: 'SP',
          addressZip: '01234-567',
          phone: '(11) 99999-9999',
          paymentGateway: 'mercadoPago',
          tenantId: '6821988e0022060185a9',
        }
      );

      console.log('Academia padrão criada com sucesso:', defaultAcademy);
    }
  } catch (error) {
    console.error('Erro ao verificar academias:', error);
  }
}

// Executar verificação
checkAcademies(); 