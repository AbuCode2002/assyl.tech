import "server-only";
import type { Lead } from "@/lib/db/schema";
import { getTelegramSettings, type TelegramSettings } from "./settings";

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Recipients: one chat id, or several separated by commas/spaces (personal chats, groups, channels). */
export function parseChatIds(chatId: string): string[] {
  return [...new Set(chatId.split(/[,;\s]+/).map((id) => id.trim()).filter(Boolean))];
}

async function sendToChat(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  return json.ok ? { ok: true as const } : { ok: false as const, error: json.description ?? `HTTP ${res.status}` };
}

/** Sends to every configured recipient; fails only when nobody could be reached. */
export async function sendTelegram(text: string, override?: TelegramSettings): Promise<{ ok: boolean; error?: string }> {
  const cfg = override ?? (await getTelegramSettings());
  if (!cfg || !cfg.enabled) return { ok: false, error: "Telegram не настроен" };
  const chatIds = parseChatIds(cfg.chatId);
  if (!chatIds.length) return { ok: false, error: "Не указан чат для уведомлений" };
  try {
    const results = await Promise.all(
      chatIds.map(async (id) => {
        try {
          const r = await sendToChat(cfg.botToken, id, text);
          return r.ok ? { ok: true as const } : { ok: false as const, error: `${id}: ${r.error}` };
        } catch (e) {
          return { ok: false as const, error: `${id}: ${e instanceof Error ? e.message : "network error"}` };
        }
      }),
    );
    const failed = results.filter((r) => !r.ok).map((r) => ("error" in r ? r.error : ""));
    if (failed.length === results.length) return { ok: false, error: failed.join("; ") };
    return failed.length ? { ok: true, error: `часть получателей недоступна — ${failed.join("; ")}` } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

export function formatLeadMessage(lead: Lead, adminUrl?: string) {
  const line = (label: string, value?: string | null) => (value ? `<b>${label}:</b> ${escapeHtml(value)}\n` : "");
  const geo = [lead.city, lead.country].filter(Boolean).join(", ");
  return (
    `🚀 <b>Новая заявка #${lead.number}</b>\n\n` +
    line("Имя", lead.name) +
    line("Телефон", lead.phone) +
    line("Email", lead.email) +
    line("Telegram", lead.telegram) +
    line("Компания", lead.company) +
    line("Услуги", lead.services.join(", ")) +
    line("Бюджет", lead.budget) +
    line("Сроки", lead.timeline) +
    (lead.message ? `\n<i>${escapeHtml(lead.message.slice(0, 1500))}</i>\n\n` : "\n") +
    line("Источник", lead.channel) +
    line("Гео", geo) +
    line("Устройство", lead.device) +
    line("Язык", lead.locale) +
    (adminUrl ? `\n<a href="${adminUrl}/admin/leads/${lead.id}">Открыть в админке →</a>` : "")
  );
}
