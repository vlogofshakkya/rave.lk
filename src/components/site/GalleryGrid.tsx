"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GalleryItem } from "@/lib/types";

/**
 * Filterable masonry grid with a keyboard-navigable lightbox.
 * Images reveal on scroll and scale under the pointer; the lightbox
 * traps focus and supports ← / → / Esc.
 */
export default function GalleryGrid({
  items,
  categories,
  showFilters = true,
}: {
  items: GalleryItem[];
  categories: string[];
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((cur) =>
        cur === null ? null : (cur + dir + visible.length) % visible.length
      ),
    [visible.length]
  );

  useEffect(() => {
    if (active === null) return;
    const lenis = window.__lenis;
    lenis?.stop();
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.body.style.overflow = "";
    };
  }, [active, close, step]);

  const current = active !== null ? visible[active] : null;

  return (
    <>
      {showFilters && categories.length > 0 && (
        <div className="no-bar mb-8 flex gap-2 overflow-x-auto pb-1 md:mb-12">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={[
                "cut-corner-sm shrink-0 border px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] uppercase transition-all duration-400",
                filter === c
                  ? "border-lime bg-lime text-void"
                  : "border-bone/15 text-smoke hover:border-bone/40 hover:text-bone",
              ].join(" ")}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="border border-dashed border-bone/15 px-6 py-16 text-center font-mono text-[11px] tracking-[0.16em] text-smoke uppercase">
          No photos here yet
        </p>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4">
          {visible.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(i)}
              data-reveal="scale"
              data-cursor="Open"
              aria-label={`Open ${item.title ?? "photo"}`}
              className="group relative mb-3 block w-full break-inside-avoid overflow-hidden bg-void-2 md:mb-4"
              style={{ transitionDelay: `${(i % 8) * 60}ms` }}
            >
              <Image
                src={item.image_url}
                alt={item.title ?? "Rave.LK event photo"}
                width={item.width ?? 800}
                height={item.height ?? 1000}
                sizes="(max-width: 768px) 48vw, (max-width: 1024px) 32vw, 24vw"
                className="h-auto w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.07]"
                style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
              />

              {/* Hover veil */}
              <span className="pointer-events-none absolute inset-0 bg-void/55 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-3 text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="block font-mono text-[9px] tracking-[0.16em] text-lime uppercase">
                  {item.category ?? "Rave.LK"}
                </span>
                {item.title && (
                  <span className="mt-1 block truncate text-xs text-bone">
                    {item.title}
                  </span>
                )}
              </span>

              {/* Corner ticks */}
              <span className="pointer-events-none absolute top-2 left-2 h-3 w-3 border-t border-l border-lime opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="pointer-events-none absolute right-2 bottom-2 h-3 w-3 border-r border-b border-lime opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title ?? "Photo"}
          className="fixed inset-0 z-[9998] grid place-items-center bg-void/96 p-4 backdrop-blur-md md:p-10"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 grid h-11 w-11 place-items-center border border-bone/20 text-bone transition-colors hover:border-lime hover:text-lime md:top-8 md:right-8"
          >
            ✕
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-3 z-10 grid h-11 w-11 place-items-center border border-bone/20 text-bone transition-colors hover:border-lime hover:text-lime md:left-8"
          >
            ←
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="absolute right-3 z-10 grid h-11 w-11 place-items-center border border-bone/20 text-bone transition-colors hover:border-lime hover:text-lime md:right-8"
          >
            →
          </button>

          <figure
            className="max-h-full w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mx-auto max-h-[76vh] w-fit">
              <Image
                key={current.id}
                src={current.image_url}
                alt={current.title ?? "Rave.LK event photo"}
                width={current.width ?? 1600}
                height={current.height ?? 1100}
                sizes="90vw"
                priority
                className="lightbox-img max-h-[76vh] w-auto object-contain"
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 border-t border-bone/10 pt-4">
              <span className="text-sm text-bone">
                {current.title ?? "Untitled"}
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-smoke uppercase">
                {active! + 1} / {visible.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
