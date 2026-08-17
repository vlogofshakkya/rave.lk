"use server";

import { revalidatePath } from "next/cache";
import { execute, queryOne } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";
import { hashPassword } from "@/lib/auth";

export interface FormState {
  error?: string;
  ok?: string;
}

// ── Gallery ───────────────────────────────────────────────────

export async function addGalleryAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  await requireSession();

  // The picker can submit several images at once.
  const urls = fd.getAll("image_url").map(String).filter(Boolean);
  const publicIds = fd.getAll("public_id").map(String);
  const widths = fd.getAll("width").map(String);
  const heights = fd.getAll("height").map(String);

  if (urls.length === 0) return { error: "Add at least one image" };

  const title = String(fd.get("title") ?? "").trim() || null;
  const category = String(fd.get("category") ?? "").trim() || null;
  const eventRaw = String(fd.get("event_id") ?? "").trim();
  const eventId = eventRaw ? Number(eventRaw) : null;
  const featured = fd.get("featured") ? 1 : 0;

  for (let i = 0; i < urls.length; i++) {
    await execute(
      `INSERT INTO gallery (event_id,title,image_url,public_id,width,height,category,featured,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        eventId,
        title,
        urls[i],
        publicIds[i] || null,
        widths[i] ? Number(widths[i]) : null,
        heights[i] ? Number(heights[i]) : null,
        category,
        featured,
        i,
      ]
    );
  }

  revalidatePath("/gallery");
  revalidatePath("/");
  revalidatePath("/admin/gallery");
  return { ok: `${urls.length} photo${urls.length > 1 ? "s" : ""} added` };
}

export async function updateGalleryAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;

  await execute(
    "UPDATE gallery SET title=?, category=?, featured=?, sort_order=? WHERE id=?",
    [
      String(fd.get("title") ?? "").trim() || null,
      String(fd.get("category") ?? "").trim() || null,
      fd.get("featured") ? 1 : 0,
      Number(fd.get("sort_order") ?? 0),
      id,
    ]
  );

  revalidatePath("/gallery");
  revalidatePath("/");
  revalidatePath("/admin/gallery");
}

export async function deleteGalleryAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;

  const row = await queryOne<{ public_id: string | null }>(
    "SELECT public_id FROM gallery WHERE id = ?",
    [id]
  );
  if (row?.public_id) await deleteImage(row.public_id);

  await execute("DELETE FROM gallery WHERE id = ?", [id]);

  revalidatePath("/gallery");
  revalidatePath("/");
  revalidatePath("/admin/gallery");
}

// ── Settings ──────────────────────────────────────────────────

/** Writes every submitted key back to the settings table. */
async function saveSettings(fd: FormData, keys: string[]) {
  for (const key of keys) {
    // Checkboxes are absent when unticked; treat them as "0".
    const raw = fd.get(key);
    const value =
      raw === null ? (key.endsWith("_enabled") || key.endsWith("_sandbox") ? "0" : "") : String(raw);

    await execute(
      "INSERT INTO settings (`key`, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      [key, value]
    );
  }
}

const SITE_KEYS = [
  "site_title",
  "site_tagline",
  "hero_heading",
  "hero_sub",
  "about_text",
  "contact_email",
  "contact_phone",
  "whatsapp_number",
  "instagram_url",
  "facebook_url",
  "tiktok_url",
  "youtube_url",
  "booking_instructions",
];

export async function saveSiteSettingsAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  await requireSession();
  await saveSettings(fd, SITE_KEYS);

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: "Settings saved" };
}

const PAYMENT_KEYS = [
  "payment_enabled",
  "payment_provider",
  "payment_sandbox",
  "payhere_merchant_id",
  "payhere_merchant_secret",
  "stripe_publishable_key",
  "stripe_secret_key",
  "bank_transfer_details",
];

export async function savePaymentSettingsAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  await requireSession();

  const enabled = fd.get("payment_enabled") ? "1" : "0";
  const provider = String(fd.get("payment_provider") ?? "payhere");

  // Refuse to switch the gateway on without the keys it needs, rather than
  // letting customers hit a broken checkout.
  if (enabled === "1") {
    if (provider === "payhere") {
      if (!String(fd.get("payhere_merchant_id") ?? "").trim()) {
        return { error: "Add your PayHere Merchant ID before enabling payments" };
      }
      if (!String(fd.get("payhere_merchant_secret") ?? "").trim()) {
        return { error: "Add your PayHere Merchant Secret before enabling payments" };
      }
    } else if (provider === "stripe") {
      if (!String(fd.get("stripe_secret_key") ?? "").trim()) {
        return { error: "Add your Stripe secret key before enabling payments" };
      }
    }
  }

  await saveSettings(fd, PAYMENT_KEYS);

  revalidatePath("/tickets");
  revalidatePath("/admin/payments");
  return { ok: "Payment settings saved" };
}

// ── Bookings ──────────────────────────────────────────────────

export async function updateBookingAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;

  const status = String(fd.get("status") ?? "pending");
  const paymentStatus = String(fd.get("payment_status") ?? "unpaid");

  const before = await queryOne<{
    payment_status: string;
    tier_id: number | null;
    quantity: number;
  }>("SELECT payment_status, tier_id, quantity FROM bookings WHERE id = ?", [id]);

  await execute(
    "UPDATE bookings SET status=?, payment_status=?, notes=? WHERE id=?",
    [status, paymentStatus, String(fd.get("notes") ?? "").trim() || null, id]
  );

  // Keep tier `sold` in step with paid/unpaid transitions so remaining
  // stock stays accurate when an admin confirms a bank transfer by hand.
  if (before?.tier_id) {
    const wasPaid = before.payment_status === "paid";
    const nowPaid = paymentStatus === "paid";
    if (!wasPaid && nowPaid) {
      await execute("UPDATE ticket_tiers SET sold = sold + ? WHERE id = ?", [
        before.quantity,
        before.tier_id,
      ]);
    } else if (wasPaid && !nowPaid) {
      await execute(
        "UPDATE ticket_tiers SET sold = GREATEST(0, sold - ?) WHERE id = ?",
        [before.quantity, before.tier_id]
      );
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function deleteBookingAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;

  const row = await queryOne<{
    payment_status: string;
    tier_id: number | null;
    quantity: number;
  }>("SELECT payment_status, tier_id, quantity FROM bookings WHERE id = ?", [id]);

  if (row?.tier_id && row.payment_status === "paid") {
    await execute(
      "UPDATE ticket_tiers SET sold = GREATEST(0, sold - ?) WHERE id = ?",
      [row.quantity, row.tier_id]
    );
  }

  await execute("DELETE FROM bookings WHERE id = ?", [id]);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

// ── Messages ──────────────────────────────────────────────────

export async function toggleMessageAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;
  await execute("UPDATE messages SET handled = 1 - handled WHERE id = ?", [id]);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessageAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;
  await execute("DELETE FROM messages WHERE id = ?", [id]);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteSubscriberAction(fd: FormData) {
  await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;
  await execute("DELETE FROM subscribers WHERE id = ?", [id]);
  revalidatePath("/admin/subscribers");
}

// ── Account ───────────────────────────────────────────────────

export async function changePasswordAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const session = await requireSession();

  const next = String(fd.get("new_password") ?? "");
  const confirm = String(fd.get("confirm_password") ?? "");

  if (next.length < 8) return { error: "Use at least 8 characters" };
  if (next !== confirm) return { error: "The two passwords don't match" };

  await execute("UPDATE admins SET password_hash = ? WHERE id = ?", [
    await hashPassword(next),
    Number(session.sub),
  ]);

  return { ok: "Password changed" };
}
