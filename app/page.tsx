"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  content                                                             */
/* ------------------------------------------------------------------ */
const profile = {
  name: "Vikash Patanvadiya",
  handle: "VPatanvadi89747",
  location: "India",
  x: "https://x.com/VPatanvadi89747",
};

const projects = [
  {
    name: "Medialayer",
    tag: "web3",
    blurb: "on-chain media & content layer — my flagship build.",
    live: "https://medialayer.app",
    repo: "https://github.com/Vikashpatanvadiya/Medialayer",
  },
  {
    name: "Sathi-AI",
    tag: "ai",
    blurb: "an AI companion that actually helps.",
    live: "https://www.youtube.com/watch?v=AcGQ3MWQQq8",
    liveLabel: "demo",
    repo: "https://github.com/Vikashpatanvadiya/Sathi-AI",
  },
  {
    name: "Superteam Malaysia",
    tag: "web",
    blurb: "community site for Superteam Malaysia.",
    live: "https://superteam-malysia.vercel.app",
    repo: "https://github.com/Vikashpatanvadiya/superteam_malysia",
  },
  {
    name: "Pantry",
    tag: "web",
    blurb: "a smart pantry & inventory tracker.",
    live: "https://pantry-pantry-tracker.vercel.app",
    repo: "https://github.com/Vikashpatanvadiya/Pantry",
  },
  {
    name: "Scrolly",
    tag: "web",
    blurb: "a scroll-driven interactive web experience.",
    live: "https://scrolly-beta.vercel.app",
    repo: "https://github.com/Vikashpatanvadiya/scrolly",
  },
  {
    name: "Beenas",
    tag: "web",
    blurb: "a demo web experience built for a client.",
    live: "https://beenas-demoweb.vercel.app",
    repo: "https://github.com/Vikashpatanvadiya/beenas_demoweb",
  },
];

const wins: { segments: ({ text: string; href?: string })[] }[] = [
  {
    segments: [
      { text: "Won a US$1,000 bounty from " },
      { text: "Superteam UK", href: "https://x.com/SuperteamUK" },
      { text: "." },
    ],
  },
  {
    segments: [
      { text: "Won in a Web2 Hackathon by developing a Smart Attendance System." },
    ],
  },
];

const socials = [
  { label: "x (twitter)", href: "https://x.com/VPatanvadi89747" },
  { label: "github", href: "https://github.com/Vikashpatanvadiya" },
  { label: "instagram", href: "https://www.instagram.com/bansi.here/" },
  { label: "photography", href: "https://www.instagram.com/b1_clicks/" },
  { label: "telegram", href: "https://t.me/Bansidev" },
  { label: "email", href: "mailto:vpatanvadiya2022@gmail.com" },
];

/* ------------------------------------------------------------------ */
/*  theme                                                               */
/* ------------------------------------------------------------------ */
function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };
  return { dark, toggle };
}

/* ------------------------------------------------------------------ */
/*  page                                                                */
/* ------------------------------------------------------------------ */
export default function Home() {
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState<"about" | "projects" | "wins" | "contact">("about");
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      {/* top bar — constrained to same width as content */}
      <div className="w-full px-6 pt-6 sm:pt-8 mb-3">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <a
            href="/"
            className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity"
          >
            vikash.code
          </a>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            {dark ? "light" : "dark"}
          </button>
        </div>
      </div>

    <main className="mx-auto min-h-screen max-w-2xl pb-16 sm:pb-24">

      {/* banner — full width, no px so it bleeds to max-w-2xl edges */}
      <div className="relative mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner.jpg"
          alt="banner"
          className="w-full object-cover"
          style={{ height: "200px" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        {/* avatar overlapping banner bottom-left */}
        <div className="px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/profile.jpg"
            alt={profile.name}
            onClick={() => setLightbox(true)}
            className="h-24 w-24 rounded-2xl object-cover border-4 border-background -mt-12 relative z-10 cursor-pointer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      </div>

      {/* lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
          onClick={() => setLightbox(false)}
        >
          {/* close button */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/profile.jpg"
            alt={profile.name}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* content */}
      <div className="px-6">

        {/* hero */}
        <section className="mb-10 mt-3">
          <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
          <p className="text-base leading-relaxed max-w-lg">
            3rd-year student (grad 2028). building web3 &amp; AI agents on Solana.
          </p>
        </section>

        {/* nav */}
        <nav className="mb-10 flex gap-6 text-sm border-b border-border pb-4">
          {(["about", "projects", "wins", "contact"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`transition-colors capitalize ${
                tab === t ? "text-foreground font-medium" : "text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {/* about */}
        {tab === "about" && (
          <section className="space-y-4 text-sm leading-relaxed max-w-lg">
            <p>
              based in India. i&apos;m a 3rd-year student who loves to code and ship
              fast. i started on the web2 side — trackers, community sites, interactive
              experiences — and i&apos;m now going all-in on web3 &amp; AI agents on Solana.
            </p>
            <p>
              right now i&apos;m focused on showing up <strong>consistently</strong> —
              building and learning in web3, week after week. i document the whole
              journey in the open, so if you want to follow along it&apos;s all on{" "}
              <a href={profile.x} target="_blank" rel="noreferrer">X</a>.
            </p>
            <p>
              outside of code, i play cricket, shoot photography (
              <a href="https://www.instagram.com/b1_clicks/" target="_blank" rel="noreferrer">
                @b1_clicks
              </a>
              ), and always have music on. i love to travel too — but i&apos;m holding
              off for now. i want to travel with my family, on money i earn myself.
              that&apos;s the trip i&apos;m building toward.
            </p>
          </section>
        )}

        {/* projects */}
        {tab === "projects" && (
          <section className="space-y-8">
            {projects.map((p) => (
              <div key={p.name}>
                <div className="flex items-baseline gap-2 mb-1">
                  <h2 className="font-medium">{p.name}</h2>
                  <span className="text-xs text-muted">{p.tag}</span>
                </div>
                <p className="text-sm text-muted mb-2">{p.blurb}</p>
                <div className="flex gap-4 text-sm">
                  <a href={p.live} target="_blank" rel="noreferrer">
                    {p.liveLabel ?? "live"} ↗
                  </a>
                  <a href={p.repo} target="_blank" rel="noreferrer">
                    code ↗
                  </a>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* wins */}
        {tab === "wins" && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">wall of wins</h2>
            {wins.map((w, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-muted text-sm tabular-nums">{i + 1}.</span>
                <span className="text-sm">
                  {w.segments.map((s, j) =>
                    s.href ? (
                      <a key={j} href={s.href} target="_blank" rel="noreferrer">{s.text}</a>
                    ) : (
                      <span key={j}>{s.text}</span>
                    )
                  )}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* contact */}
        {tab === "contact" && (
          <section>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                  {s.label} ↗
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 text-xs text-muted">
          © {new Date().getFullYear()} {profile.name}
        </footer>

      </div>
    </main>
    </>
  );
}
