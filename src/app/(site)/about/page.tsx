import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/site/PageHeader";
import Parallax from "@/components/motion/Parallax";
import Counter from "@/components/motion/Counter";
import Magnetic from "@/components/motion/Magnetic";
import Marquee from "@/components/motion/Marquee";
import { getGallery, getSettings, getStats } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description:
    "Rave.LK builds the events that define Sri Lanka's electronic music scene — production, talent and crowds at international scale.",
};

/**
 * The three-column block is a real capability breakdown, not a decorative
 * numbered list, so it carries no 01/02/03 markers.
 */
const PILLARS = [
  {
    title: "Production",
    body: "Line-array sound, moving-head rigs, CO₂ and pyro. We spec every room from scratch rather than working to a venue's house limits.",
  },
  {
    title: "Talent",
    body: "International headliners booked alongside the Sri Lankan artists who built this scene. Both get the same stage and the same rig.",
  },
  {
    title: "Safety",
    body: "Licensed security, on-site medical, free water and trained welfare staff at every event. Nobody goes home worse than they arrived.",
  },
];

export default async function AboutPage() {
  const [settings, stats, gallery] = await Promise.all([
    getSettings(),
    getStats(),
    getGallery({ limit: 6, featuredOnly: true }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Who we are"
        title="About Rave.LK"
        copy={settings.site_tagline}
      />

      {/* Story */}
      <section className="shell grid gap-14 py-20 lg:grid-cols-[1.2fr_1fr] lg:gap-20 md:py-28">
        <div>
          <h2 data-reveal="up" className="display-lg mb-8 text-bone">
            We throw the
            <br />
            nights we wanted
            <br />
            <span className="text-lime">to go to</span>
          </h2>
          <p
            data-reveal="up"
            className="text-sm leading-loose whitespace-pre-line text-bone/75"
          >
            {settings.about_text}
          </p>
          <p data-reveal="up" className="mt-6 text-sm leading-loose text-bone/75">
            Every show starts the same way — a room, a rig and a lineup worth
            queuing for. What changes is the scale. We&apos;ve run 500-capacity
            warehouse sessions and 8,000-capacity festival grounds with the same
            crew and the same standard.
          </p>

          <div data-reveal="fade" className="mt-10 flex flex-wrap gap-3">
            <Magnetic strength={0.3}>
              <Link href="/events" className="btn btn-lime cut-corner">
                See what&apos;s next
              </Link>
            </Magnetic>
            <Magnetic strength={0.3}>
              <Link href="/contact" className="btn btn-ghost cut-corner">
                Work with us
              </Link>
            </Magnetic>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Parallax speed={0.14}>
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
          <Parallax speed={-0.12}>
            <div
              data-reveal="scale"
              className="cut-tr relative mt-12 aspect-[3/4] overflow-hidden"
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
      </section>

      {/* Pillars */}
      <section className="border-y border-bone/10 noise-panel py-20 md:py-28">
        <div className="shell">
          <p data-reveal="fade" className="eyebrow mb-4">
            How we work
          </p>
          <h2 data-reveal="up" className="display-lg mb-12 max-w-2xl text-bone">
            Three things we don&apos;t cut corners on
          </h2>
          <div
            className="grid gap-8 md:grid-cols-3 md:gap-10"
            data-reveal-group
            data-stagger="130"
          >
            {PILLARS.map((p) => (
              <div key={p.title} data-reveal="up" className="border-t border-lime/40 pt-6">
                <h3 className="display-md mb-4 text-bone">{p.title}</h3>
                <p className="text-sm leading-relaxed text-smoke">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="shell py-20 md:py-28">
        <p data-reveal="fade" className="eyebrow mb-4">
          By the numbers
        </p>
        <h2 data-reveal="up" className="display-lg mb-12 text-bone">
          The receipts
        </h2>
        <div
          className="grid grid-cols-2 gap-8 lg:grid-cols-4"
          data-reveal-group
          data-stagger="110"
        >
          {[
            { label: "Events staged", value: stats.events, suffix: "+" },
            { label: "Ravers hosted", value: stats.attendance || 25000, suffix: "+" },
            { label: "Cities", value: 6, suffix: "" },
            { label: "Artists booked", value: 84, suffix: "+" },
          ].map((s) => (
            <div key={s.label} data-reveal="up" className="border-t border-bone/12 pt-6">
              <div className="font-display text-4xl leading-none text-lime tabular-nums md:text-5xl">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-smoke uppercase">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-bone/10 bg-lime py-4">
        <Marquee duration={24}>
          {["COLOMBO", "GALLE", "NEGOMBO", "KANDY", "HIKKADUWA", "ARUGAM BAY"].map(
            (c, i) => (
              <span key={i} className="flex items-center gap-6 pr-6 md:gap-10 md:pr-10">
                <span className="font-display text-xl whitespace-nowrap text-void md:text-3xl">
                  {c}
                </span>
                <span className="h-2 w-2 shrink-0 rotate-45 bg-void" />
              </span>
            )
          )}
        </Marquee>
      </section>
    </>
  );
}
