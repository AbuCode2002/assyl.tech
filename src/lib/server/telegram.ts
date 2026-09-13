import "server-only";
import type { Lead } from "@/lib/db/schema";
import { getTelegramSettings, type TelegramSettings } from "./settings";

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegram(text: string, override?: TelegramSettings): Promise<{ ok: boolean; error?: string }> {
  const cfg = override ?? (await getTelegramSettings());
  if (!cfg || !cfg.enabled) return { ok: false, error: "Telegram не настроен" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: cfg.chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    return json.ok ? { ok: true } : { ok: false, error: json.description ?? `HTTP ${res.status}` };
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
