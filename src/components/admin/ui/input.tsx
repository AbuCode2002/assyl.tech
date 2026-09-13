import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-xl border border-line bg-graphite text-sm text-fg placeholder:text-mute transition-colors outline-none hover:border-line-strong focus:border-signal/70 focus:ring-2 focus:ring-signal/20 disabled:opacity-60";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "h-10 px-3.5", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "min-h-24 px-3.5 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(field, "h-10 cursor-pointer appearance-none pr-9 pl-3.5")} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-dim"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="m7 10 5 5 5-5" />
      </svg>
    </div>
  );
}

export function Label({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-[13px] font-medium text-dim", className)}>
      {children}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-mute">{hint}</p>
      ) : null}
    </div>
  );
}

export function Switch({
  name,
  defaultChecked,
  label,
  id,
}: {
  name: string;
  defaultChecked?: boolean;
  label: ReactNode;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3 select-none">
      <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-6 w-10 rounded-full border border-line bg-graphite transition-colors peer-checked:border-signal peer-checked:bg-signal peer-focus-visible:ring-2 peer-focus-visible:ring-ion/60 after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-dim after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-white" />
      <span className="text-sm text-fg">{label}</span>
    </label>
  );
}
