import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  kind: "github" | "youtube" | "twitter" | "loom" | "generic";
  embedUrl: string | null; // non-null means we can embed it
};

function detectKind(url: string): LinkPreview["kind"] {
  if (/github\.com/i.test(url)) return "github";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  if (/loom\.com/i.test(url)) return "loom";
  return "generic";
}

/** Turn a watch URL into an embed URL for iframeable services. */
function embedUrl(url: string, kind: LinkPreview["kind"]): string | null {
  if (kind === "youtube") {
    const yt = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  }
  if (kind === "loom") {
    const lm = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (lm) return `https://www.loom.com/embed/${lm[1]}`;
  }
  return null;
}

function meta(doc: string, prop: string): string {
  const m =
    doc.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ||
    doc.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i")) ||
    doc.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ||
    doc.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, "i"));
  return m ? m[1].trim() : "";
}

function titleTag(doc: string): string {
  const m = doc.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "";
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "missing url" }, { status: 400 });

  let url: string;
  try {
    url = new URL(raw).href;
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const kind = detectKind(url);
  const embed = embedUrl(url, kind);

  // For services where we already know the embed, skip fetching
  // For GitHub we want to fetch to get real metadata
  let title = "";
  let description = "";
  let image = "";
  let siteName = "";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(5000),
      cache: "force-cache",
    });
    const html = await res.text();
    title = meta(html, "og:title") || titleTag(html);
    description = meta(html, "og:description") || meta(html, "description");
    image = meta(html, "og:image");
    siteName = meta(html, "og:site_name");
  } catch {
    // network failure — return what we have (kind + embed)
  }

  const preview: LinkPreview = {
    url,
    title,
    description,
    image,
    siteName,
    kind,
    embedUrl: embed,
  };

  return NextResponse.json(preview, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
