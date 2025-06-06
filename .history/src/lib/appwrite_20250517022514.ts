import { Client, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('68212810000b9a5c7a3d');

export const appwriteClient = client;
export const appwriteDatabases = new Databases(client);
