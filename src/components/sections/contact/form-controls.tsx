"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ───────────────────────── shared styles ───────────────────────── */

const fieldBase =
  "peer w-full rounded-xl border bg-carbon/70 px-4 text-[16px] text-fg outline-none transition-[border-color,background-color,box-shadow] duration-300 " +
  "focus:bg-carbon focus:shadow-[0_0_0_4px_rgb(86_225_255/0.07),0_0_36px_-10px_rgb(86_225_255/0.55)] " +
  "autofill:shadow-[inset_0_0_0_100px_#0a0d14] autofill:[-webkit-text-fill-color:#eef2f8]";
const fieldOk = "border-line hover:border-line-strong focus:border-ion/60";
const fieldBad = "border-danger/60 hover:border-danger/80 focus:border-danger/80";

const labelBase =
  "pointer-events-none absolute left-4 origin-left whitespace-nowrap text-[15px] leading-[1.4] transition-[translate,scale,color] duration-300 ease-out-expo peer-focus:text-ion";
const labelFloat = "-translate-y-[11px] scale-[0.76] text-dim";
const labelRest =
  "text-dim peer-focus:-translate-y-[11px] peer-focus:scale-[0.76] peer-autofill:-translate-y-[11px] peer-autofill:scale-[0.76]";

const focusSweep =
  "pointer-events-none absolute inset-x-4 bottom-0 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-ion to-transparent transition-transform duration-500 ease-out-expo group-focus-within/field:scale-x-100";

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-center gap-2 pl-1 font-mono text-[11px] leading-snug tracking-[0.02em] text-danger">
      <span aria-hidden className="grid size-3.5 shrink-0 place-items-center rounded-full border border-danger/60 text-[8px] leading-none">
        !
      </span>
      {children}
    </p>
  );
}

/* ───────────────────────── text input ───────────────────────── */

type TextFieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  required?: boolean;
  optionalLabel?: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
} & Pick<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "autoComplete" | "maxLength" | "autoCapitalize" | "spellCheck" | "enterKeyHint">;

export function TextField({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  optionalLabel,
  invalid,
  describedBy,
  className,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const filled = value.length > 0;
  const bad = Boolean(error) || invalid;

  return (
    <div className={cn("relative", className)}>
      <div className="group/field relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder=" "
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={bad || undefined}
          aria-required={required || undefined}
          aria-describedby={[error && errorId, hint && hintId, describedBy].filter(Boolean).join(" ") || undefined}
          className={cn(fieldBase, "h-[60px] pb-[6px] pt-[22px]", bad ? fieldBad : fieldOk)}
          {...inputProps}
        />
        <label htmlFor={id} className={cn(labelBase, "top-[19px]", filled ? labelFloat : labelRest)}>
          {label}
          {required && (
            <span aria-hidden className="ml-1 text-signal">
              *
            </span>
          )}
        </label>
        {hint && (
          <span
            id={hintId}
            className={cn(
              "pointer-events-none absolute right-4 top-[21px] font-mono text-[11px] text-mute transition-opacity duration-300",
              filled ? "opacity-0" : "opacity-0 group-focus-within/field:opacity-100",
            )}
          >
            {hint}
          </span>
        )}
        {optionalLabel && !filled && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-[23px] font-mono text-[10px] uppercase tracking-[0.12em] text-mute transition-opacity duration-300 group-focus-within/field:opacity-0"
          >
            {optionalLabel}
          </span>
        )}
        <span aria-hidden className={focusSweep} />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

/* ───────────────────────── textarea (auto-grow + counter) ───────────────────────── */

export function TextAreaField({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  max,
  className,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  max: number;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const counterId = `${id}-counter`;
  const filled = value.length > 0;
  const near = value.length > max * 0.9;

  return (
    <div className={cn("relative", className)}>
      <div className="group/field relative">
        <textarea
          id={id}
          name={name}
          value={value}
          rows={4}
          maxLength={max}
          placeholder=" "
          data-lenis-prevent
          onChange={(e) => {
            onChange(e.target.value);
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight + 2, 380)}px`;
          }}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error && errorId, hint && hintId, counterId].filter(Boolean).join(" ")}
          className={cn(
            fieldBase,
            "block min-h-[156px] resize-none overflow-y-auto pb-9 pt-[26px] leading-relaxed [scrollbar-width:thin]",
            error ? fieldBad : fieldOk,
          )}
        />
        <label htmlFor={id} className={cn(labelBase, "top-[19px]", filled ? labelFloat : labelRest)}>
          {label}
        </label>
        {hint && (
          <span
            id={hintId}
            className={cn(
              "pointer-events-none absolute left-4 right-4 top-[46px] text-[14px] text-mute transition-opacity duration-300",
              filled ? "opacity-0" : "opacity-0 group-focus-within/field:opacity-100",
            )}
          >
            {hint}
          </span>
        )}
        <span
          id={counterId}
          className={cn(
            "pointer-events-none absolute bottom-3 right-4 font-mono text-[10px] tabular-nums tracking-[0.08em] transition-colors",
            near ? "text-warn" : "text-mute",
          )}
        >
          {value.length} / {max}
        </span>
        <span aria-hidden className={focusSweep} />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

/* ───────────────────────── chips ───────────────────────── */

export function Chip({
  type,
  name,
  value,
  label,
  checked,
  flash,
  onChange,
}: {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  label: string;
  checked: boolean;
  flash?: boolean;
  onChange: () => void;
}) {
  return (
    <label className="relative cursor-pointer select-none">
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          "flex h-10 items-center gap-2.5 rounded-full border px-4 text-[14px] transition-[border-color,background-color,color,box-shadow] duration-300",
          "peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ion",
          checked
            ? "border-signal/70 bg-signal/15 text-fg"
            : "border-line bg-carbon/60 text-dim hover:border-line-strong hover:text-fg",
          flash && "border-ion shadow-[0_0_0_4px_rgb(86_225_255/0.16),0_0_30px_-4px_rgb(86_225_255/0.7)]",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "grid size-3.5 shrink-0 place-items-center border transition-colors duration-300",
            type === "checkbox" ? "rounded-[4px]" : "rounded-full",
            checked ? "border-ion" : "border-line-strong",
          )}
        >
          <span
            className={cn(
              "size-1.5 bg-ion transition-[scale] duration-300 ease-out-expo",
              type === "checkbox" ? "rounded-[1px]" : "rounded-full",
              checked ? "scale-100" : "scale-0",
            )}
          />
        </span>
        {label}
      </span>
    </label>
  );
}

/* ───────────────────────── fieldset ───────────────────────── */

export function FormGroup({
  index,
  label,
  hint,
  children,
  className,
}: {
  index: string;
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mono-label float-left mb-4 flex w-full items-center gap-3">
        <span className="tabular-nums text-signal">{index}</span>
        <span className="text-fg/90">{label}</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
        {hint && <span className="normal-case tracking-[0.04em] text-mute">{hint}</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

/* ───────────────────────── consent checkbox ───────────────────────── */

export function ConsentField({
  label,
  checked,
  onChange,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="group/consent flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          name="consent"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-required
          aria-describedby={error ? errorId : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-[background-color,border-color] duration-300",
            "peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ion",
            checked
              ? "border-signal bg-signal"
              : error
                ? "border-danger/70 bg-carbon"
                : "border-line-strong bg-carbon group-hover/consent:border-fg/40",
          )}
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            className={cn(
              "size-3 text-white transition-[opacity,scale] duration-300 ease-out-expo",
              checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          >
            <path d="m2.5 6.3 2.3 2.3 4.7-5.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-[14px] leading-relaxed text-dim transition-colors group-hover/consent:text-fg/80">
          {label}
          <span aria-hidden className="text-signal">
            {" "}
            *
          </span>
        </span>
      </label>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
