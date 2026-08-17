import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import BookingFlow from "@/components/site/BookingFlow";
import { getSettings, getUpcomingEvents } from "@/lib/queries";
import { getTiersForEvent } from "@/lib/queries";
import { getPaymentConfig } from "@/lib/payments";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tickets",
  description:
    "Book tickets for upcoming Rave.LK events across Sri Lanka. Choose your event, pick a tier and reserve your spot.",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; tier?: string }>;
}) {
  const { event: eventParam, tier: tierParam } = await searchParams;
  const [events, settings, payment] = await Promise.all([
    getUpcomingEvents(24),
    getSettings(),
    getPaymentConfig(),
  ]);

  const bookable = events.filter((e) => e.tickets_open === 1 && !e.external_url);

  // Pull tiers for every bookable event up front so switching events in the
  // form is instant rather than a round trip.
  const tiersByEvent = Object.fromEntries(
    await Promise.all(
      bookable.map(async (e) => [e.id, await getTiersForEvent(e.id)] as const)
    )
  );

  return (
    <>
      <PageHeader
        eyebrow="Book your spot"
        title="Tickets"
        copy={
          payment.enabled
            ? "Pick your event and tier, then pay securely online. Your e-ticket arrives by email."
            : "Pick your event and tier to reserve your spot. We'll confirm payment details with you right after."
        }
      />

      <section className="shell py-14 md:py-20">
        <BookingFlow
          events={bookable}
          tiersByEvent={tiersByEvent}
          preselectEvent={eventParam ? Number(eventParam) : null}
          preselectTier={tierParam ? Number(tierParam) : null}
          instructions={settings.booking_instructions ?? ""}
          bankDetails={payment.bankDetails}
          paymentEnabled={payment.enabled}
          whatsapp={settings.whatsapp_number ?? ""}
        />
      </section>
    </>
  );
}
