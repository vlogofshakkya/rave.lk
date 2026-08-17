import Image from "next/image";
import Link from "next/link";
import TiltCard from "@/components/motion/TiltCard";
import { formatDate } from "@/lib/utils";
import { parseLineup, type EventRow } from "@/lib/types";

export default function EventCard({
  event,
  index,
  variant = "grid",
}: {
  event: EventRow;
  index?: number;
  variant?: "grid" | "row";
}) {
  const date = formatDate(event.starts_at);
  const lineup = parseLineup(event.lineup);
  const isPast = event.status === "past";

  if (variant === "row") {
    return (
      <Link
        href={`/events/${event.slug}`}
        data-reveal="up"
        data-cursor="View"
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-bone/10 py-5 transition-colors duration-500 hover:border-lime/40 md:gap-8 md:py-7"
      >
        <div className="w-14 shrink-0 md:w-20">
          <div className="font-display text-2xl leading-none text-lime md:text-4xl">
            {date.day}
          </div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.16em] text-smoke uppercase">
            {date.month} {date.year}
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="display-md truncate text-bone transition-[color,transform] duration-500 group-hover:translate-x-2 group-hover:text-lime">
            {event.title}
          </h3>
          <p className="mt-1.5 truncate font-mono text-[10px] tracking-[0.14em] text-smoke uppercase">
            {[event.venue, event.city].filter(Boolean).join(" · ")}
            {lineup.length > 0 && ` · ${lineup.slice(0, 2).join(", ")}`}
          </p>
        </div>

        <span
          aria-hidden
          className="font-mono text-lg text-smoke transition-[color,transform] duration-500 group-hover:translate-x-1 group-hover:text-lime"
        >
          →
        </span>
      </Link>
    );
  }

  return (
    <article data-reveal="up" className="group">
      <TiltCard>
        <Link
          href={`/events/${event.slug}`}
          data-cursor="View"
          className="block"
        >
          <div className="cut-tr relative aspect-[3/4] overflow-hidden bg-void-2">
            {event.poster_url ? (
              <Image
                src={event.poster_url}
                alt={event.title}
                fill
                sizes="(max-width: 640px) 88vw, (max-width: 1024px) 45vw, 30vw"
                className={[
                  "object-cover transition-[transform,filter] duration-[900ms]",
                  "group-hover:scale-[1.06]",
                  isPast ? "grayscale group-hover:grayscale-0" : "",
                ].join(" ")}
                style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-void-3">
                <span className="display-md text-bone/10">RAVE</span>
              </div>
            )}

            {/* Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/25 to-transparent opacity-90" />

            {/* Sweep on hover */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 translate-y-full bg-gradient-to-t from-lime/25 to-transparent transition-transform duration-[900ms] group-hover:translate-y-0"
              style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
            />

            {/* Date chip */}
            <div className="absolute top-0 left-0 bg-lime px-3 py-2 text-void">
              <div className="font-display text-xl leading-none">{date.day}</div>
              <div className="font-mono text-[9px] leading-none tracking-[0.14em]">
                {date.month}
              </div>
            </div>

            {typeof index === "number" && (
              <span className="absolute top-3 right-3 font-mono text-[10px] tracking-[0.16em] text-bone/50">
                {String(index + 1).padStart(2, "0")}
              </span>
            )}

            {isPast && event.attendance ? (
              <span className="absolute right-3 bottom-3 cut-corner-sm border border-bone/25 bg-void/70 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-bone/80 uppercase backdrop-blur-sm">
                {event.attendance.toLocaleString()} attended
              </span>
            ) : null}

            {/* Copy */}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
              <h3 className="display-md text-bone transition-colors duration-500 group-hover:text-lime">
                {event.title}
              </h3>
              {event.tagline && (
                <p className="mt-1.5 line-clamp-1 font-mono text-[10px] tracking-[0.14em] text-smoke uppercase">
                  {event.tagline}
                </p>
              )}
              {lineup.length > 0 && (
                <p className="mt-2.5 line-clamp-1 text-xs text-bone/60">
                  {lineup.slice(0, 3).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </Link>
      </TiltCard>
    </article>
  );
}
