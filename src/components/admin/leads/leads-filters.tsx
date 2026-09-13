"use client";

import Form from "next/form";
import { useEffect, useRef } from "react";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/admin/constants";
import { PERIODS } from "@/lib/admin/period";
import { Input, Select } from "@/components/admin/ui/input";
import { IconSearch, IconX } from "@/components/admin/ui/icons";

export function LeadsFilters({
  q,
  status,
  period,
  view,
  counts,
}: {
  q: string;
  status: string;
  period: string;
  view: string;
  counts: Record<string, number>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = () => formRef.current?.requestSubmit();

  return (
    <Form ref={formRef} action="/admin/leads" replace scroll={false} className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      {view !== "table" ? <input type="hidden" name="view" value={view} /> : null}
      <div className="relative sm:w-72">
        <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
        <Input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Имя, телефон, email, telegram…"
          className="pl-9"
          aria-label="Поиск"
          onChange={() => {
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(submit, 450);
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:flex">
        <Select name="status" defaultValue={status} onChange={submit} aria-label="Статус" className="sm:w-48">
          <option value="">Все статусы ({total})</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]} ({counts[s] ?? 0})
            </option>
          ))}
        </Select>
        <Select name="period" defaultValue={period} onChange={submit} aria-label="Период" className="sm:w-40">
          <option value="all">Всё время</option>
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      {q || status || period !== "all" ? (
        <a
          href={view !== "table" ? `/admin/leads?view=${view}` : "/admin/leads"}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-full px-3 text-[13px] text-dim hover:bg-graphite hover:text-fg"
        >
          <IconX size={14} /> Сбросить
        </a>
      ) : null}
    </Form>
  );
}
