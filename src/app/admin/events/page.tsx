import Image from "next/image";
import Link from "next/link";
import { AdminHeader, Badge, Empty } from "@/components/admin/ui";
import { query } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function AdminEventsPage() {
  const events = await query<EventRow & { tier_count: number; booking_count: number }>(
    `SELECT e.*,
            (SELECT COUNT(*) FROM ticket_tiers t WHERE t.event_id = e.id) AS tier_count,
            (SELECT COUNT(*) FROM bookings b WHERE b.event_id = e.id) AS booking_count
       FROM events e
      ORDER BY FIELD(e.status,'upcoming','draft','past','cancelled'), e.starts_at DESC`
  );

  return (
    <>
      <AdminHeader
        title="Events"
        subtitle="Add, edit and publish events. Featured events lead the homepage."
        action={
          <Link href="/admin/events/new" className="btn btn-lime cut-corner-sm">
            Add event
          </Link>
        }
      />

      {events.length === 0 ? (
        <Empty
          title="No events yet"
          copy="Create your first event and it appears on the site straight away."
          action={
            <Link href="/admin/events/new" className="btn btn-lime cut-corner-sm">
              Add event
            </Link>
          }
        />
      ) : (
        <div className="cut-corner-sm overflow-x-auto border border-bone/12 bg-void-2">
          <table className="w-full min-w-[46rem] text-left">
            <thead>
              <tr className="border-b border-bone/10">
                {["Event", "Date", "Status", "Tiers", "Bookings", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-smoke uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-bone/8">
              {events.map((e) => {
                const d = formatDate(e.starts_at);
                return (
                  <tr key={e.id} className="transition-colors hover:bg-bone/3">
                    <td className="px-4 py-3">
                      <Link href={`/admin/events/${e.id}`} className="group flex items-center gap-3">
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden bg-void-3">
                          {e.poster_url && (
                            <Image
                              src={e.poster_url}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm text-bone transition-colors group-hover:text-lime">
                              {e.title}
                            </span>
                            {e.featured === 1 && <Badge tone="lime">Featured</Badge>}
                          </span>
                          <span className="block truncate font-mono text-[10px] text-smoke">
                            {e.venue ?? "Venue TBA"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-smoke">
                      {d.day} {d.month} {d.year}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          e.status === "upcoming"
                            ? "lime"
                            : e.status === "cancelled"
                              ? "hot"
                              : "muted"
                        }
                      >
                        {e.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-bone tabular-nums">
                      {e.tier_count}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-bone tabular-nums">
                      {e.booking_count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="link-sweep font-mono text-[10px] tracking-[0.14em] text-lime uppercase"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
