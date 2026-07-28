import type { Metadata } from "next";
import "./globals.css";
import { Agentation } from "agentation";

export const metadata: Metadata = {
  metadataBase: new URL("https://vikashpatanvadiya.vercel.app"),
  title: "Vikash Patanvadiya",
  description:
    "3rd-year student building web3 & AI agents on Solana. $1000 Superteam UK bounty, hackathon winner.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Vikash Patanvadiya (@VPatanvadi89747)",
    description: "Building web3 & AI agents on Solana.",
    type: "website",
  },
};

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
      </body>
    </html>
  );
}
