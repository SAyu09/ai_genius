import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "aws-1-ap-south-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: "postgres.ggfoeekvtjqagjkvqmhc",
    password: "AISellGet09",
    ssl: true,
  },
} satisfies Config;
