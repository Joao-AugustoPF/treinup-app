import { Client, Account, Teams, Databases, Functions, ID } from 'appwrite';

// Initialize Appwrite client
export const client = new Client()
  .setEndpoint(
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
  )
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

// Initialize Appwrite services
export const account = new Account(client);
export const teamsApi = new Teams(client);
export const db = new Databases(client);
export const functions = new Functions(client);

// Database and collection IDs
export const DATABASE_ID = 'main';
export const WORKOUTS_COLLECTION_ID = 'workouts';

// Helper function to create team permissions
export const createTeamPermissions = (teamId: string) => [
  `read("team:${teamId}")`,
  `update("team:${teamId}:owner")`,
];

// Helper function to create a new workout document
export const createWorkoutDocument = async (teamId: string, data: any) => {
  return await db.createDocument(
    DATABASE_ID,
    WORKOUTS_COLLECTION_ID,
    ID.unique(),
    data,
    createTeamPermissions(teamId)
  );
};
