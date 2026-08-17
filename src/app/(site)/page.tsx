import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/home/Hero";
import TickerBand from "@/components/home/TickerBand";
import StatsBand from "@/components/home/StatsBand";
import EventCard from "@/components/site/EventCard";
import SectionHeader from "@/components/site/SectionHeader";
import GalleryGrid from "@/components/site/GalleryGrid";
import Parallax from "@/components/motion/Parallax";
import Magnetic from "@/components/motion/Magnetic";
import {
  getFeaturedEvent,
  getGallery,
  getPastEvents,
  getSettings,
  getStats,
  getUpcomingEvents,
} from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, upcoming, past, gallery, settings, stats] = await Promise.all([
    getFeaturedEvent(),
    getUpcomingEvents(6),
    getPastEvents(4),
    getGallery({ limit: 8, featuredOnly: true }),
    getSettings(),
    getStats(),
  ]);

  return (
    <>
      <Hero event={featured} settings={settings} />
      <TickerBand />

      {/* ── Upcoming ─────────────────────────────────────────── */}
      <section className="shell py-20 md:py-28">
        <SectionHeader
          eyebrow="What's next"
          title="Upcoming Events"
          copy="Presales drop first to the mailing list. When a tier sells out, it's gone."
          href="/events"
        />

        {upcoming.length === 0 ? (
          <p className="border border-dashed border-bone/15 px-6 py-20 text-center font-mono text-[11px] tracking-[0.16em] text-smoke uppercase">
            New dates landing soon
          </p>
        ) : (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            data-reveal-group
            data-stagger="120"
          >
            {upcoming.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── About ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-bone/10 noise-panel py-20 md:py-28">
        <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p data-reveal="fade" className="eyebrow mb-4">
              Who we are
            </p>
            <h2 data-reveal="up" className="display-lg text-bone">
              Built for the
              <br />
              <span className="text-lime">island&apos;s</span> dancefloor
            </h2>
            <p
              data-reveal="up"
              className="mt-6 max-w-lg text-sm leading-relaxed text-bone/70"
            >
              {settings.about_text}
            </p>

            <div
              className="mt-10 grid grid-cols-3 gap-4"
              data-reveal-group
              data-stagger="100"
            >
              {[
                ["Production", "Line-array sound, CO₂, pyro"],
                ["Talent", "International + homegrown"],
                ["Scale", "500 to 10,000 capacity"],
              ].map(([t, d]) => (
                <div key={t} data-reveal="up" className="border-t border-lime/40 pt-4">
                  <h3 className="font-mono text-[10px] tracking-[0.16em] text-lime uppercase">
                    {t}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-smoke">{d}</p>
                </div>
              ))}
            </div>

            <div data-reveal="fade" className="mt-10">
              <Magnetic strength={0.3}>
                <Link href="/about" className="btn btn-ghost cut-corner">
                  Our story
                </Link>
              </Magnetic>
            </div>
          </div>

          {/* Offset parallax image pair */}
          <div className="relative grid grid-cols-2 gap-4">
            <Parallax speed={0.12}>
              <div data-reveal="scale" className="cut-tr relative aspect-[3/4] overflow-hidden">
                <Image
                  src={
                    gallery[0]?.image_url ??
                    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80"
                  }
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 45vw, 24vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
            <Parallax speed={-0.1}>
              <div
                data-reveal="scale"
                className="cut-tr relative mt-10 aspect-[3/4] overflow-hidden"
              >
                <Image
                  src={
                    gallery[1]?.image_url ??
                    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80"
                  }
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 45vw, 24vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
          </div>
        </div>
      </section>

      <StatsBand stats={stats} />

      {/* ── Gallery preview ──────────────────────────────────── */}
      <section className="shell py-20 md:py-28">
        <SectionHeader
          eyebrow="From the floor"
          title="The Gallery"
          copy="Shot live at our events. Tap any frame to open it full size."
          href="/gallery"
          hrefLabel="All photos"
        />
        <GalleryGrid items={gallery} categories={[]} showFilters={false} />
      </section>

      {/* ── Past events ──────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="border-t border-bone/10 bg-void-2 py-20 md:py-28">
          <div className="shell">
            <SectionHeader
              eyebrow="The archive"
              title="Past Events"
              copy="Every night we've thrown, and the numbers behind them."
              href="/events?view=past"
              hrefLabel="Full archive"
            />
            <div data-reveal-group data-stagger="90">
              {past.map((e) => (
                <EventCard key={e.id} event={e} variant="row" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(107,43,255,0.5), transparent 70%)",
            animation: "pulse-glow 6s ease-in-out infinite",
          }}
        />
        <div className="shell relative text-center">
          <p data-reveal="fade" className="eyebrow mb-5">
            Doors open soon
          </p>
          <h2 data-reveal="up" className="display-xl mx-auto max-w-[14ch] text-bone">
            Don&apos;t watch
            <br />
            the <span className="text-lime">clips</span>
          </h2>
          <p
            data-reveal="up"
            className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-smoke"
          >
            Be in the room. Tickets move fast and the good tiers move fastest.
          </p>
          <div data-reveal="fade" className="mt-10">
            <Magnetic strength={0.35}>
              <Link href="/tickets" className="btn btn-lime cut-corner !px-10 !py-5">
                Book your ticket
                <span aria-hidden>→</span>
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>
    </>
  );
}
