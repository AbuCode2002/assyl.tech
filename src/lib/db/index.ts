import "server-only";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationsFolder = path.join(process.cwd(), "drizzle");

/**
 * DATABASE_URL set  -> real PostgreSQL (production, docker-compose, Vercel + Neon).
 * DATABASE_URL unset -> embedded PGlite stored in ./.data/pglite (local dev, no Docker needed).
 * Migrations from ./drizzle are applied on first use.
 */
async function init(): Promise<DB> {
  const url = process.env.DATABASE_URL;

  // Serverless platforms have a read-only file system, so the embedded database cannot work there.
  if (!url && process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is required on Vercel. Create a PostgreSQL database (e.g. neon.tech) and add its pooled connection string to the project environment variables.",
    );
  }

  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    // One connection per serverless instance; prepared statements are off for poolers (pgbouncer).
    const serverless = Boolean(process.env.VERCEL);
    const client = postgres(url, {
      max: Number(process.env.DATABASE_POOL ?? (serverless ? 1 : 10)),
      prepare: !serverless,
      idle_timeout: serverless ? 20 : undefined,
    });
    const db = drizzle(client, { schema, casing: "snake_case" });
    await migrate(db, { migrationsFolder });
    return db as unknown as DB;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder });
  return db as unknown as DB;
}

const globalForDb = globalThis as unknown as { __assylDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  if (!globalForDb.__assylDb) {
    globalForDb.__assylDb = init().catch((err) => {
      globalForDb.__assylDb = undefined;
      throw err;
    });
  }
  return globalForDb.__assylDb;
}

export { schema };
