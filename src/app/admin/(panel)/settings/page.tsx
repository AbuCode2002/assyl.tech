import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";
import { getDb, schema } from "@/lib/db";
import { getSetting, type TelegramSettings } from "@/lib/server/settings";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import {
  AddAdminForm,
  DeleteAdminButton,
  DemoDataControls,
  PasswordForm,
  TelegramForm,
} from "@/components/admin/settings/settings-forms";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const db = await getDb();
  const [stored, admins] = await Promise.all([
    getSetting<TelegramSettings>("telegram"),
    db
      .select({
        id: schema.admins.id,
        email: schema.admins.email,
        name: schema.admins.name,
        createdAt: schema.admins.createdAt,
        lastLoginAt: schema.admins.lastLoginAt,
      })
      .from(schema.admins)
      .orderBy(asc(schema.admins.createdAt)),
  ]);
  const fromEnv = !stored?.botToken && Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const telegramActive = Boolean((stored?.botToken && stored.chatId && stored.enabled) || fromEnv);
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="space-y-5">
      <PageHeader title="Настройки" description="Уведомления, доступ и служебные инструменты" />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Уведомления в Telegram"
            description="Мгновенное сообщение о каждой новой заявке"
            action={
              telegramActive ? (
                <Badge tone="ok" dot>
                  Включены
                </Badge>
              ) : (
                <Badge>Выключены</Badge>
              )
            }
          />
          <CardBody>
            <TelegramForm
              initial={{
                botToken: stored?.botToken ?? "",
                chatId: stored?.chatId ?? "",
                enabled: stored ? stored.enabled : false,
                fromEnv,
              }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Как подключить" />
          <CardBody>
            <ol className="space-y-3 text-[13px] leading-relaxed text-dim">
              {[
                <>
                  Откройте <a className="text-fg underline decoration-line-strong underline-offset-2 hover:decoration-fg" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>, отправьте <code className="font-mono text-fg">/newbot</code> и следуйте подсказкам.
                </>,
                <>Скопируйте токен вида <code className="font-mono text-fg">123456789:AA…</code> в поле «Токен бота».</>,
                <>Напишите своему боту любое сообщение — или добавьте бота в рабочую группу и напишите там.</>,
                <>
                  Откройте в браузере{" "}
                  <code className="font-mono text-[12px] break-all text-fg">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> и найдите{" "}
                  <code className="font-mono text-fg">&quot;chat&quot;:{"{"}&quot;id&quot;: …{"}"}</code>. Для групп id начинается с «-100».
                </>,
                <>Вставьте chat ID, включите уведомления, сохраните и отправьте тестовое сообщение.</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-graphite font-mono text-[11px] text-fg">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Смена пароля" description={me.email} />
          <CardBody>
            <PasswordForm />
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Администраторы" description="Все админы имеют полный доступ к панели" />
          <ul className="divide-y divide-line border-y border-line">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-steel text-[13px] font-semibold text-fg">
                  {(a.name || a.email).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[13.5px] font-medium text-fg">
                    {a.name}
                    {a.id === me.id ? <Badge tone="signal">Вы</Badge> : null}
                  </p>
                  <p className="truncate text-[12px] text-dim">{a.email}</p>
                </div>
                <div className="hidden text-right text-[12px] text-mute sm:block">
                  <p>Добавлен {formatDateTime(a.createdAt)}</p>
                  <p>{a.lastLoginAt ? `Вход ${formatRelative(a.lastLoginAt)}` : "Ещё не входил"}</p>
                </div>
                {a.id !== me.id ? <DeleteAdminButton adminId={a.id} email={a.email} /> : <span className="size-9" />}
              </li>
            ))}
          </ul>
          <CardBody className="pt-5">
            <AddAdminForm />
          </CardBody>
        </Card>
      </div>

      {isDev ? (
        <Card id="demo" className="scroll-mt-20 border-dashed border-line-strong">
          <CardHeader
            title="Демо-данные"
            description="Только для разработки: ~30 дней визитов (≈1 500), событий и ≈35 заявок, чтобы проверить интерфейс"
            action={<Badge tone="warn">dev</Badge>}
          />
          <CardBody className="space-y-3">
            <p className="text-[13px] leading-relaxed text-dim">
              Демо-строки помечены: id посетителей и визитов начинаются с <code className="font-mono text-fg">demo_</code>, у заявок{" "}
              <code className="font-mono text-fg">ipHash = &quot;demo&quot;</code>. Повторная генерация заменяет предыдущие демо-данные. Реальные данные не
              затрагиваются.
            </p>
            <DemoDataControls />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
