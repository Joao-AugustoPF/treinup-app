import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

export default async ({ req, res, log }) => {
  // Inicializa o client Appwrite com as variáveis de ambiente
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(req.headers['x-appwrite-key'] || '');

  const db = new Databases(client);
  const DATABASE_ID   = process.env.PROFILE_DATABASE_ID;
  const COLLECTION_ID = process.env.PROFILE_COLLECTION_ID;
  const DEFAULT_TEAM  = process.env.DEFAULT_TEAM_ID;

  try {
    // body esperado: { userId: string, name: string, email: string }
    const { userId, name, email, role } = JSON.parse(req.body || '{}');

    if (!userId || !name || !email || !role) {
      throw new Error('Payload inválido: userId, name, email e role são obrigatórios.');
    }

    // Cria o documento de profile na collection "profiles"
    const profile = await db.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      { userId, name, email, role },
      [
        // só membros da academia enxergam o profile
        Permission.read(Role.team(DEFAULT_TEAM)),
        // OWNER e TRAINER podem atualizar ou deletar, se necessário
        Permission.update(Role.team(DEFAULT_TEAM, 'OWNER')),
        Permission.update(Role.team(DEFAULT_TEAM, 'TRAINER')),
        Permission.delete(Role.team(DEFAULT_TEAM, 'OWNER')),
      ]
    );

    log(`Profile criado: ${profile.$id} para user ${userId}`);
    return res.json({ ok: true, profileId: profile.$id });
  } catch (err) {
    log('Erro em createProfile:', err);
    return res.status(400).json({
      ok: false,
      message: err.message || 'Erro ao criar profile',
    });
  }
};
