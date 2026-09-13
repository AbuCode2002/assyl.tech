import type { ComponentType } from "react";
import { IconChart, IconInbox, IconOverview, IconSettings, IconUsers } from "@/components/admin/ui/icons";

export type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: "newLeads";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Обзор", short: "Обзор", icon: IconOverview },
  { href: "/admin/leads", label: "Заявки", short: "Заявки", icon: IconInbox, badge: "newLeads" },
  { href: "/admin/visitors", label: "Посетители", short: "Визиты", icon: IconUsers },
  { href: "/admin/analytics", label: "Аналитика", short: "Аналитика", icon: IconChart },
  { href: "/admin/settings", label: "Настройки", short: "Настройки", icon: IconSettings },
];

export function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFor(pathname: string): string {
  if (/^\/admin\/leads\/[^/]+$/.test(pathname)) return "Заявка";
  if (/^\/admin\/visitors\/[^/]+$/.test(pathname)) return "Визит";
  const item = [...NAV_ITEMS].reverse().find((i) => isActive(pathname, i.href));
  return item?.label ?? "Админка";
}
