import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { DEV_DEFAULTS, ensureBootstrapAdmin, getAdmin, usesDevDefaultCredentials } from "@/lib/auth/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  const hasAdmin = await ensureBootstrapAdmin().catch(() => true);
  const devHint = usesDevDefaultCredentials();

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-20%] left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgb(59 123 255 / 0.22), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid size-14 place-items-center rounded-2xl border border-line bg-carbon">
            <LogoMark className="h-7 w-auto text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Wordmark className="text-lg" />
            <span className="mono-label rounded-full border border-line px-2 py-0.5 text-[10px]">Admin</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-carbon/90 p-6 shadow-[0_24px_80px_-24px_rgb(0_0_0/0.8)] backdrop-blur sm:p-7">
          <h1 className="text-lg font-semibold tracking-[-0.01em]">Вход в панель</h1>
          <p className="mt-1 text-sm text-dim">Заявки, посетители и аналитика сайта</p>

          {!hasAdmin ? (
            <div className="mt-5 rounded-xl border border-warn/30 bg-warn/10 px-3.5 py-3 text-[13px] leading-relaxed text-warn">
              Администратор не создан. Задайте переменные окружения <code className="font-mono">ADMIN_EMAIL</code> и{" "}
              <code className="font-mono">ADMIN_PASSWORD</code> и перезапустите сервер.
            </div>
          ) : null}

          <LoginForm next={next} />
        </div>

        {devHint ? (
          <p className="mt-4 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-center text-[12px] leading-relaxed text-mute">
            Dev-режим: первый админ создаётся автоматически —{" "}
            <span className="font-mono text-dim">{DEV_DEFAULTS.email}</span> /{" "}
            <span className="font-mono text-dim">{DEV_DEFAULTS.password}</span>. В production задайте ADMIN_EMAIL и
            ADMIN_PASSWORD.
          </p>
        ) : null}
      </div>
    </main>
  );
}
