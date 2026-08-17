import Link from "next/link";
import { AdminHeader, Card, StatTile, Badge, Empty } from "@/components/admin/ui";
import { query, queryOne } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Booking, EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [
    upcomingCount,
    pastCount,
    galleryCount,
    pendingCount,
    subsCount,
    unreadCount,
    revenue,
    recentBookings,
    nextEvents,
  ] = await Promise.all([
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM events WHERE status='upcoming'"),
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM events WHERE status='past'"),
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM gallery"),
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM bookings WHERE status='pending'"),
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM subscribers"),
    queryOne<{ c: number }>("SELECT COUNT(*) c FROM messages WHERE handled=0"),
    queryOne<{ s: string | null }>(
      "SELECT SUM(total) s FROM bookings WHERE payment_status='paid'"
    ),
    query<Booking>(
      `SELECT b.*, e.title AS event_title
         FROM bookings b JOIN events e ON e.id=b.event_id
        ORDER BY b.created_at DESC LIMIT 6`
    ),
    query<EventRow>(
      "SELECT * FROM events WHERE status='upcoming' ORDER BY starts_at ASC LIMIT 4"
    ),
  ]);

  return (
    <>
      <AdminHeader
        title="Dashboard"
        subtitle="Everything happening across the site right now."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Upcoming events" value={upcomingCount?.c ?? 0} href="/admin/events" accent />
        <StatTile label="Pending bookings" value={pendingCount?.c ?? 0} href="/admin/bookings" accent />
        <StatTile label="Gallery photos" value={galleryCount?.c ?? 0} href="/admin/gallery" />
        <StatTile label="Subscribers" value={subsCount?.c ?? 0} href="/admin/subscribers" />
        <StatTile label="Past events" value={pastCount?.c ?? 0} href="/admin/events" />
        <StatTile label="Unread messages" value={unreadCount?.c ?? 0} href="/admin/messages" />
        <StatTile
          label="Confirmed revenue"
          value={formatMoney(Number(revenue?.s ?? 0))}
          href="/admin/bookings"
          accent
        />
        <StatTile label="Quick add" value="＋" href="/admin/events/new" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent bookings */}
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="label-mono">Latest bookings</h2>
            <Link
              href="/admin/bookings"
              className="link-sweep font-mono text-[10px] tracking-[0.14em] text-lime uppercase"
            >
              All →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="py-8 text-center font-mono text-[11px] tracking-[0.14em] text-smoke uppercase">
              No bookings yet
            </p>
          ) : (
            <ul className="divide-y divide-bone/8">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-bone">{b.customer_name}</p>
                    <p className="truncate font-mono text-[10px] text-smoke">
                      {b.reference} · {b.event_title}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs text-bone">
                      {formatMoney(b.total, b.currency)}
                    </p>
                    <Badge
                      tone={
                        b.status === "confirmed"
                          ? "lime"
                          : b.status === "cancelled"
                            ? "hot"
                            : "muted"
                      }
                    >
                      {b.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Next events */}
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="label-mono">Next up</h2>
            <Link
              href="/admin/events/new"
              className="link-sweep font-mono text-[10px] tracking-[0.14em] text-lime uppercase"
            >
              Add event →
            </Link>
          </div>

          {nextEvents.length === 0 ? (
            <Empty
              title="No events yet"
              copy="Add your first event to get the site live."
              action={
                <Link href="/admin/events/new" className="btn btn-lime cut-corner-sm">
                  Add event
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-bone/8">
              {nextEvents.map((e) => {
                const d = formatDate(e.starts_at);
                return (
                  <li key={e.id}>
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="group flex items-center gap-4 py-3"
                    >
                      <span className="w-12 shrink-0">
                        <span className="block font-display text-xl leading-none text-lime">
                          {d.day}
                        </span>
                        <span className="block font-mono text-[9px] text-smoke">
                          {d.month}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-bone transition-colors group-hover:text-lime">
                          {e.title}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-smoke">
                          {e.venue ?? "Venue TBA"}
                        </span>
                      </span>
                      {e.featured === 1 && <Badge tone="lime">Featured</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
