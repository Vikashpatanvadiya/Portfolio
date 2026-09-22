import {
  RESERVED_SLUGS,
  type ContactLink,
  type ListItem,
  type ProjectItem,
  type Section,
  type SectionType,
  type SiteContent,
  type SkillGroup,
  type TextItem,
  type TimelineItem,
} from "./types";

/* Coerces anything (a stored document, an admin save) into a valid SiteContent.
   Shared by the server (on read + save) and the admin editor (blank items). */

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown, max = 5000) => (typeof v === "string" ? v.slice(0, max) : "");
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strList = (v: unknown) =>
  arr(v)
    .map((s) => str(s, 80).trim())
    .filter(Boolean);

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

const id = (v: unknown) => str(v, 40) || uid();

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export function blankItem(type: "projects"): ProjectItem;
export function blankItem(type: "timeline"): TimelineItem;
export function blankItem(type: "list"): ListItem;
export function blankItem(type: "skills"): SkillGroup;
export function blankItem(type: "text"): TextItem;
export function blankItem(type: "contact"): ContactLink;
export function blankItem(type: SectionType): Section["items"][number];
export function blankItem(type: SectionType): Section["items"][number] {
  return normalizeItem(type, {});
}

function normalizeItem(type: SectionType, raw: unknown) {
  const o = obj(raw);
  switch (type) {
    case "projects":
      return {
        id: id(o.id),
        name: str(o.name, 120),
        category: str(o.category, 60),
        start: str(o.start, 40),
        end: str(o.end, 40),
        description: str(o.description),
        role: str(o.role, 120),
        builtAt: str(o.builtAt, 160),
        stack: strList(o.stack),
        achievements: str(o.achievements),
        takeaway: str(o.takeaway),
        github: str(o.github, 500),
        live: str(o.live, 500),
        demo: str(o.demo, 500),
        image: str(o.image, 500),
        featured: bool(o.featured, false),
      } satisfies ProjectItem;
    case "timeline":
      return { id: id(o.id), date: str(o.date, 40), title: str(o.title, 160), body: str(o.body) } satisfies TimelineItem;
    case "list":
      return { id: id(o.id), text: str(o.text, 1000) } satisfies ListItem;
    case "skills":
      return { id: id(o.id), group: str(o.group, 80), skills: strList(o.skills) } satisfies SkillGroup;
    case "text":
      return { id: id(o.id), body: str(o.body, 20000) } satisfies TextItem;
    case "contact":
      return { id: id(o.id), label: str(o.label, 40), href: str(o.href, 500) } satisfies ContactLink;
  }
}

const TYPES: SectionType[] = ["projects", "timeline", "list", "skills", "text", "contact"];

function normalizeSection(raw: unknown): Section | null {
  const o = obj(raw);
  const type = TYPES.includes(o.type as SectionType) ? (o.type as SectionType) : null;
  if (!type) return null;
  const title = str(o.title, 60) || "Untitled";
  return {
    id: id(o.id),
    type,
    slug: slugify(str(o.slug, 60) || title) || uid(),
    title,
    description: str(o.description, 1000),
    visible: bool(o.visible, true),
    showInNav: bool(o.showInNav, true),
    items: arr(o.items).map((it) => normalizeItem(type, it)),
  } as Section;
}

// Older content kept links in a top-level `socials` list; turn it into a Contact section.
function withLegacySocials(o: Obj): Section[] {
  const sections = arr(o.sections)
    .map(normalizeSection)
    .filter((s): s is Section => s !== null);
  const legacy = arr(o.socials);
  if (legacy.length && !sections.some((s) => s.type === "contact")) {
    const contact = normalizeSection({ type: "contact", slug: "contact", title: "Contact", items: legacy });
    if (contact) sections.push(contact);
  }
  return sections;
}

export function normalizeContent(raw: unknown): SiteContent {
  const o = obj(raw);
  const p = obj(o.profile);
  return {
    profile: {
      name: str(p.name, 80),
      brand: str(p.brand, 40),
      headline: str(p.headline, 300),
      bio: str(p.bio, 10000),
      location: str(p.location, 80),
      avatar: str(p.avatar, 500),
      banner: str(p.banner, 500),
      resumeUrl: str(p.resumeUrl, 500),
      highlights: str(p.highlights, 1000),
      seoDescription: str(p.seoDescription, 300),
      siteUrl: str(p.siteUrl, 200),
    },
    sections: withLegacySocials(o),
    updatedAt: str(o.updatedAt, 40),
  };
}

/** Human-readable problems that should block a save. */
export function validateContent(c: SiteContent): string[] {
  const errors: string[] = [];
  if (!c.profile.name.trim()) errors.push("Profile name is required.");
  const seen = new Set<string>();
  for (const s of c.sections) {
    if (RESERVED_SLUGS.includes(s.slug)) errors.push(`Section "${s.title}" uses a reserved URL (/${s.slug}).`);
    if (seen.has(s.slug)) errors.push(`Two sections share the URL /${s.slug}.`);
    seen.add(s.slug);
    if (s.type === "projects") {
      s.items.forEach((p, i) => {
        if (!p.name.trim()) errors.push(`${s.title}: project #${i + 1} needs a name.`);
      });
    }
  }
  return errors;
}

/** A section appears on the public site only when it's visible and has content. */
export const isPublic = (s: Section) => s.visible && s.items.length > 0;
