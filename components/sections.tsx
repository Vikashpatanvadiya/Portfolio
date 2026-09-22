import type { ProjectItem, Section } from "@/lib/content/types";
import { Inline, Rich, isExternal, lines, safeHref } from "@/lib/rich-text";

/* Renders any section type. Used by the section pages and the home page. */

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  const safe = safeHref(href);
  if (!safe) return null;
  return (
    <a href={safe} {...(isExternal(safe) ? { target: "_blank", rel: "noreferrer" } : {})}>
      {children} ↗
    </a>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 max-sm:grid-cols-1 max-sm:gap-1">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** "https://x.com/vikash_sol" → "x.com/vikash_sol", "mailto:me@x.com" → "me@x.com" */
const prettyLink = (href: string) =>
  href.replace(/^mailto:|^tel:/i, "").replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

export const period = (p: { start: string; end: string }) =>
  p.start && p.end ? `${p.start} → ${p.end}` : p.start || p.end;

export function ProjectCard({ p, compact = false }: { p: ProjectItem; compact?: boolean }) {
  const achievements = lines(p.achievements);
  const when = period(p);
  const hasLinks = p.live || p.github || p.demo;
  return (
    <article className="group">
      {!compact && p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="mb-4 aspect-video w-full rounded-xl border border-border object-cover" />
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold">{p.name}</h3>
          {p.category && <span className="text-xs text-muted">{p.category}</span>}
        </div>
        {when && <span className="text-xs text-muted tabular-nums">{when}</span>}
      </div>
      {p.description && <Rich text={p.description} className="text-sm text-muted leading-relaxed space-y-2 mb-3" />}

      {!compact && (p.role || p.builtAt || p.stack.length > 0 || achievements.length > 0 || p.takeaway) && (
        <dl className="mb-3 space-y-2 text-sm">
          {p.role && <Row label="Role">{p.role}</Row>}
          {p.builtAt && (
            <Row label="Built at">
              <Inline text={p.builtAt} />
            </Row>
          )}
          {p.stack.length > 0 && (
            <Row label="Stack">
              <ul className="flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <li key={s} className="rounded-md border border-border px-2 py-0.5 text-xs">
                    {s}
                  </li>
                ))}
              </ul>
            </Row>
          )}
          {achievements.length > 0 && (
            <Row label="Achieved">
              <ul className="space-y-1">
                {achievements.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted">–</span>
                    <span>
                      <Inline text={a} />
                    </span>
                  </li>
                ))}
              </ul>
            </Row>
          )}
          {p.takeaway && (
            <Row label="Takeaway">
              <Inline text={p.takeaway} />
            </Row>
          )}
        </dl>
      )}

      {hasLinks && (
        <div className="flex gap-4 text-sm">
          {p.live && <Ext href={p.live}>live</Ext>}
          {p.demo && <Ext href={p.demo}>demo</Ext>}
          {p.github && <Ext href={p.github}>code</Ext>}
        </div>
      )}
    </article>
  );
}

export function SectionBody({ section }: { section: Section }) {
  if (section.items.length === 0) return <p className="text-sm text-muted">nothing here yet.</p>;

  switch (section.type) {
    case "projects":
      return (
        <div className="divide-y divide-border">
          {section.items.map((p) => (
            <div key={p.id} className="py-8 first:pt-0">
              <ProjectCard p={p} />
            </div>
          ))}
        </div>
      );

    case "list":
      return (
        <ol className="space-y-4">
          {section.items.map((w, i) => (
            <li key={w.id} className="flex items-baseline gap-3 text-sm">
              <span className="text-muted tabular-nums">{i + 1}.</span>
              <span className="leading-relaxed">
                <Inline text={w.text} />
              </span>
            </li>
          ))}
        </ol>
      );

    case "skills":
      return (
        <div className="space-y-6">
          {section.items.map((g) => (
            <div key={g.id} className="grid grid-cols-[8rem_1fr] gap-4 max-sm:grid-cols-1 max-sm:gap-2">
              <h3 className="text-sm text-muted">{g.group}</h3>
              <ul className="flex flex-wrap gap-1.5">
                {g.skills.map((s) => (
                  <li key={s} className="rounded-md border border-border px-2.5 py-1 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case "timeline":
      return (
        <ol>
          {section.items.map((t) => (
            <li key={t.id} className="relative pb-8 pl-6 last:pb-0 sm:pb-10 sm:pl-8 md:pb-12">
              {/* connector runs from below this dot to the next one */}
              <span aria-hidden className="absolute top-6 bottom-0 left-[7px] w-[2px] bg-border sm:top-8 [li:last-child>&]:hidden" />
              <span aria-hidden className="absolute top-1.5 left-0 h-3.5 w-3.5 rounded-full border-2 border-foreground bg-background sm:h-4 sm:w-4" />
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                  {t.date && <span className="font-mono text-xs font-bold text-foreground/60 tabular-nums sm:text-sm">{t.date}</span>}
                  <h3 className="font-serif text-base font-semibold tracking-tight sm:text-xl">{t.title}</h3>
                </div>
                {t.body && <Rich text={t.body} className="space-y-6 text-sm font-light leading-relaxed text-foreground/70 sm:text-base" />}
              </div>
            </li>
          ))}
        </ol>
      );

    case "contact":
      return (
        <ul className="divide-y divide-border border-y border-border">
          {section.items.map((l) => {
            const href = safeHref(l.href);
            if (!href) return null;
            return (
              <li key={l.id}>
                <a
                  href={href}
                  {...(isExternal(href) ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="group flex items-baseline justify-between gap-4 py-3.5 text-sm hover:opacity-100"
                >
                  <span className="font-medium">{l.label}</span>
                  <span className="truncate text-muted transition-colors group-hover:text-foreground">
                    {prettyLink(href)} ↗
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      );

    case "text":
      return (
        <div className="space-y-6">
          {section.items.map((t) => (
            <Rich key={t.id} text={t.body} className="text-sm leading-relaxed space-y-4 max-w-lg" />
          ))}
        </div>
      );
  }
}
