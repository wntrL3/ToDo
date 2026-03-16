import { Client, Users, Databases } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const users = new Users(client);
export const databases = new Databases(client); 
export const DB_ID = process.env.APPWRITE_DATABASE_ID!;
export const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID!;