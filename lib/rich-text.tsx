import { Fragment, type ReactNode } from "react";

/* Tiny, safe formatter for admin-written text: paragraphs (blank line),
   **bold**, `code` and [label](url). Renders React nodes — never raw HTML. */

export function safeHref(href: string): string | null {
  const h = href.trim();
  if (!h) return null;
  if (/^(https?:|mailto:|tel:)/i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(h)) return `https://${h}`; // "github.com/me"
  return null;
}

export const isExternal = (href: string) => /^https?:/i.test(href);

// Groups: 1=bold 2=code 3=md-label 4=md-href 5=bare-url
const TOKEN =
  /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>"')\]]+)/g;

export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = m.index;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      out.push(
        <code key={key} className="rounded bg-hover px-1 py-0.5 text-[0.9em]">
          {m[2]}
        </code>
      );
    } else if (m[3] !== undefined) {
      // [label](href) markdown link
      const href = safeHref(m[4]);
      out.push(
        href ? (
          <a key={key} href={href} className="underline decoration-border underline-offset-4" {...(isExternal(href) ? { target: "_blank", rel: "noreferrer" } : {})}>
            {m[3]}
          </a>
        ) : (
          <Fragment key={key}>{m[3]}</Fragment>
        )
      );
    } else if (m[5] !== undefined) {
      // bare https?:// URL — auto-link it, show just the hostname as label
      const raw = m[5];
      let display = raw;
      try { display = new URL(raw).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
      out.push(
        <a key={key} href={raw} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4">
          {display}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function Rich({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          <Inline text={p} />
        </p>
      ))}
    </div>
  );
}

export const lines = (text: string) => text.split("\n").map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
