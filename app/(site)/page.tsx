import Link from "next/link";
import { Avatar, Banner } from "@/components/avatar";
import { ProjectCard } from "@/components/sections";
import { isPublic } from "@/lib/content/normalize";
import { getContent } from "@/lib/content/store";
import { Inline, Rich, lines, safeHref } from "@/lib/rich-text";

const button =
  "inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm transition-colors hover:bg-hover hover:opacity-100";

export default async function Home() {
  const { profile, sections } = await getContent();
  const visible = sections.filter(isPublic);
  const featured = visible
    .flatMap((s) => (s.type === "projects" ? s.items.filter((p) => p.featured).map((p) => ({ p, slug: s.slug })) : []))
    .slice(0, 3);
  const resume = safeHref(profile.resumeUrl);

  return (
    <main className="mx-auto max-w-2xl pb-6">
      <div className="relative mb-4">
        <Banner src={profile.banner} />
        <div className="px-6">
          <Avatar src={profile.avatar} alt={profile.name} />
        </div>
      </div>

      <div className="px-6">
        <section className="mb-6 mt-2">
          <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
          {profile.headline && <p className="text-base leading-relaxed max-w-lg">{profile.headline}</p>}
          {lines(profile.highlights).length > 0 && (
            <ul className="mt-3 space-y-0.5 text-sm text-muted">
              {lines(profile.highlights).map((h, i) => (
                <li key={i}>
                  <Inline text={h} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {profile.bio && <Rich text={profile.bio} className="space-y-4 text-sm leading-relaxed max-w-lg mb-8" />}

        <div className={`flex flex-wrap gap-2 ${featured.length ? "mb-16" : ""}`}>
          {visible
            .filter((s) => s.showInNav)
            .map((s) => (
              <Link key={s.id} href={`/${s.slug}`} className={button}>
                {s.title} <span aria-hidden>→</span>
              </Link>
            ))}
          {resume && (
            <a href={resume} target="_blank" rel="noreferrer" className={button}>
              Resume <span aria-hidden>↗</span>
            </a>
          )}
        </div>

        {featured.length > 0 && (
          <section>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">featured</h2>
              <Link href={`/${featured[0].slug}`} className="text-sm text-muted">
                see all →
              </Link>
            </div>
            <div className="space-y-8">
              {featured.map(({ p }) => (
                <ProjectCard key={p.id} p={p} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
