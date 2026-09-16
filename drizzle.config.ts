import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  // Migrations run over a direct connection: Neon exposes DATABASE_URL_UNPOOLED next to the pooled one,
  // and DDL through a transaction-mode pooler is unreliable.
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/assyl",
  },
});
