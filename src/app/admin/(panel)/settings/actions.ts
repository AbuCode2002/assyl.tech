"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth/server";
import { getDb, schema } from "@/lib/db";
import { getSetting, setSetting, type TelegramSettings } from "@/lib/server/settings";
import { sendTelegram } from "@/lib/server/telegram";
import { generateDemoData, removeDemoData } from "@/lib/admin/demo";
import { isUuid } from "@/lib/admin/queries";

export type FormState = { ok?: boolean; message?: string; error?: string } | undefined;

function readTelegram(formData: FormData): TelegramSettings {
  return {
    botToken: String(formData.get("botToken") ?? "").trim(),
    chatId: String(formData.get("chatId") ?? "").trim(),
    enabled: formData.get("enabled") === "on",
  };
}

function validateTelegram(cfg: TelegramSettings): string | null {
  if (cfg.botToken && !/^\d{5,}:[\w-]{20,}$/.test(cfg.botToken)) return "Токен бота выглядит некорректно (формат 123456:ABC…)";
  if (cfg.chatId && !/^(-?\d{3,20}|@[\w]{4,64})$/.test(cfg.chatId)) return "Chat ID должен быть числом (например, -1001234567890) или @username канала";
  if (cfg.enabled && (!cfg.botToken || !cfg.chatId)) return "Для включения уведомлений укажите токен и chat ID";
  return null;
}

export async function saveTelegram(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const cfg = readTelegram(formData);
  const error = validateTelegram(cfg);
  if (error) return { error };
  await setSetting("telegram", cfg);
  revalidatePath("/admin/settings");
  return { ok: true, message: cfg.enabled ? "Сохранено. Уведомления включены." : "Сохранено. Уведомления выключены." };
}

export async function testTelegram(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const cfg = readTelegram(formData);
  const stored = await getSetting<TelegramSettings>("telegram");
  const override: TelegramSettings = {
    botToken: cfg.botToken || stored?.botToken || process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: cfg.chatId || stored?.chatId || process.env.TELEGRAM_CHAT_ID || "",
    enabled: true,
  };
  if (!override.botToken || !override.chatId) return { error: "Укажите токен бота и chat ID" };
  const error = validateTelegram(override);
  if (error) return { error };
  const res = await sendTelegram("✅ Тест уведомлений assyl.tech", override);
  return res.ok
    ? { ok: true, message: "Тестовое сообщение отправлено — проверьте Telegram" }
    : { error: `Telegram ответил ошибкой: ${res.error ?? "неизвестно"}` };
}

const passwordSchema = z.object({
  current: z.string().min(1, "Введите текущий пароль"),
  next: z.string().min(8, "Новый пароль — минимум 8 символов").max(200),
  confirm: z.string(),
});

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse({
    current: formData.get("current") ?? "",
    next: formData.get("next") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  if (parsed.data.next !== parsed.data.confirm) return { error: "Пароли не совпадают" };

  const db = await getDb();
  const [row] = await db.select({ hash: schema.admins.passwordHash }).from(schema.admins).where(eq(schema.admins.id, admin.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.current, row.hash))) return { error: "Текущий пароль неверный" };

  await db.update(schema.admins).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(schema.admins.id, admin.id));
  return { ok: true, message: "Пароль обновлён" };
}

const adminSchema = z.object({
  email: z.email("Некорректный email").trim().toLowerCase().max(200),
  name: z.string().trim().min(1, "Введите имя").max(80),
  password: z.string().min(8, "Пароль — минимум 8 символов").max(200),
});

export async function addAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = adminSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    name: formData.get("name") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };

  const db = await getDb();
  const [exists] = await db.select({ id: schema.admins.id }).from(schema.admins).where(eq(schema.admins.email, parsed.data.email)).limit(1);
  if (exists) return { error: "Админ с таким email уже есть" };

  await db.insert(schema.admins).values({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
  });
  revalidatePath("/admin/settings");
  return { ok: true, message: `Админ ${parsed.data.email} добавлен` };
}

export async function deleteAdmin(adminId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  if (!isUuid(adminId)) return { ok: false, error: "Некорректный id" };
  if (adminId === me.id) return { ok: false, error: "Нельзя удалить самого себя" };
  const db = await getDb();
  const [{ value }] = await db.select({ value: count() }).from(schema.admins).where(ne(schema.admins.id, adminId));
  if (Number(value) < 1) return { ok: false, error: "Должен остаться хотя бы один админ" };
  await db.delete(schema.admins).where(and(eq(schema.admins.id, adminId), ne(schema.admins.id, me.id)));
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function generateDemo(): Promise<FormState> {
  const admin = await requireAdmin();
  if (process.env.NODE_ENV === "production") return { error: "Демо-данные недоступны в production" };
  try {
    const r = await generateDemoData(admin.id);
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message: `Готово: ${r.visitors} посетителей, ${r.sessions} визитов, ${r.events} событий, ${r.leads} заявок`,
    };
  } catch (e) {
    console.error("[demo]", e);
    return { error: `Не удалось сгенерировать: ${e instanceof Error ? e.message : "ошибка"}` };
  }
}

export async function deleteDemo(): Promise<FormState> {
  await requireAdmin();
  if (process.env.NODE_ENV === "production") return { error: "Демо-данные недоступны в production" };
  await removeDemoData();
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Демо-данные удалены" };
}
