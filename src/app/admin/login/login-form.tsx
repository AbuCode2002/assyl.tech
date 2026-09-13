"use client";

import { useActionState } from "react";
import { Spinner, buttonClasses } from "@/components/admin/ui/button";
import { Field, Input } from "@/components/admin/ui/input";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
          defaultValue={state?.email}
          placeholder="you@assyl.tech"
          aria-invalid={Boolean(state?.error)}
        />
      </Field>
      <Field label="Пароль" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={Boolean(state?.error)}
        />
      </Field>

      {state?.error ? (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className={buttonClasses("primary", "md", "h-11 w-full")}>
        {pending ? (
          <>
            <Spinner /> Проверяем…
          </>
        ) : (
          "Войти"
        )}
      </button>
    </form>
  );
}
