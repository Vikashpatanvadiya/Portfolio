/* ------------------------------------------------------------------ */
/*  content model — everything on the site is described by this shape  */
/* ------------------------------------------------------------------ */

export type Profile = {
  name: string;
  brand: string; // top-left wordmark, e.g. "vikash.code"
  headline: string;
  bio: string; // paragraphs separated by a blank line; supports **bold** and [links](url)
  location: string;
  avatar: string;
  banner: string;
  resumeUrl: string;
  highlights: string; // one short line per row, e.g. "Member [@superteam](https://x.com/superteam)"
  seoDescription: string;
  siteUrl: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  category: string;
  start: string;
  end: string;
  description: string;
  role: string;
  builtAt: string; // where it was built — hackathon, company, client, personal
  stack: string[];
  achievements: string; // one per line
  takeaway: string;
  github: string;
  live: string;
  demo: string;
  image: string;
  featured: boolean;
};

export type TimelineItem = { id: string; date: string; title: string; body: string };
export type ListItem = { id: string; text: string };
export type SkillGroup = { id: string; group: string; skills: string[] };
export type TextItem = { id: string; body: string };
export type ContactLink = { id: string; label: string; href: string };

type SectionBase = {
  id: string;
  slug: string;
  title: string;
  description: string;
  visible: boolean;
  showInNav: boolean;
};

export type Section =
  | (SectionBase & { type: "projects"; items: ProjectItem[] })
  | (SectionBase & { type: "timeline"; items: TimelineItem[] })
  | (SectionBase & { type: "list"; items: ListItem[] })
  | (SectionBase & { type: "skills"; items: SkillGroup[] })
  | (SectionBase & { type: "text"; items: TextItem[] })
  | (SectionBase & { type: "contact"; items: ContactLink[] });

export type SectionType = Section["type"];

export type SiteContent = {
  profile: Profile;
  sections: Section[];
  updatedAt: string;
};

export const SECTION_TYPES: { type: SectionType; label: string; hint: string }[] = [
  { type: "projects", label: "Projects", hint: "detailed cards — role, stack, links, achievements" },
  { type: "skills", label: "Skills", hint: "groups of skill chips (Languages, Frameworks…)" },
  { type: "timeline", label: "Timeline / Journey", hint: "dated entries with a title and story" },
  { type: "list", label: "Numbered list", hint: "short lines, like a wall of wins" },
  { type: "text", label: "Text", hint: "free-form paragraphs" },
  { type: "contact", label: "Contact / links", hint: "email, X, GitHub, Telegram…" },
];

/** slugs that would collide with real routes */
export const RESERVED_SLUGS = ["admin", "api", "_next", "favicon.png", "robots.txt", "sitemap.xml"];
