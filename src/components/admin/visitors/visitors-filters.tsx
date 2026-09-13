"use client";

import Form from "next/form";
import { useRef } from "react";
import { channelLabel, DEVICE_LABELS } from "@/lib/admin/constants";
import { Select } from "@/components/admin/ui/input";
import { cn } from "@/lib/cn";

export function VisitorsFilters({
  period,
  channel,
  device,
  converted,
  online,
  channels,
}: {
  period: string;
  channel: string;
  device: string;
  converted: boolean;
  online: boolean;
  channels: string[];
}) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();

  return (
    <Form ref={ref} action="/admin/visitors" replace scroll={false} className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      <input type="hidden" name="period" value={period} />
      <div className="grid grid-cols-2 gap-2.5 sm:flex">
        <Select name="channel" defaultValue={channel} onChange={submit} aria-label="Источник" className="sm:w-48">
          <option value="">Все источники</option>
          {channels.map((c) => (
            <option key={c} value={c}>
              {channelLabel(c)}
            </option>
          ))}
        </Select>
        <Select name="device" defaultValue={device} onChange={submit} aria-label="Устройство" className="sm:w-44">
          <option value="">Все устройства</option>
          {Object.entries(DEVICE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Toggle name="converted" label="Только с заявкой" checked={converted} onChange={submit} />
        <Toggle name="online" label="Только онлайн" checked={online} onChange={submit} />
      </div>
    </Form>
  );
}

function Toggle({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={cn(
        "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors select-none",
        checked ? "border-signal/40 bg-signal/10 text-fg" : "border-line bg-carbon text-dim hover:text-fg",
      )}
    >
      <input type="checkbox" name={name} value="1" defaultChecked={checked} onChange={onChange} className="size-3.5 accent-[#3b7bff]" />
      {label}
    </label>
  );
}
