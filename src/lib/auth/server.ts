import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS, verifySessionToken } from "./session";

export type CurrentAdmin = Omit<typeof schema.admins.$inferSelect, "passwordHash">;

const DEV_DEFAULT_EMAIL = "admin@assyl.tech";
const DEV_DEFAULT_PASSWORD = "admin12345";

/** True when the dev fallback credentials are in effect (no env vars, not production). */
export function usesDevDefaultCredentials(): boolean {
  return process.env.NODE_ENV !== "production" && !(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export const DEV_DEFAULTS = { email: DEV_DEFAULT_EMAIL, password: DEV_DEFAULT_PASSWORD } as const;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates the first admin when the table is empty:
 * ADMIN_EMAIL + ADMIN_PASSWORD from env, or dev-only defaults outside production.
 * Returns whether at least one admin exists afterwards.
 */
export async function ensureBootstrapAdmin(): Promise<boolean> {
  const db = await getDb();
  const [{ value }] = await db.select({ value: count() }).from(schema.admins);
  if (Number(value) > 0) return true;

  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    if (process.env.NODE_ENV === "production") return false;
    email = DEV_DEFAULT_EMAIL;
    password = DEV_DEFAULT_PASSWORD;
  }

  await db
    .insert(schema.admins)
    .values({ email, name: "Admin", passwordHash: await hashPassword(password) })
    .onConflictDoNothing({ target: schema.admins.email });
  return true;
}

/** Current admin from the session cookie (deduplicated per request). */
export const getAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  if (!/^[0-9a-f-]{36}$/i.test(session.sub)) return null;

  const db = await getDb();
  const [admin] = await db
    .select({
      id: schema.admins.id,
      email: schema.admins.email,
      name: schema.admins.name,
      createdAt: schema.admins.createdAt,
      lastLoginAt: schema.admins.lastLoginAt,
    })
    .from(schema.admins)
    .where(eq(schema.admins.id, session.sub))
    .limit(1);
  return admin ?? null;
});

/** Use in every admin page, layout, server action and route handler. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function setSessionCookie(admin: { id: string; email: string; name: string }) {
  const token = await createSessionToken({ sub: admin.id, email: admin.email, name: admin.name });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
