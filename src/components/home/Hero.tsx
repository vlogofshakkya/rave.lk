"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Magnetic from "@/components/motion/Magnetic";
import { useMounted } from "@/lib/useMounted";
import { engine } from "@/lib/motion-engine";
import { countdownParts, formatDate } from "@/lib/utils";
import type { EventRow, Settings } from "@/lib/types";

/**
 * The hero opens on the next event, not on a slogan — for a promoter the
 * most characteristic thing in their world is "what's coming and how long
 * until it". The countdown is the page's first moving element.
 */
export default function Hero({
  event,
  settings,
}: {
  event: EventRow | null;
  settings: Settings;
}) {
  const layer = useRef<HTMLDivElement>(null);
  // Drives the entrance sequence and gates the clock against hydration drift.
  const mounted = useMounted();
  const [cd, setCd] = useState(() =>
    event ? countdownParts(event.starts_at) : null
  );

  useEffect(() => {
    if (!event) return;
    const id = setInterval(() => setCd(countdownParts(event.starts_at)), 1000);
    return () => clearInterval(id);
  }, [event]);

  // Hero image drifts and scales with scroll, from the shared engine loop.
  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    if (engine.getBudget().reduceMotion) return;

    return engine.subscribe(({ scroll, viewportH, budget }) => {
      // Stop writing once the hero is well off-screen.
      if (scroll > viewportH * 1.25) return;
      const shift = scroll * 0.3 * budget.amplitude;
      el.style.transform = `translate3d(0,${shift.toFixed(1)}px,0) scale(${(1 + scroll * 0.00012).toFixed(4)})`;
    });
  }, []);

  const heading = (settings.hero_heading || "WHERE THE ISLAND\nLOSES CONTROL").split("\n");
  const date = event ? formatDate(event.starts_at) : null;

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-void pt-[var(--nav-h)]">
      {/* Backdrop */}
      {/* -top/-bottom overscan keeps the layer covering while it parallaxes. */}
      <div
        ref={layer}
        className="absolute -top-[15%] right-0 -bottom-[15%] left-0 z-0 will-change-transform"
      >
        {event?.hero_url ? (
          <Image
            src={event.hero_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
        ) : (
          <div className="absolute inset-0 bg-void-2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/75 to-void/45" />
        <div
          className="absolute inset-0 opacity-55"
          style={{
            background:
              "radial-gradient(90% 60% at 15% 100%, rgba(107,43,255,0.35) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Ambient scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #f2f0eb 0px, #f2f0eb 1px, transparent 1px, transparent 4px)",
        }}
      />

      <div className="shell relative z-10 pb-14 md:pb-20">
        {/* Eyebrow */}
        <div className="mb-6 overflow-hidden md:mb-8">
          <p
            className="eyebrow flex flex-wrap items-center gap-3"
            style={{
              transform: mounted ? "translateY(0)" : "translateY(110%)",
              opacity: mounted ? 1 : 0,
              transition: "transform 1s cubic-bezier(0.16,1,0.3,1) 200ms, opacity 0.8s ease 200ms",
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            {settings.site_tagline || "Sri Lanka's Electronic Music Movement"}
          </p>
        </div>

        {/* Headline */}
        <h1 className="display-xl max-w-[18ch] text-bone">
          {heading.map((line, i) => (
            <span key={i} className="line-mask">
              <span
                style={{
                  transform: mounted ? "translateY(0)" : "translateY(105%)",
                  transition: `transform 1.15s cubic-bezier(0.16,1,0.3,1) ${300 + i * 110}ms`,
                }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.9s ease 700ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) 700ms",
            }}
          >
            <p className="max-w-md text-base leading-relaxed text-bone/70">
              {settings.hero_sub}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.3}>
                <Link href="/tickets" className="btn btn-lime cut-corner">
                  Get Tickets
                  <span aria-hidden>→</span>
                </Link>
              </Magnetic>
              <Magnetic strength={0.3}>
                <Link href="/events" className="btn btn-ghost cut-corner">
                  See Lineup
                </Link>
              </Magnetic>
            </div>
          </div>

          {/* Next-event card with live countdown */}
          {event && (
            <div
              className="cut-corner border border-bone/12 bg-void/70 p-6 backdrop-blur-md lg:w-[24rem]"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(28px)",
                transition: "opacity 0.9s ease 850ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) 850ms",
              }}
            >
              <p className="label-mono mb-4">Next event</p>
              <Link
                href={`/events/${event.slug}`}
                className="group block"
                data-cursor="View"
              >
                <h2 className="display-md text-bone transition-colors duration-400 group-hover:text-lime">
                  {event.title}
                </h2>
                <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-smoke uppercase">
                  {date && `${date.day} ${date.month} ${date.year}`}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
              </Link>

              {cd && !cd.expired && (
                <div className="mt-6 grid grid-cols-4 gap-2 border-t border-bone/10 pt-5">
                  {(
                    [
                      ["Days", cd.days],
                      ["Hrs", cd.hours],
                      ["Min", cd.minutes],
                      ["Sec", cd.seconds],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="text-center">
                      <div className="font-display text-3xl leading-none text-lime tabular-nums">
                        {mounted ? String(value).padStart(2, "0") : "--"}
                      </div>
                      <div className="mt-1.5 font-mono text-[9px] tracking-[0.16em] text-smoke uppercase">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="shell relative z-10 flex items-center justify-between border-t border-bone/10 py-4">
        <span className="label-mono">Scroll</span>
        <div className="mx-6 h-px flex-1 bg-bone/10">
          <div
            className="h-full w-16 bg-lime"
            style={{ animation: "drift 3.2s ease-in-out infinite" }}
          />
        </div>
        <span className="label-mono hidden sm:block">
          {event?.city ?? "Colombo"} · Sri Lanka
        </span>
      </div>
    </section>
  );
}
