import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Marquee from "@/components/motion/Marquee";
import Magnetic from "@/components/motion/Magnetic";
import Countdown from "@/components/site/Countdown";
import TicketTiers from "@/components/site/TicketTiers";
import GalleryGrid from "@/components/site/GalleryGrid";
import { getEventBySlug, getGallery, getTiersForEvent } from "@/lib/queries";
import { formatLongDate, formatDate } from "@/lib/utils";
import { parseLineup } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.tagline ?? event.description?.slice(0, 155) ?? undefined,
    openGraph: {
      title: event.title,
      description: event.tagline ?? undefined,
      images: event.poster_url ? [event.poster_url] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [tiers, photos] = await Promise.all([
    getTiersForEvent(event.id),
    getGallery({ limit: 8 }),
  ]);

  const lineup = parseLineup(event.lineup);
  const date = formatDate(event.starts_at);
  const isPast = event.status === "past";
  const eventPhotos = photos.filter((p) => p.event_id === event.id);
  const showPhotos = eventPhotos.length > 0 ? eventPhotos : isPast ? photos : [];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[85svh] items-end overflow-hidden bg-void pt-[var(--nav-h)]">
        <div className="absolute inset-0 z-0">
          {event.hero_url && (
            <Image
              src={event.hero_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-void/40" />
        </div>

        <div className="shell relative z-10 pb-14 md:pb-20">
          <Link
            href="/events"
            className="link-sweep mb-8 inline-block font-mono text-[10px] tracking-[0.18em] text-smoke uppercase transition-colors hover:text-lime"
          >
            ← All events
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={[
                "cut-corner-sm px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase",
                isPast ? "bg-bone/15 text-bone/70" : "bg-lime text-void",
              ].join(" ")}
            >
              {isPast ? "Past event" : "Upcoming"}
            </span>
            {event.city && (
              <span className="font-mono text-[10px] tracking-[0.16em] text-smoke uppercase">
                {event.city}
              </span>
            )}
          </div>

          <h1 data-reveal="up" className="display-xl mt-5 max-w-[16ch] text-bone">
            {event.title}
          </h1>

          {event.tagline && (
            <p data-reveal="up" className="mt-5 max-w-xl text-base text-bone/70">
              {event.tagline}
            </p>
          )}

          <dl
            className="mt-10 grid max-w-3xl grid-cols-2 gap-6 border-t border-bone/12 pt-8 md:grid-cols-4"
            data-reveal-group
            data-stagger="90"
          >
            {[
              ["Date", `${date.day} ${date.month} ${date.year}`],
              ["Doors", date.time],
              ["Venue", event.venue ?? "TBA"],
              ["City", event.city ?? "Sri Lanka"],
            ].map(([k, v]) => (
              <div key={k} data-reveal="up">
                <dt className="label-mono">{k}</dt>
                <dd className="mt-2 text-sm text-bone">{v}</dd>
              </div>
            ))}
          </dl>

          {!isPast && (
            <div data-reveal="fade" className="mt-10">
              <Countdown target={event.starts_at} />
            </div>
          )}
        </div>
      </section>

      {/* ── Lineup ticker ────────────────────────────────────── */}
      {lineup.length > 0 && (
        <section className="border-y border-bone/10 bg-lime py-4">
          <Marquee duration={24}>
            {lineup.map((a, i) => (
              <span key={i} className="flex items-center gap-6 pr-6 md:gap-10 md:pr-10">
                <span className="font-display text-xl whitespace-nowrap text-void md:text-3xl">
                  {a}
                </span>
                <span className="h-2 w-2 shrink-0 rotate-45 bg-void" />
              </span>
            ))}
          </Marquee>
        </section>
      )}

      {/* ── Detail + tickets ─────────────────────────────────── */}
      <section className="shell grid gap-14 py-20 lg:grid-cols-[1.25fr_1fr] lg:gap-20 md:py-28">
        <div>
          <p data-reveal="fade" className="eyebrow mb-4">
            The night
          </p>
          <h2 data-reveal="up" className="display-lg mb-6 text-bone">
            What to expect
          </h2>
          {event.description && (
            <p
              data-reveal="up"
              className="text-sm leading-loose whitespace-pre-line text-bone/75"
            >
              {event.description}
            </p>
          )}

          {lineup.length > 0 && (
            <div className="mt-12">
              <h3 data-reveal="fade" className="label-mono mb-5">
                Lineup
              </h3>
              <ul data-reveal-group data-stagger="70" className="flex flex-wrap gap-2">
                {lineup.map((a) => (
                  <li
                    key={a}
                    data-reveal="scale"
                    className="cut-corner-sm border border-bone/15 px-4 py-2.5 text-sm text-bone transition-colors duration-400 hover:border-lime hover:text-lime"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            data-reveal="up"
            className="mt-12 cut-corner border border-bone/12 bg-void-2 p-6"
          >
            <h3 className="label-mono mb-4">Venue</h3>
            <p className="display-md text-bone">{event.venue ?? "To be announced"}</p>
            <p className="mt-2 text-sm text-smoke">
              {formatLongDate(event.starts_at)} · Doors {date.time}
            </p>
            {event.venue && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${event.venue} ${event.city ?? "Sri Lanka"}`
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                className="link-sweep mt-4 inline-block font-mono text-[10px] tracking-[0.16em] text-lime uppercase"
              >
                Open in Maps →
              </a>
            )}
          </div>
        </div>

        {/* Tickets rail */}
        <aside className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:self-start">
          {isPast ? (
            <div className="cut-corner border border-bone/12 bg-void-2 p-7 text-center">
              <p className="label-mono mb-3">This one&apos;s done</p>
              <p className="display-md mb-4 text-bone">
                {event.attendance
                  ? `${event.attendance.toLocaleString()} were there`
                  : "Missed it?"}
              </p>
              <p className="mb-6 text-sm text-smoke">
                Catch the next one — presales go to the mailing list first.
              </p>
              <Magnetic strength={0.3}>
                <Link href="/events" className="btn btn-lime cut-corner-sm">
                  Upcoming events
                </Link>
              </Magnetic>
            </div>
          ) : (
            <TicketTiers
              tiers={tiers}
              eventId={event.id}
              eventTitle={event.title}
              ticketsOpen={event.tickets_open === 1}
              externalUrl={event.external_url}
            />
          )}
        </aside>
      </section>

      {/* ── Photos ───────────────────────────────────────────── */}
      {showPhotos.length > 0 && (
        <section className="border-t border-bone/10 bg-void-2 py-20 md:py-28">
          <div className="shell">
            <p data-reveal="fade" className="eyebrow mb-4">
              {eventPhotos.length > 0 ? "From this event" : "From the floor"}
            </p>
            <h2 data-reveal="up" className="display-lg mb-10 text-bone md:mb-14">
              Photos
            </h2>
            <GalleryGrid items={showPhotos} categories={[]} showFilters={false} />
          </div>
        </section>
      )}
    </>
  );
}
