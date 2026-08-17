import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import EventCard from "@/components/site/EventCard";
import EventsTabs from "@/components/site/EventsTabs";
import { getPastEvents, getUpcomingEvents } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Events",
  description:
    "Every Rave.LK event — upcoming shows across Sri Lanka and the full archive of past nights.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(24),
    getPastEvents(24),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="The calendar"
        title="Events"
        copy="Every night we've announced and every one we've already thrown. Tickets for upcoming shows go live here first."
      />

      <section className="shell py-14 md:py-20">
        <EventsTabs
          initial={view === "past" ? "past" : "upcoming"}
          upcomingCount={upcoming.length}
          pastCount={past.length}
          upcoming={
            upcoming.length === 0 ? (
              <p className="border border-dashed border-bone/15 px-6 py-20 text-center font-mono text-[11px] tracking-[0.16em] text-smoke uppercase">
                New dates landing soon
              </p>
            ) : (
              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
                data-reveal-group
                data-stagger="110"
              >
                {upcoming.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            )
          }
          past={
            past.length === 0 ? (
              <p className="border border-dashed border-bone/15 px-6 py-20 text-center font-mono text-[11px] tracking-[0.16em] text-smoke uppercase">
                The archive is empty
              </p>
            ) : (
              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
                data-reveal-group
                data-stagger="110"
              >
                {past.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            )
          }
        />
      </section>
    </>
  );
}
