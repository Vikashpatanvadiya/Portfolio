"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme" className="text-sm text-muted hover:text-foreground transition-colors">
      {dark ? "light" : "dark"}
    </button>
  );
}

export function SiteHeader({ brand, nav }: { brand: string; nav: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur px-6">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-4">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
          {brand}
        </Link>
        <nav className="flex items-center gap-5 overflow-x-auto text-sm [scrollbar-width:none]">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap transition-colors ${active ? "text-foreground font-medium" : "text-muted hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
