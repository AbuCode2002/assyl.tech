import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth/server";
import { listLeads } from "@/lib/admin/queries";
import { channelLabel, isLeadStatus, SERVICE_LABELS, STATUS_LABELS } from "@/lib/admin/constants";
import { parsePeriod, TZ } from "@/lib/admin/period";

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // neutralise spreadsheet formula injection (phone numbers like "+7 701 …" are left as is)
  if (/^[=+\-@\t\r]/.test(s) && !/^\+?[\d\s()-]+$/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const periodParam = sp.get("period");
  const leads = await listLeads(
    {
      status: isLeadStatus(status) ? status : null,
      q: sp.get("q")?.slice(0, 100) ?? null,
      period: periodParam && periodParam !== "all" ? parsePeriod(periodParam) : "all",
    },
    100_000,
  );

  const header = [
    "Номер",
    "Дата (Алматы)",
    "Статус",
    "Имя",
    "Телефон",
    "Email",
    "Telegram",
    "Компания",
    "Услуги",
    "Бюджет",
    "Сроки",
    "Сообщение",
    "Источник",
    "UTM source",
    "UTM medium",
    "UTM campaign",
    "Страница",
    "Язык",
    "Страна",
    "Город",
    "Устройство",
  ];

  const lines = [header.map(cell).join(";")];
  for (const l of leads) {
    lines.push(
      [
        l.number,
        dateFmt.format(l.createdAt),
        STATUS_LABELS[l.status],
        l.name,
        l.phone,
        l.email,
        l.telegram,
        l.company,
        l.services.map((s) => SERVICE_LABELS[s] ?? s).join(", "),
        l.budget,
        l.timeline,
        l.message,
        channelLabel(l.channel),
        l.utm?.source,
        l.utm?.medium,
        l.utm?.campaign,
        l.page,
        l.locale,
        l.country,
        l.city,
        l.device,
      ]
        .map(cell)
        .join(";"),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  // UTF-8 BOM + ";" separator so Excel with a Russian locale opens Cyrillic columns correctly.
  return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="assyl-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
