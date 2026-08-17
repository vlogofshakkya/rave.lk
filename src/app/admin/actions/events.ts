"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { execute, query, queryOne } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { fromInputDateTime, slugify } from "@/lib/utils";

export interface FormState {
  error?: string;
  ok?: string;
}

function refreshPublic(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/events");
  if (slug) revalidatePath(`/events/${slug}`);
  revalidatePath("/tickets");
  revalidatePath("/admin/events");
}

/** Ensures the slug is unique, suffixing -2, -3 … when it collides. */
async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  const root = slugify(base) || `event-${Date.now()}`;
  let candidate = root;
  let n = 1;

  for (;;) {
    const clash = await queryOne<{ id: number }>(
      "SELECT id FROM events WHERE slug = ? LIMIT 1",
      [candidate]
    );
    if (!clash || clash.id === ignoreId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

function readEventForm(fd: FormData) {
  const title = String(fd.get("title") ?? "").trim();
  const startsAt = fromInputDateTime(String(fd.get("starts_at") ?? ""));
  const endsAt = fromInputDateTime(String(fd.get("ends_at") ?? ""));

  const lineupRaw = String(fd.get("lineup") ?? "").trim();
  const lineup = lineupRaw
    ? JSON.stringify(
        lineupRaw
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    : null;

  const attendanceRaw = String(fd.get("attendance") ?? "").trim();

  return {
    title,
    startsAt,
    endsAt,
    lineup,
    tagline: String(fd.get("tagline") ?? "").trim() || null,
    description: String(fd.get("description") ?? "").trim() || null,
    venue: String(fd.get("venue") ?? "").trim() || null,
    city: String(fd.get("city") ?? "").trim() || null,
    posterUrl: String(fd.get("poster_url") ?? "").trim() || null,
    heroUrl: String(fd.get("hero_url") ?? "").trim() || null,
    externalUrl: String(fd.get("external_url") ?? "").trim() || null,
    recapVideo: String(fd.get("recap_video") ?? "").trim() || null,
    status: String(fd.get("status") ?? "upcoming"),
    featured: fd.get("featured") ? 1 : 0,
    ticketsOpen: fd.get("tickets_open") ? 1 : 0,
    attendance: attendanceRaw ? Number(attendanceRaw) : null,
    slugInput: String(fd.get("slug") ?? "").trim(),
  };
}

export async function saveEventAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  await requireSession();

  const id = Number(fd.get("id") ?? 0) || null;
  const d = readEventForm(fd);

  if (!d.title) return { error: "Give the event a title" };
  if (!d.startsAt) return { error: "Set a start date and time" };

  const slug = await uniqueSlug(d.slugInput || d.title, id ?? undefined);

  // Only one event can be featured at a time.
  if (d.featured === 1) {
    await execute("UPDATE events SET featured = 0 WHERE featured = 1");
  }

  if (id) {
    await execute(
      `UPDATE events SET
         slug=?, title=?, tagline=?, description=?, venue=?, city=?,
         starts_at=?, ends_at=?, poster_url=?, hero_url=?, lineup=?,
         status=?, featured=?, tickets_open=?, external_url=?,
         recap_video=?, attendance=?
       WHERE id=?`,
      [
        slug, d.title, d.tagline, d.description, d.venue, d.city,
        d.startsAt, d.endsAt, d.posterUrl, d.heroUrl, d.lineup,
        d.status, d.featured, d.ticketsOpen, d.externalUrl,
        d.recapVideo, d.attendance, id,
      ]
    );
    refreshPublic(slug);
    return { ok: "Event saved" };
  }

  const res = await execute(
    `INSERT INTO events
       (slug,title,tagline,description,venue,city,starts_at,ends_at,
        poster_url,hero_url,lineup,status,featured,tickets_open,
        external_url,recap_video,attendance)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      slug, d.title, d.tagline, d.description, d.venue, d.city,
      d.startsAt, d.endsAt, d.posterUrl, d.heroUrl, d.lineup,
      d.status, d.featured, d.ticketsOpen, d.externalUrl,
      d.recapVideo, d.attendance,
    ]
  );

  refreshPublic(slug);
  redirect(`/admin/events/${res.insertId}`);
}

export async function deleteEventAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;

  // Remove hosted images belonging to this event before the rows go.
  const shots = await query<{ public_id: string | null }>(
    "SELECT public_id FROM gallery WHERE event_id = ? AND public_id IS NOT NULL",
    [id]
  );
  await Promise.all(shots.map((s) => deleteImage(s.public_id!)));

  // ticket_tiers and bookings cascade; gallery rows null out their event_id.
  await execute("DELETE FROM events WHERE id = ?", [id]);

  refreshPublic();
  redirect("/admin/events");
}

// ── Ticket tiers ──────────────────────────────────────────────

export async function saveTierAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  await requireSession();

  const id = Number(fd.get("id") ?? 0) || null;
  const eventId = Number(fd.get("event_id"));
  const name = String(fd.get("name") ?? "").trim();
  const price = Number(fd.get("price") ?? 0);
  const currency = String(fd.get("currency") ?? "LKR").trim() || "LKR";
  const perks = String(fd.get("perks") ?? "").trim() || null;
  const qtyRaw = String(fd.get("quantity") ?? "").trim();
  const quantity = qtyRaw ? Number(qtyRaw) : null;
  const sortOrder = Number(fd.get("sort_order") ?? 0);
  const active = fd.get("active") ? 1 : 0;

  if (!eventId) return { error: "Missing event" };
  if (!name) return { error: "Give the tier a name" };
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a valid price" };

  if (id) {
    await execute(
      `UPDATE ticket_tiers
          SET name=?, price=?, currency=?, perks=?, quantity=?, sort_order=?, active=?
        WHERE id=? AND event_id=?`,
      [name, price, currency, perks, quantity, sortOrder, active, id, eventId]
    );
  } else {
    await execute(
      `INSERT INTO ticket_tiers (event_id,name,price,currency,perks,quantity,sort_order,active)
       VALUES (?,?,?,?,?,?,?,?)`,
      [eventId, name, price, currency, perks, quantity, sortOrder, active]
    );
  }

  const ev = await queryOne<{ slug: string }>(
    "SELECT slug FROM events WHERE id = ?",
    [eventId]
  );
  refreshPublic(ev?.slug);
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: id ? "Tier updated" : "Tier added" };
}

export async function deleteTierAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  const eventId = Number(fd.get("event_id"));
  if (!id) return;

  await execute("DELETE FROM ticket_tiers WHERE id = ?", [id]);

  const ev = await queryOne<{ slug: string }>(
    "SELECT slug FROM events WHERE id = ?",
    [eventId]
  );
  refreshPublic(ev?.slug);
  revalidatePath(`/admin/events/${eventId}`);
}
