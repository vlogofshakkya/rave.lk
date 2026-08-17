"use client";

import { useState, type ReactNode } from "react";

/**
 * Upcoming / Past switch. The inactive panel is unmounted rather than
 * hidden so the reveal animations replay when you switch back.
 */
export default function EventsTabs({
  initial = "upcoming",
  upcoming,
  past,
  upcomingCount,
  pastCount,
}: {
  initial?: "upcoming" | "past";
  upcoming: ReactNode;
  past: ReactNode;
  upcomingCount: number;
  pastCount: number;
}) {
  const [tab, setTab] = useState<"upcoming" | "past">(initial);

  const tabs = [
    { id: "upcoming" as const, label: "Upcoming", count: upcomingCount },
    { id: "past" as const, label: "Past", count: pastCount },
  ];

  return (
    <>
      <div
        role="tablist"
        aria-label="Filter events"
        className="mb-10 flex gap-2 border-b border-bone/10 md:mb-14"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                "relative -mb-px flex items-baseline gap-2 px-1 py-4 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-300 md:px-2",
                active ? "text-lime" : "text-smoke hover:text-bone",
              ].join(" ")}
            >
              {t.label}
              <span className="text-[9px] opacity-60">{t.count}</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px origin-left bg-lime transition-transform duration-500"
                style={{
                  transform: active ? "scaleX(1)" : "scaleX(0)",
                  transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </button>
          );
        })}
      </div>

      <div key={tab}>{tab === "upcoming" ? upcoming : past}</div>
    </>
  );
}
