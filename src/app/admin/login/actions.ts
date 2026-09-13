"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureBootstrapAdmin, setSessionCookie, verifyPassword } from "@/lib/auth/server";
import { getDb, schema } from "@/lib/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { getClientIp, hashIp } from "@/lib/server/request-info";

export type LoginState = { error?: string; email?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(200),
  password: z.string().min(1).max(200),
  next: z.string().max(500).optional(),
});

function safeNext(next: string | undefined): string {
  if (!next) return "/admin";
  if (!next.startsWith("/admin") || next.startsWith("/admin/login") || next.includes("\\") || next.includes("//")) {
    return "/admin";
  }
  return next;
}

// A valid bcrypt hash used to keep timing similar when the email is unknown.
const DUMMY_HASH = "$2b$10$k0LhavF66qG/YjlL6MUdz.kFQUZZ8wy17GJNRhA5XbntQCPCxSjMC";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  if (!parsed.success) return { error: "Введите email и пароль", email };

  const ip = getClientIp(await headers());
  if (!rateLimit(`admin-login:${hashIp(ip) ?? "unknown"}`, 5, 10 * 60_000)) {
    return { error: "Слишком много попыток. Попробуйте через 10 минут.", email };
  }

  const hasAdmin = await ensureBootstrapAdmin();
  if (!hasAdmin) {
    return { error: "Администратор не настроен: задайте ADMIN_EMAIL и ADMIN_PASSWORD", email };
  }

  const db = await getDb();
  const [admin] = await db.select().from(schema.admins).where(eq(schema.admins.email, parsed.data.email)).limit(1);
  const ok = await verifyPassword(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) return { error: "Неверный email или пароль", email };

  await db.update(schema.admins).set({ lastLoginAt: new Date() }).where(eq(schema.admins.id, admin.id));
  await setSessionCookie(admin);
  redirect(safeNext(parsed.data.next));
}
