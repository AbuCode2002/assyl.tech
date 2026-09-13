import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-graphite", className)} />;
}

export function PageSkeleton({ variant = "dashboard" }: { variant?: "dashboard" | "table" | "detail" }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Загрузка">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-72 rounded-full" />
      </div>
      {variant === "dashboard" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-line bg-carbon p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-4 h-7 w-24" />
                <Skeleton className="mt-3 h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-line bg-carbon p-5 lg:col-span-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-6 h-56 w-full" />
            </div>
            <div className="rounded-2xl border border-line bg-carbon p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-6 h-56 w-full" />
            </div>
          </div>
        </>
      ) : null}
      {variant === "table" ? (
        <div className="rounded-2xl border border-line bg-carbon">
          <div className="flex gap-3 border-b border-line p-4">
            <Skeleton className="h-10 w-60 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : null}
      {variant === "detail" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
