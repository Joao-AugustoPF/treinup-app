import { Client, Teams } from 'node-appwrite';

// This Appwrite function will be executed every time it's triggered

export default async ({ req, res, log, error }) => {
  // Initialize Appwrite client with Function environment variables
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(req.headers['x-appwrite-key'] || '');

  const teams = new Teams(client);
  const DEFAULT_TEAM_ID = process.env.DEFAULT_TEAM_ID;

  try {
    // Parse the incoming payload
    const { userId } = JSON.parse(req.body || '{}');

    // Create membership directly by userId (server SDK)
    await teams.createMembership(
      DEFAULT_TEAM_ID,
      ['member'], // roles
      undefined, // email
      userId // userId for direct association
    );

    log(`User ${userId} added to team ${DEFAULT_TEAM_ID}`);
    return res.json({ ok: true });
  } catch (err) {
    log('Error in joinDefaultTeam:', err);
    return res.json({
      ok: false,
      message: err.message || 'Erro ao vincular usuário ao time',
    });
  }
};
