import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { MobileTabBar, SidebarNav, TopbarTitle } from "@/components/admin/shell/sidebar-nav";
import { OnlineIndicator } from "@/components/admin/shell/online-indicator";
import { IconExternal, IconLogout } from "@/components/admin/ui/icons";
import { requireAdmin } from "@/lib/auth/server";
import { getNewLeadsCount, getOnlineCount } from "@/lib/admin/queries";
import { logout } from "./actions";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const [newLeads, online] = await Promise.all([getNewLeadsCount(), getOnlineCount()]);
  const initials = (admin.name || admin.email).trim().slice(0, 1).toUpperCase();

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-ink lg:flex">
        <Link href="/admin" className="flex h-16 items-center gap-2.5 px-5">
          <LogoMark className="h-5 w-auto text-white" />
          <Wordmark className="text-[15px]" />
          <span className="mono-label ml-auto rounded-full border border-line px-1.5 py-0.5 text-[9.5px]">Admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 pt-3">
          <SidebarNav newLeads={newLeads} />
        </div>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-steel text-[13px] font-semibold text-fg">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{admin.name}</p>
              <p className="truncate text-[11.5px] text-mute">{admin.email}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                title="Выйти"
                aria-label="Выйти"
                className="grid size-8 place-items-center rounded-lg text-mute transition-colors hover:bg-graphite hover:text-fg"
              >
                <IconLogout size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-void/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2 lg:hidden" aria-label="assyl.tech admin">
            <LogoMark className="h-5 w-auto text-white" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="hidden text-sm text-mute lg:inline">assyl.tech</span>
            <span className="hidden text-mute lg:inline">/</span>
            <TopbarTitle />
          </div>
          <OnlineIndicator initial={online} />
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-dim transition-colors hover:bg-graphite hover:text-fg sm:inline-flex"
          >
            Открыть сайт <IconExternal size={14} />
          </a>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            aria-label="Открыть сайт"
            className="grid size-8 place-items-center rounded-full text-dim hover:bg-graphite hover:text-fg sm:hidden"
          >
            <IconExternal size={16} />
          </a>
          <div className="flex items-center gap-2 lg:hidden">
            <span
              title={`${admin.name} · ${admin.email}`}
              className="hidden size-8 place-items-center rounded-full bg-steel text-[13px] font-semibold text-fg sm:grid"
            >
              {initials}
            </span>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Выйти"
                className="grid size-8 place-items-center rounded-full text-dim hover:bg-graphite hover:text-fg"
              >
                <IconLogout size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-7 lg:pb-12">
        {children}
      </main>

      <MobileTabBar newLeads={newLeads} />
    </div>
  );
}
