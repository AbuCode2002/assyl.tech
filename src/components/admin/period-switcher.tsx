import { PERIODS, type PeriodId } from "@/lib/admin/period";
import { Segmented, withParams } from "@/components/admin/ui/segmented";

export function PeriodSwitcher({
  pathname,
  searchParams,
  value,
  withAll,
}: {
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
  value: PeriodId | "all";
  withAll?: boolean;
}) {
  const items = [
    ...PERIODS.map((p) => ({
      value: p.id,
      label: p.label,
      href: withParams(pathname, searchParams, { period: p.id, page: null }),
    })),
    ...(withAll ? [{ value: "all", label: "Всё время", href: withParams(pathname, searchParams, { period: "all", page: null }) }] : []),
  ];
  return <Segmented items={items} value={value} />;
}
