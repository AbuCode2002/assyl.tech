import type { LeadStatus } from "@/lib/db/schema";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/admin/constants";
import { cn } from "@/lib/cn";

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[12px] leading-none font-medium whitespace-nowrap text-fg",
        className,
      )}
      style={{ borderColor: `${color}40`, backgroundColor: `${color}14` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {STATUS_LABELS[status]}
    </span>
  );
}
