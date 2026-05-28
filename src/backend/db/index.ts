import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase provides a direct Postgres connection string
// Use the "Transaction" pool mode URL from Supabase dashboard → Settings → Database
const connectionString = process.env.DATABASE_URL!;

declare global {
  var postgresClient: postgres.Sql | undefined;
}

const client = globalThis.postgresClient ?? postgres(connectionString, { 
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 10 : 2, // Fix connection exhaustion in dev
  idle_timeout: 20, // Close idle connections quickly
});
if (process.env.NODE_ENV !== "production") {
  globalThis.postgresClient = client;
}

export const db = drizzle(client, { schema });
