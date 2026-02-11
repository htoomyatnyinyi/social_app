import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("social_app.db");
export const db = drizzle(expoDb, { schema });

// Helper to reset DB (for dev only)
export const resetDb = async () => {
  // Implement if needed for dev
  // await expoDb.execAsync(
  //   "DROP TABLE IF EXISTS messages; DROP TABLE IF EXISTS chats;",
  // );
};
