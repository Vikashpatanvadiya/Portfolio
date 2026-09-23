"use client";

import { useId, useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import type { LinkPreview } from "@/app/api/link-preview/route";

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

/* ------------------------------------------------------------------ */
/*  SmartUrlInput                                                       */
/*  Detects pasted URLs → fetches OG preview → shows card with embed   */
/* ------------------------------------------------------------------ */

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const KIND_ICON: Record<LinkPreview["kind"], string> = {
  github: "⌥",   // will be replaced with logo-like label
  youtube: "▶",
  twitter: "𝕏",
  loom: "⏺",
  generic: "🔗",
};

const KIND_LABEL: Record<LinkPreview["kind"], string> = {
  github: "GitHub",
  youtube: "YouTube",
  twitter: "X / Twitter",
  loom: "Loom",
  generic: "Link",
};

type EmbedChoice = "link" | "embed";

export function SmartUrlInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  wide,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
}) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [embedChoice, setEmbedChoice] = useState<EmbedChoice>("link");
  const [previewError, setPreviewError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetched = useRef("");

  const fetchPreview = useCallback(async (url: string) => {
    if (!URL_RE.test(url) || url === lastFetched.current) return;
    lastFetched.current = url;
    setLoading(true);
    setPreviewError(false);
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("failed");
      const data: LinkPreview = await res.json();
      setPreview(data);
      // Auto-select embed if possible
      setEmbedChoice(data.embedUrl ? "embed" : "link");
    } catch {
      setPreviewError(true);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch when value changes and looks like a URL
  useEffect(() => {
    if (!value || !URL_RE.test(value)) {
      setPreview(null);
      setPreviewError(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPreview(value), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchPreview]);

  return (
    <Field label={label} hint={hint} wide={wide}>
      {(id) => (
        <div className="space-y-2">
          {/* Input row */}
          <div className="relative flex items-center">
            <input
              id={id}
              type="url"
              value={value}
              placeholder={placeholder ?? "https://…"}
              onChange={(e) => onChange(e.target.value)}
              onPaste={(e) => {
                // immediate fetch on paste without waiting for debounce
                const pasted = e.clipboardData.getData("text").trim();
                if (URL_RE.test(pasted)) {
                  // Let the input update first, then fetch
                  setTimeout(() => fetchPreview(pasted), 0);
                }
              }}
              className={`${inputCls} pr-8`}
            />
            {loading && (
              <span className="pointer-events-none absolute right-2.5 text-xs text-muted animate-pulse">⟳</span>
            )}
            {!loading && value && URL_RE.test(value) && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                title="Open link"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                ↗
              </a>
            )}
          </div>

          {/* Highlighted clickable link pill */}
          {value && URL_RE.test(value) && (
            <div className="flex items-center gap-2">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground hover:bg-foreground/10 hover:border-foreground/40 transition-colors"
              >
                <span className="opacity-60">
                  {preview ? KIND_ICON[preview.kind] : "🔗"}
                </span>
                <span className="truncate max-w-[280px]">{value}</span>
                <span className="opacity-50">↗</span>
              </a>
              {preview && (
                <span className="rounded-md bg-hover px-2 py-0.5 text-[10px] font-medium text-muted uppercase tracking-wide">
                  {KIND_LABEL[preview.kind]}
                </span>
              )}
            </div>
          )}

          {/* Error state */}
          {previewError && (
            <p className="text-xs text-muted/60 italic">couldn't load preview — link saved as-is</p>
          )}

          {/* Preview card */}
          {preview && (
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Embed / Link toggle */}
              {preview.embedUrl && (
                <div className="flex items-center gap-1 border-b border-border bg-hover px-3 py-2">
                  <span className="text-xs text-muted mr-2">Display as:</span>
                  {(["link", "embed"] as EmbedChoice[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEmbedChoice(c)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        embedChoice === c
                          ? "bg-foreground text-background"
                          : "text-muted hover:bg-border hover:text-foreground"
                      }`}
                    >
                      {c === "embed" ? "▶ Embed" : "🔗 Link card"}
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] text-muted/60 italic">preview only — choice saved with your content</span>
                </div>
              )}

              {/* Embed iframe */}
              {preview.embedUrl && embedChoice === "embed" ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={preview.embedUrl}
                    title={preview.title || "Embedded content"}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                /* OG link card */
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 p-3 hover:bg-hover transition-colors group"
                >
                  {preview.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.image}
                      alt=""
                      className="h-16 w-24 flex-none rounded-lg border border-border object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:underline">
                      {preview.title || preview.url}
                    </p>
                    {preview.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{preview.description}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted/60">
                      <span>{KIND_ICON[preview.kind]}</span>
                      <span>{preview.siteName || new URL(preview.url).hostname}</span>
                    </p>
                  </div>
                  <span className="self-start text-muted opacity-0 group-hover:opacity-100 transition-opacity text-xs">↗</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/*  SmartArea                                                           */
/*  Textarea that detects a pasted URL and offers inline insert options */
/* ------------------------------------------------------------------ */

const BARE_URL_RE = /^https?:\/\/[^\s<>"')\]]+$/i;

type PopupState = {
  url: string;
  /** caret position in the textarea where the URL was inserted */
  insertStart: number;
  insertEnd: number;
  /** pixel coords for the floating popup */
  top: number;
  left: number;
  /** OG fetch state */
  fetching: boolean;
  title: string | null;
};

export function SmartArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const dismiss = useCallback(() => setPopup(null), []);

  // Close popup on Escape or click outside
  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest("[data-smart-popup]");
      if (!el) dismiss();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [popup, dismiss]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pasted = e.clipboardData.getData("text").trim();
      if (!BARE_URL_RE.test(pasted)) return; // not a plain URL — let browser handle normally

      e.preventDefault(); // we'll insert it ourselves

      const ta = e.currentTarget;
      const { selectionStart: ss, selectionEnd: se } = ta;

      // Insert the raw URL into the value at caret
      const next = value.slice(0, ss) + pasted + value.slice(se);
      onChange(next);

      const insertEnd = ss + pasted.length;

      // Position the popup just below the textarea (simple — no per-line math)
      const rect = ta.getBoundingClientRect();
      const popupTop = rect.bottom + window.scrollY + 6;
      const popupLeft = rect.left + window.scrollX;

      setPopup({
        url: pasted,
        insertStart: ss,
        insertEnd,
        top: popupTop,
        left: popupLeft,
        fetching: true,
        title: null,
      });

      // Restore caret after state update
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(insertEnd, insertEnd);
      });

      // Fetch OG title in background
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(pasted)}`);
        if (res.ok) {
          const data = await res.json() as { title?: string };
          setPopup((p) => p ? { ...p, fetching: false, title: data.title || null } : null);
        } else {
          setPopup((p) => p ? { ...p, fetching: false } : null);
        }
      } catch {
        setPopup((p) => p ? { ...p, fetching: false } : null);
      }
    },
    [value, onChange]
  );

  /** Replace the raw URL in the text with a markdown link */
  const convertToMarkdown = useCallback(
    (customLabel?: string) => {
      if (!popup) return;
      const { url, insertStart, insertEnd } = popup;
      const label = customLabel || url;
      const md = `[${label}](${url})`;
      const next = value.slice(0, insertStart) + md + value.slice(insertEnd);
      onChange(next);
      dismiss();
      // Move caret to end of inserted markdown
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(insertStart + md.length, insertStart + md.length);
      });
    },
    [popup, value, onChange, dismiss]
  );

  const id = useId();

  return (
    <div className={undefined /* wide is always true for Area */}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        className={`${inputCls} resize-y leading-relaxed sm:col-span-2`}
      />
      {hint && <p className="mt-1 text-xs text-muted/80">{hint}</p>}

      {/* Floating popup — portalled via fixed positioning */}
      {popup && (
        <div
          data-smart-popup
          style={{ position: "fixed", top: popup.top, left: popup.left, zIndex: 9999 }}
          className="w-80 rounded-xl border border-foreground/20 bg-background shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold">Link detected</span>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm text-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>

          {/* URL preview row */}
          <div className="px-3 py-2">
            <a
              href={popup.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-foreground/10 transition-colors"
            >
              <span className="truncate">{popup.url}</span>
              <span className="opacity-50 flex-none">↗</span>
            </a>
            {popup.fetching && (
              <span className="ml-2 text-[10px] text-muted animate-pulse">fetching title…</span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-1 px-3 pb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Display as
            </p>

            {/* Markdown link with OG title (if fetched) */}
            {popup.title && (
              <button
                type="button"
                onClick={() => convertToMarkdown(popup.title!)}
                className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-hover transition-colors"
              >
                <span className="block font-medium">📎 Named link</span>
                <span className="block text-muted mt-0.5 truncate">
                  [{popup.title}]({popup.url})
                </span>
              </button>
            )}

            {/* Markdown link with custom "link" label */}
            <button
              type="button"
              onClick={() => convertToMarkdown("link")}
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-hover transition-colors"
            >
              <span className="block font-medium">🔗 Generic "link"</span>
              <span className="block text-muted mt-0.5 truncate">[link]({popup.url})</span>
            </button>

            {/* Markdown link using hostname as label */}
            <button
              type="button"
              onClick={() => {
                let host = popup.url;
                try { host = new URL(popup.url).hostname.replace(/^www\./, ""); } catch { /* keep */ }
                convertToMarkdown(host);
              }}
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-hover transition-colors"
            >
              <span className="block font-medium">🌐 Site name</span>
              <span className="block text-muted mt-0.5 truncate">
                [{(() => { try { return new URL(popup.url).hostname.replace(/^www\./, ""); } catch { return popup.url; } })()}]({popup.url})
              </span>
            </button>

            {/* Keep as raw URL (auto-linked on frontend) */}
            <button
              type="button"
              onClick={dismiss}
              className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-left text-xs text-muted hover:bg-hover transition-colors"
            >
              <span className="block font-medium">Keep bare URL</span>
              <span className="block mt-0.5">auto-linked on the site</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
