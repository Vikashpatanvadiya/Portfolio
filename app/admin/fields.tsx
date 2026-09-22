"use client";

import { useId, useState, type ReactNode } from "react";

/* Small form kit for the admin editor. */

export const inputCls =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-foreground";

export function Field({ label, hint, children, wide }: { label: string; hint?: string; children: (id: string) => ReactNode; wide?: boolean }) {
  const id = useId();
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-muted/80">{hint}</p>}
    </div>
  );
}

export function Text({
  label, hint, value, onChange, placeholder, wide, type = "text",
}: { label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean; type?: string }) {
  return (
    <Field label={label} hint={hint} wide={wide}>
      {(id) => <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />}
    </Field>
  );
}

export function Area({
  label, hint, value, onChange, placeholder, rows = 4,
}: { label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <Field label={label} hint={hint} wide>
      {(id) => (
        <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-y leading-relaxed`} />
      )}
    </Field>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-5 w-9 rounded-full bg-border transition-colors peer-checked:bg-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-transform peer-checked:after:translate-x-4" />
      {label}
    </label>
  );
}

/** Tag input: type and press Enter or comma to add; click × to remove. */
export function Chips({ label, hint, value, onChange, placeholder }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const next = raw.split(",").map((s) => s.trim()).filter((s) => s && !value.includes(s));
    if (next.length) onChange([...value, ...next]);
    setDraft("");
  };
  return (
    <Field label={label} hint={hint ?? "press Enter or comma to add"} wide>
      {(id) => (
        <div className={`${inputCls} flex flex-wrap items-center gap-1.5 focus-within:border-foreground`}>
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-md bg-hover px-2 py-0.5 text-xs">
              {v}
              <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="text-muted hover:text-foreground">
                ×
              </button>
            </span>
          ))}
          <input
            id={id}
            value={draft}
            placeholder={value.length ? "" : placeholder}
            onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); add(draft); }
              if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
            }}
            onBlur={() => draft && add(draft)}
            className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted/70"
          />
        </div>
      )}
    </Field>
  );
}

export function IconBtn({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`grid h-7 w-7 place-items-center rounded-md text-sm text-muted transition-colors hover:bg-hover disabled:opacity-30 disabled:hover:bg-transparent ${danger ? "hover:text-red-500" : "hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-border p-4 sm:p-5">{children}</div>;
}

export const grid = "grid gap-4 sm:grid-cols-2";

export function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}
