import { AdminHeader, Empty, StatTile } from "@/components/admin/ui";
import BookingsTable from "@/components/admin/BookingsTable";
import { query, queryOne } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  const [bookings, pending, paid, revenue, tickets] = await Promise.all([
    query<Booking>(
      `SELECT b.*, e.title AS event_title, t.name AS tier_name
         FROM bookings b
         JOIN events e ON e.id = b.event_id
         LEFT JOIN ticket_tiers t ON t.id = b.tier_id
        ORDER BY b.created_at DESC
        LIMIT 300`
    ),
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM bookings WHERE status='pending'"),
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM bookings WHERE payment_status='paid'"),
    queryOne<{ s: string | null }>(
      "SELECT SUM(total) s FROM bookings WHERE payment_status='paid'"
    ),
    queryOne<{ s: string | null }>(
      "SELECT SUM(quantity) s FROM bookings WHERE status='confirmed'"
    ),
  ]);

  return (
    <>
      <AdminHeader
        title="Bookings"
        subtitle="Mark a booking paid once you've received the transfer — stock updates automatically."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Pending" value={pending?.c ?? 0} accent />
        <StatTile label="Paid" value={paid?.c ?? 0} />
        <StatTile label="Tickets confirmed" value={Number(tickets?.s ?? 0)} />
        <StatTile label="Revenue" value={formatMoney(Number(revenue?.s ?? 0))} accent />
      </div>

      {bookings.length === 0 ? (
        <Empty
          title="No bookings yet"
          copy="Bookings made through the site land here."
        />
      ) : (
        <BookingsTable bookings={bookings} />
      )}
    </>
  );
}
