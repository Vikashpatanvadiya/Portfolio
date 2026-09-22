import type { Metadata } from "next";
import "./globals.css";
import { Agentation } from "agentation";
import { Analytics } from "@vercel/analytics/next";
import { getContent } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getContent();
  const title = profile.name || "Portfolio";
  return {
    metadataBase: URL.canParse(profile.siteUrl) ? new URL(profile.siteUrl) : new URL("https://bansi.me"),
    title: { default: title, template: `%s | ${title}` },
    description: profile.seoDescription || profile.headline,
    icons: { icon: "/favicon.png" },
    openGraph: {
      title,
      description: profile.headline || profile.seoDescription,
      type: "website",
    },
  };
}

// Set the theme before paint to avoid a flash. Defaults to dark (X style)
// unless the visitor has explicitly chosen light.
const themeScript = `
  (function () {
    try {
      var t = localStorage.getItem('theme');
      if (t !== 'light') document.documentElement.classList.add('dark');
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
        <Analytics />
      </body>
    </html>
  );
}
