import { SiteHeader } from "@/components/site-header";
import { isPublic } from "@/lib/content/normalize";
import { getContent } from "@/lib/content/store";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { profile, sections } = await getContent();
  const nav = sections
    .filter((s) => isPublic(s) && s.showInNav)
    .map((s) => ({ href: `/${s.slug}`, label: s.title }));

  return (
    <>
      <SiteHeader brand={profile.brand || profile.name} nav={nav} />
      {children}
      <footer className="mx-auto max-w-2xl px-6 pb-4">
        <p className="border-t border-border pt-4 text-xs text-muted">
          © {new Date().getFullYear()} {profile.name}
        </p>
      </footer>
    </>
  );
}
