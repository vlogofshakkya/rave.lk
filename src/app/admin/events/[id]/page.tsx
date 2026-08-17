import { notFound } from "next/navigation";
import { AdminHeader, Card } from "@/components/admin/ui";
import EventForm from "@/components/admin/EventForm";
import TierManager from "@/components/admin/TierManager";
import DeleteEventButton from "@/components/admin/DeleteEventButton";
import { queryOne, query } from "@/lib/db";
import type { EventRow, TicketTier } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await queryOne<{ title: string }>(
    "SELECT title FROM events WHERE id = ?",
    [Number(id)]
  );
  return { title: event?.title ?? "Event" };
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();

  const event = await queryOne<EventRow>("SELECT * FROM events WHERE id = ?", [
    eventId,
  ]);
  if (!event) notFound();

  const tiers = await query<TicketTier>(
    "SELECT * FROM ticket_tiers WHERE event_id = ? ORDER BY sort_order ASC, price ASC",
    [eventId]
  );

  return (
    <>
      <AdminHeader title={event.title} subtitle={`/events/${event.slug}`} />

      <div className="space-y-8">
        <EventForm event={event} />

        <TierManager eventId={event.id} tiers={tiers} />

        <Card className="border-hot/25">
          <h2 className="label-mono mb-2">Danger zone</h2>
          <p className="mb-5 text-sm text-smoke">
            Deleting removes the event, its ticket tiers and all of its bookings.
            This can&apos;t be undone.
          </p>
          <DeleteEventButton eventId={event.id} eventTitle={event.title} />
        </Card>
      </div>
    </>
  );
}
