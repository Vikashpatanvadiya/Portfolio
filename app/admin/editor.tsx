"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { blankItem, slugify, uid } from "@/lib/content/normalize";
import {
  SECTION_TYPES,
  type ContactLink,
  type ListItem,
  type Profile,
  type ProjectItem,
  type Section,
  type SectionType,
  type SiteContent,
  type SkillGroup,
  type TextItem,
  type TimelineItem,
} from "@/lib/content/types";
import { logout, saveContent } from "./actions";
import { Area, Card, Chips, IconBtn, Text, Toggle, grid, move } from "./fields";

type View = { kind: "profile" } | { kind: "section"; id: string } | { kind: "new" };

const ITEM_NOUN: Record<SectionType, string> = {
  projects: "project",
  skills: "skill group",
  timeline: "entry",
  list: "line",
  text: "text block",
  contact: "link",
};

export function Editor({ initial, storage }: { initial: SiteContent; storage: string }) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [view, setView] = useState<View>({ kind: "profile" });
  const [errors, setErrors] = useState<string[]>([]);
  const [flash, setFlash] = useState("");
  const [saving, startSave] = useTransition();
  const dirty = content !== saved;

  const save = useCallback(() => {
    startSave(async () => {
      const res = await saveContent(content);
      if (res.ok) {
        setContent(res.content);
        setSaved(res.content);
        setErrors([]);
        setFlash("saved — live on the site");
        setTimeout(() => setFlash(""), 2500);
      } else setErrors(res.errors);
    });
  }, [content]);

  // cmd/ctrl+s to save, and warn before leaving with unsaved changes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (dirty) save(); }
    };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [dirty, save]);

  const setProfile = (patch: Partial<Profile>) => setContent((c) => ({ ...c, profile: { ...c.profile, ...patch } }));
  const setSection = (id: string, fn: (s: Section) => Section) =>
    setContent((c) => ({ ...c, sections: c.sections.map((s) => (s.id === id ? fn(s) : s)) }));

  const current = view.kind === "section" ? content.sections.find((s) => s.id === view.id) : undefined;

  const navBtn = (active: boolean) =>
    `w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${active ? "bg-hover font-medium" : "text-muted hover:bg-hover hover:text-foreground"}`;

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <span className="text-sm font-semibold">admin</span>
          {/* the timestamp is formatted in the browser's locale/timezone, which differs from the server's */}
          <span className="min-w-0 truncate text-xs text-muted" suppressHydrationWarning>
            {flash || (dirty ? "● unsaved changes" : saved.updatedAt ? `last saved ${new Date(saved.updatedAt).toLocaleString()}` : "")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" className="hidden rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-hover hover:text-foreground hover:opacity-100 sm:block">
              view site ↗
            </a>
            <button onClick={() => logout()} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-hover hover:text-foreground">
              log out
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity disabled:opacity-40"
            >
              {saving ? "saving…" : "save"}
            </button>
          </div>
        </div>
      </header>

      {storage === "readonly" && (
        <div className="border-b border-border bg-hover px-6 py-2 text-center text-xs text-muted">
          No database connected — you can edit, but saving won&apos;t work until Upstash Redis is added to this Vercel project.
        </div>
      )}
      {errors.length > 0 && (
        <div className="mx-auto mt-4 max-w-5xl px-4 sm:px-6">
          <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-500">
            <p className="mb-1 font-medium">Couldn&apos;t save:</p>
            <ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[13rem_minmax(0,1fr)]">
        {/* sidebar */}
        <aside className="min-w-0 md:sticky md:top-20 md:self-start">
          <nav className="flex gap-1 overflow-x-auto md:flex-col [scrollbar-width:none]">
            <button className={navBtn(view.kind === "profile")} onClick={() => setView({ kind: "profile" })}>Profile</button>
            <p className="hidden px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted md:block">Sections</p>
            {content.sections.map((s) => (
              <button key={s.id} className={`${navBtn(view.kind === "section" && view.id === s.id)} flex items-center justify-between gap-2 whitespace-nowrap`} onClick={() => setView({ kind: "section", id: s.id })}>
                <span className={s.visible ? "" : "line-through opacity-60"}>{s.title}</span>
                <span className="text-[11px] text-muted">{s.items.length}</span>
              </button>
            ))}
            <button className={`${navBtn(view.kind === "new")} whitespace-nowrap`} onClick={() => setView({ kind: "new" })}>+ new section</button>
          </nav>
        </aside>

        <section className="min-w-0 space-y-6">
          {view.kind === "profile" && <ProfilePanel profile={content.profile} set={setProfile} />}
          {view.kind === "new" && (
            <NewSection
              taken={content.sections.map((s) => s.slug)}
              onCreate={(s) => {
                setContent((c) => ({ ...c, sections: [...c.sections, s] }));
                setView({ kind: "section", id: s.id });
              }}
            />
          )}
          {current && (
            <SectionPanel
              key={current.id}
              section={current}
              index={content.sections.indexOf(current)}
              count={content.sections.length}
              set={(fn) => setSection(current.id, fn)}
              onMove={(dir) => setContent((c) => ({ ...c, sections: move(c.sections, c.sections.indexOf(current), dir) }))}
              onDelete={() => {
                if (!confirm(`Delete the "${current.title}" section and everything in it?`)) return;
                setContent((c) => ({ ...c, sections: c.sections.filter((s) => s.id !== current.id) }));
                setView({ kind: "profile" });
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  profile                                                             */
/* ------------------------------------------------------------------ */

const FORMAT_HINT = "blank line = new paragraph · **bold** · [link text](https://…)";

function ProfilePanel({ profile: p, set }: { profile: Profile; set: (patch: Partial<Profile>) => void }) {
  return (
    <>
      <h2 className="text-lg font-semibold">Profile</h2>
      <Card>
        <div className={grid}>
          <Text label="Name" value={p.name} onChange={(name) => set({ name })} />
          <Text label="Wordmark (top-left)" value={p.brand} onChange={(brand) => set({ brand })} placeholder="vikash.code" />
          <Text label="Headline" value={p.headline} onChange={(headline) => set({ headline })} wide />
          <Area label="About / bio" hint={FORMAT_HINT} value={p.bio} onChange={(bio) => set({ bio })} rows={9} />
          <Area label="Highlights under your name" hint="one per line — e.g. Member [@superteam](https://x.com/superteam)" value={p.highlights} onChange={(highlights) => set({ highlights })} rows={3} />
          <Text label="Location" value={p.location} onChange={(location) => set({ location })} />
          <Text label="Resume link" value={p.resumeUrl} onChange={(resumeUrl) => set({ resumeUrl })} placeholder="https://… or /resume.pdf" hint="shows a Resume button on the home page" />
        </div>
      </Card>
      <Card>
        <div className={grid}>
          <Text label="Profile photo URL" value={p.avatar} onChange={(avatar) => set({ avatar })} placeholder="/profile.jpg" />
          <Text label="Banner image URL" value={p.banner} onChange={(banner) => set({ banner })} placeholder="/banner.jpg" />
          <div className="flex items-end gap-3 sm:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.avatar && <img src={p.avatar} alt="" className="h-14 w-14 rounded-xl border border-border object-cover" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.banner && <img src={p.banner} alt="" className="h-14 min-w-0 flex-1 rounded-xl border border-border object-cover" />}
          </div>
        </div>
      </Card>
      <Card>
        <div className={grid}>
          <Text label="Site URL" value={p.siteUrl} onChange={(siteUrl) => set({ siteUrl })} placeholder="https://bansi.me" />
          <Text label="Search / share description" value={p.seoDescription} onChange={(seoDescription) => set({ seoDescription })} wide />
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  sections                                                            */
/* ------------------------------------------------------------------ */

function NewSection({ taken, onCreate }: { taken: string[]; onCreate: (s: Section) => void }) {
  const [type, setType] = useState<SectionType>("skills");
  const [title, setTitle] = useState("Skills");
  const slug = slugify(title);
  const clash = !slug || taken.includes(slug);

  return (
    <>
      <h2 className="text-lg font-semibold">New section</h2>
      <p className="-mt-4 text-sm text-muted">each section gets its own page and a link in the top nav.</p>
      <Card>
        <p className="mb-2 text-xs font-medium text-muted">What kind of content?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SECTION_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => { setType(t.type); if (!title || SECTION_TYPES.some((x) => x.label === title)) setTitle(t.label.split(" /")[0]); }}
              className={`rounded-lg border p-3 text-left transition-colors ${type === t.type ? "border-foreground" : "border-border hover:bg-hover"}`}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted">{t.hint}</p>
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Text label="Title" value={title} onChange={setTitle} hint={slug ? `page URL: /${slug}${taken.includes(slug) ? " — already used" : ""}` : undefined} />
        </div>
        <button
          disabled={clash}
          onClick={() =>
            onCreate({ id: uid(), type, slug, title: title.trim(), description: "", visible: true, showInNav: true, items: [] } as Section)
          }
          className="mt-5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          create section
        </button>
      </Card>
    </>
  );
}

function SectionPanel({
  section: s, index, count, set, onMove, onDelete,
}: { section: Section; index: number; count: number; set: (fn: (s: Section) => Section) => void; onMove: (dir: -1 | 1) => void; onDelete: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const noun = ITEM_NOUN[s.type];
  const patch = (p: Partial<Section>) => set((x) => ({ ...x, ...p }) as Section);
  const setItems = (fn: (items: Section["items"]) => Section["items"]) => set((x) => ({ ...x, items: fn(x.items) }) as Section);
  const updateItem = (id: string, p: object) => setItems((items) => items.map((it) => (it.id === id ? { ...it, ...p } : it)) as Section["items"]);

  return (
    <>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{s.title || "Untitled"}</h2>
        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted">{SECTION_TYPES.find((t) => t.type === s.type)?.label}</span>
        <div className="ml-auto flex items-center">
          <IconBtn label="Move section up" disabled={index === 0} onClick={() => onMove(-1)}>↑</IconBtn>
          <IconBtn label="Move section down" disabled={index === count - 1} onClick={() => onMove(1)}>↓</IconBtn>
          <IconBtn label="Delete section" danger onClick={onDelete}>🗑</IconBtn>
        </div>
      </div>

      <Card>
        <div className={grid}>
          <Text label="Title" value={s.title} onChange={(title) => patch({ title })} />
          <Text label="Page URL" value={s.slug} onChange={(v) => patch({ slug: slugify(v) })} hint={`bansi.me/${s.slug}`} />
          <Area label="Intro line (optional)" value={s.description} onChange={(description) => patch({ description })} rows={2} />
          <div className="flex flex-wrap gap-6 sm:col-span-2">
            <Toggle label="Visible on site" checked={s.visible} onChange={(visible) => patch({ visible })} />
            {s.items.length === 0 && <span className="text-xs text-muted">hidden on the site until you add something</span>}
            <Toggle label="Show in top nav" checked={s.showInNav} onChange={(showInNav) => patch({ showInNav })} />
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {s.items.map((item, i) => {
          const isOpen = open === item.id;
          return (
            <div key={item.id} className={`rounded-xl border transition-colors ${isOpen ? "border-foreground/40" : "border-border"}`}>
              <div role="button" tabIndex={0} onClick={() => setOpen(isOpen ? null : item.id)} onKeyDown={(e) => e.key === "Enter" && setOpen(isOpen ? null : item.id)} className="flex cursor-pointer items-center gap-2 px-4 py-3">
                <span className="text-xs text-muted">{isOpen ? "▾" : "▸"}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{summary(s.type, item) || <span className="text-muted">new {noun}</span>}</span>
                <IconBtn label="Move up" disabled={i === 0} onClick={() => setItems((l) => move(l as never[], i, -1))}>↑</IconBtn>
                <IconBtn label="Move down" disabled={i === s.items.length - 1} onClick={() => setItems((l) => move(l as never[], i, 1))}>↓</IconBtn>
                <IconBtn label="Delete" danger onClick={() => { if (confirm(`Delete this ${noun}?`)) setItems((l) => (l as { id: string }[]).filter((x) => x.id !== item.id) as Section["items"]); }}>✕</IconBtn>
              </div>
              {isOpen && (
                <div className="border-t border-border p-4 sm:p-5">
                  <ItemForm type={s.type} item={item} set={(p) => updateItem(item.id, p)} />
                </div>
              )}
            </div>
          );
        })}
        <button
          onClick={() => {
            const item = blankItem(s.type);
            setItems((l) => [item, ...l] as Section["items"]);
            setOpen(item.id);
          }}
          className="w-full rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted transition-colors hover:bg-hover hover:text-foreground"
        >
          + add {noun}
        </button>
      </div>
    </>
  );
}

function summary(type: SectionType, item: Section["items"][number]): string {
  switch (type) {
    case "projects": { const p = item as ProjectItem; return [p.featured ? "★" : "", p.name, p.category && `· ${p.category}`].filter(Boolean).join(" "); }
    case "timeline": { const t = item as TimelineItem; return [t.date, t.title].filter(Boolean).join(" — "); }
    case "list": return (item as ListItem).text;
    case "skills": { const g = item as SkillGroup; return g.group + (g.skills.length ? ` (${g.skills.length})` : ""); }
    case "text": return (item as TextItem).body.slice(0, 80);
    case "contact": { const l = item as ContactLink; return [l.label, l.href].filter(Boolean).join(" — "); }
  }
}

function ItemForm({ type, item, set }: { type: SectionType; item: Section["items"][number]; set: (p: object) => void }) {
  switch (type) {
    case "projects": {
      const p = item as ProjectItem;
      return (
        <div className={grid}>
          <Text label="Project name *" value={p.name} onChange={(name) => set({ name })} placeholder="Medialayer" />
          <Text label="Category / tag" value={p.category} onChange={(category) => set({ category })} placeholder="web3, ai, web app…" />
          <Text label="Started" value={p.start} onChange={(start) => set({ start })} placeholder="Feb 2025" />
          <Text label="Ended" value={p.end} onChange={(end) => set({ end })} placeholder="Oct 2025 / Present (leave empty if one-off)" />
          <Area label="Description" hint={FORMAT_HINT} value={p.description} onChange={(description) => set({ description })} placeholder="What is it and what does it do?" />
          <Text label="Your role" value={p.role} onChange={(role) => set({ role })} placeholder="Solo developer / founder" />
          <Text label="Where it was built" value={p.builtAt} onChange={(builtAt) => set({ builtAt })} placeholder="Solana Breakout Hackathon / client / personal" hint="supports [links](https://…)" />
          <Chips label="Tech stack" value={p.stack} onChange={(stack) => set({ stack })} placeholder="Next.js, Rust, Anchor…" />
          <Area label="What it achieved" hint="one per line — prizes, users, revenue, results" value={p.achievements} onChange={(achievements) => set({ achievements })} rows={3} placeholder={"1st place, Wormhole track\n500+ users in the first week"} />
          <Area label="Takeaway (optional)" value={p.takeaway} onChange={(takeaway) => set({ takeaway })} rows={2} placeholder="What did you learn building it?" />
          <Text label="Live link" value={p.live} onChange={(live) => set({ live })} placeholder="https://…" />
          <Text label="GitHub" value={p.github} onChange={(github) => set({ github })} placeholder="https://github.com/…" />
          <Text label="Demo video" value={p.demo} onChange={(demo) => set({ demo })} placeholder="YouTube / Loom link" />
          <Text label="Cover image URL (optional)" value={p.image} onChange={(image) => set({ image })} placeholder="https://…/screenshot.png" />
          <div className="sm:col-span-2">
            <Toggle label="Feature on home page" checked={p.featured} onChange={(featured) => set({ featured })} />
          </div>
        </div>
      );
    }
    case "timeline": {
      const t = item as TimelineItem;
      return (
        <div className={grid}>
          <Text label="Year / date" value={t.date} onChange={(date) => set({ date })} placeholder="2020" />
          <Text label="Title" value={t.title} onChange={(title) => set({ title })} placeholder="From getting curious to coding for the first time" />
          <Area label="Story" hint={FORMAT_HINT} value={t.body} onChange={(body) => set({ body })} rows={10} placeholder="What happened, what you built, what you learned…" />
        </div>
      );
    }
    case "list":
      return <Area label="Text" hint="supports **bold** and [links](https://…)" value={(item as ListItem).text} onChange={(text) => set({ text })} rows={2} />;
    case "skills": {
      const g = item as SkillGroup;
      return (
        <div className={grid}>
          <Text label="Group name" value={g.group} onChange={(group) => set({ group })} placeholder="Languages / Frameworks / Tools" />
          <Chips label="Skills" value={g.skills} onChange={(skills) => set({ skills })} placeholder="TypeScript, Rust, Solana…" />
        </div>
      );
    }
    case "text":
      return <Area label="Text" hint={FORMAT_HINT} value={(item as TextItem).body} onChange={(body) => set({ body })} rows={8} />;
    case "contact": {
      const l = item as ContactLink;
      return (
        <div className={grid}>
          <Text label="Label" value={l.label} onChange={(label) => set({ label })} placeholder="email / github / telegram" />
          <Text label="Link" value={l.href} onChange={(href) => set({ href })} placeholder="https://… or mailto:you@…" />
        </div>
      );
    }
  }
}
