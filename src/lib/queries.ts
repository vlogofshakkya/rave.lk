import { safeQuery, safeQueryOne, type SqlParam } from "./db";
import type {
  EventRow,
  GalleryItem,
  Settings,
  TicketTier,
  Booking,
} from "./types";

/**
 * Every public read goes through here. `status` is filtered in SQL so
 * draft rows can never leak to the public site.
 */

export async function getSettings(): Promise<Settings> {
  const rows = await safeQuery<{ key: string; value: string | null }>(
    "SELECT `key`, value FROM settings"
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await safeQueryOne<{ value: string | null }>(
    "SELECT value FROM settings WHERE `key` = ?",
    [key]
  );
  return row?.value ?? fallback;
}

export async function getUpcomingEvents(limit = 12): Promise<EventRow[]> {
  return safeQuery<EventRow>(
    `SELECT * FROM events
     WHERE status = 'upcoming'
     ORDER BY featured DESC, starts_at ASC
     LIMIT ${Number(limit)}`
  );
}

export async function getPastEvents(limit = 12): Promise<EventRow[]> {
  return safeQuery<EventRow>(
    `SELECT * FROM events
     WHERE status = 'past'
     ORDER BY starts_at DESC
     LIMIT ${Number(limit)}`
  );
}

export async function getFeaturedEvent(): Promise<EventRow | null> {
  return safeQueryOne<EventRow>(
    `SELECT * FROM events
     WHERE status = 'upcoming'
     ORDER BY featured DESC, starts_at ASC
     LIMIT 1`
  );
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  return safeQueryOne<EventRow>(
    "SELECT * FROM events WHERE slug = ? AND status <> 'draft' LIMIT 1",
    [slug]
  );
}

export async function getTiersForEvent(eventId: number): Promise<TicketTier[]> {
  return safeQuery<TicketTier>(
    `SELECT * FROM ticket_tiers
     WHERE event_id = ? AND active = 1
     ORDER BY sort_order ASC, price ASC`,
    [eventId]
  );
}

export async function getGallery(opts: {
  limit?: number;
  category?: string;
  featuredOnly?: boolean;
} = {}): Promise<GalleryItem[]> {
  const { limit = 60, category, featuredOnly } = opts;
  const where: string[] = [];
  const params: SqlParam[] = [];

  if (category && category !== "all") {
    where.push("category = ?");
    params.push(category);
  }
  if (featuredOnly) where.push("featured = 1");

  return safeQuery<GalleryItem>(
    `SELECT * FROM gallery
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY sort_order ASC, id DESC
     LIMIT ${Number(limit)}`,
    params
  );
}

export async function getGalleryCategories(): Promise<string[]> {
  const rows = await safeQuery<{ category: string | null }>(
    "SELECT DISTINCT category FROM gallery WHERE category IS NOT NULL AND category <> '' ORDER BY category"
  );
  return rows.map((r) => r.category!).filter(Boolean);
}

export async function getStats() {
  const [events, past, photos, attendance] = await Promise.all([
    safeQueryOne<{ c: number }>("SELECT COUNT(*) c FROM events WHERE status <> 'draft'"),
    safeQueryOne<{ c: number }>("SELECT COUNT(*) c FROM events WHERE status = 'past'"),
    safeQueryOne<{ c: number }>("SELECT COUNT(*) c FROM gallery"),
    safeQueryOne<{ s: number | null }>("SELECT SUM(attendance) s FROM events"),
  ]);
  return {
    events: events?.c ?? 0,
    pastEvents: past?.c ?? 0,
    photos: photos?.c ?? 0,
    attendance: Number(attendance?.s ?? 0),
  };
}

export async function getBookingByReference(ref: string): Promise<Booking | null> {
  return safeQueryOne<Booking>(
    `SELECT b.*, e.title AS event_title, e.slug AS event_slug, t.name AS tier_name
     FROM bookings b
     JOIN events e ON e.id = b.event_id
     LEFT JOIN ticket_tiers t ON t.id = b.tier_id
     WHERE b.reference = ? LIMIT 1`,
    [ref]
  );
}
