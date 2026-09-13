import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export type TelegramSettings = { botToken: string; chatId: string; enabled: boolean };

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  return (row?.value as T) ?? null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
}

/** Settings saved in the admin panel win over environment variables. */
export async function getTelegramSettings(): Promise<TelegramSettings | null> {
  const stored = await getSetting<TelegramSettings>("telegram");
  if (stored?.botToken && stored.chatId) return stored;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) return { botToken, chatId, enabled: true };
  return null;
}
