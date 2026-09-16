"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addAdmin,
  changePassword,
  deleteAdmin,
  deleteDemo,
  generateDemo,
  saveTelegram,
  testTelegram,
  type FormState,
} from "@/app/admin/(panel)/settings/actions";
import { Button, Spinner, buttonClasses } from "@/components/admin/ui/button";
import { Field, Input, Switch } from "@/components/admin/ui/input";
import { Dialog } from "@/components/admin/ui/dialog";
import { IconSend, IconTrash } from "@/components/admin/ui/icons";
import { cn } from "@/lib/cn";

function Notice({ state }: { state: FormState }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed",
        state.error ? "border-danger/30 bg-danger/10 text-danger" : "border-ok/25 bg-ok/[0.07] text-ok",
      )}
    >
      {state.error ?? state.message}
    </p>
  );
}

export function TelegramForm({ initial }: { initial: { botToken: string; chatId: string; enabled: boolean; fromEnv: boolean } }) {
  const [saveState, saveAction, saving] = useActionState<FormState, FormData>(saveTelegram, undefined);
  const [testState, testAction, testing] = useActionState<FormState, FormData>(testTelegram, undefined);
  const [last, setLast] = useState<"save" | "test" | null>(null);

  return (
    <form action={saveAction} onSubmit={() => setLast("save")} className="space-y-4">
      {initial.fromEnv ? (
        <p className="rounded-xl border border-line bg-graphite/60 px-3.5 py-2.5 text-[12.5px] text-dim">
          Сейчас используются TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID из переменных окружения. Настройки, сохранённые здесь, имеют приоритет.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Токен бота" htmlFor="botToken" hint="Выдаёт @BotFather, формат 123456789:AA…">
          <Input
            id="botToken"
            name="botToken"
            type="password"
            autoComplete="off"
            spellCheck={false}
            defaultValue={initial.botToken}
            placeholder="123456789:AAH…"
            className="font-mono text-[13px]"
          />
        </Field>
        <Field label="Chat ID" htmlFor="chatId" hint="Личный чат, группа (-100…) или @канал. Несколько получателей — через запятую">
          <Input
            id="chatId"
            name="chatId"
            autoComplete="off"
            spellCheck={false}
            defaultValue={initial.chatId}
            placeholder="-1001234567890"
            className="font-mono text-[13px]"
          />
        </Field>
      </div>
      <Switch id="enabled" name="enabled" defaultChecked={initial.enabled} label="Отправлять уведомления о новых заявках" />

      {last === "test" ? <Notice state={testState} /> : <Notice state={saveState} />}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving || testing} className={buttonClasses("primary", "md")}>
          {saving ? <Spinner /> : null} Сохранить
        </button>
        <button
          type="submit"
          formAction={testAction}
          onClick={() => setLast("test")}
          disabled={saving || testing}
          className={buttonClasses("secondary", "md")}
        >
          {testing ? <Spinner /> : <IconSend size={15} />} Отправить тестовое сообщение
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={action} className="space-y-4" key={state?.ok ? "done" : "form"}>
      <input type="text" name="username" autoComplete="username" className="hidden" readOnly aria-hidden tabIndex={-1} />
      <Field label="Текущий пароль" htmlFor="current">
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Новый пароль" htmlFor="next" hint="Минимум 8 символов">
          <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field label="Повторите пароль" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
      </div>
      <Notice state={state} />
      <button type="submit" disabled={pending} className={buttonClasses("primary", "md")}>
        {pending ? <Spinner /> : null} Сменить пароль
      </button>
    </form>
  );
}

export function AddAdminForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addAdmin, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Имя" htmlFor="admin-name">
          <Input id="admin-name" name="name" autoComplete="off" required placeholder="Айдана" />
        </Field>
        <Field label="Email" htmlFor="admin-email">
          <Input id="admin-email" name="email" type="email" autoComplete="off" required placeholder="name@assyl.tech" />
        </Field>
        <Field label="Пароль" htmlFor="admin-password" hint="Минимум 8 символов">
          <Input id="admin-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
      </div>
      <Notice state={state} />
      <button type="submit" disabled={pending} className={buttonClasses("secondary", "md")}>
        {pending ? <Spinner /> : null} Добавить админа
      </button>
    </form>
  );
}

export function DeleteAdminButton({ adminId, email }: { adminId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button variant="ghost" size="icon" aria-label={`Удалить ${email}`} title="Удалить" onClick={() => setOpen(true)}>
        <IconTrash size={16} />
      </Button>
      <Dialog
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Удалить админа?"
        description={`${email} потеряет доступ к панели.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Отмена
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteAdmin(adminId);
                  if (res.ok) setOpen(false);
                  else setError(res.error ?? "Ошибка");
                })
              }
            >
              {pending ? <Spinner /> : null} Удалить
            </Button>
          </>
        }
      >
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      </Dialog>
    </>
  );
}

export function DemoDataControls() {
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<"gen" | "del" | null>(null);

  const run = (kind: "gen" | "del") => {
    if (kind === "del" && !window.confirm("Удалить все демо-данные?")) return;
    setRunning(kind);
    startTransition(async () => {
      const res = kind === "gen" ? await generateDemo() : await deleteDemo();
      setState(res);
      setRunning(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => run("gen")} disabled={pending}>
          {running === "gen" ? <Spinner /> : null}
          {running === "gen" ? "Генерируем… (до минуты)" : "Сгенерировать демо-данные"}
        </Button>
        <Button variant="danger" onClick={() => run("del")} disabled={pending}>
          {running === "del" ? <Spinner /> : <IconTrash size={15} />} Удалить демо-данные
        </Button>
      </div>
      <Notice state={state} />
    </div>
  );
}
