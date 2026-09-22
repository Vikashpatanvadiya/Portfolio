import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionBody } from "@/components/sections";
import { isPublic } from "@/lib/content/normalize";
import { getContent } from "@/lib/content/store";
import { Rich } from "@/lib/rich-text";

async function findSection(slug: string) {
  const { sections } = await getContent();
  return sections.find((s) => s.slug === slug && isPublic(s));
}

export async function generateStaticParams() {
  const { sections } = await getContent();
  return sections.filter(isPublic).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const section = await findSection((await params).slug);
  return section ? { title: section.title, description: section.description || undefined } : {};
}

export default async function SectionPage({ params }: PageProps<"/[slug]">) {
  const section = await findSection((await params).slug);
  if (!section) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 pt-12 pb-16">
      <header className="mb-12">
        <h1 className="text-2xl font-bold mb-2">{section.title}</h1>
        {section.description && <Rich text={section.description} className="text-sm text-muted leading-relaxed max-w-lg" />}
      </header>
      <SectionBody section={section} />
    </main>
  );
}
