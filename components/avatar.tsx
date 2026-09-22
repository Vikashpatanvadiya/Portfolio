"use client";

import { useEffect, useState } from "react";

/* Avatar that opens a full-size lightbox on click. */
export function Avatar({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src || hidden) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        onError={() => setHidden(true)}
        className="h-24 w-24 rounded-2xl object-cover border-4 border-background -mt-12 relative z-10 cursor-pointer"
      />
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export function Banner({ src }: { src: string }) {
  const [hidden, setHidden] = useState(false);
  if (!src || hidden) return <div className="h-14" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-full object-cover sm:rounded-b-xl" style={{ height: 200 }} onError={() => setHidden(true)} />
  );
}
