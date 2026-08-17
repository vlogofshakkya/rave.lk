export type EventStatus = "draft" | "upcoming" | "past" | "cancelled";

export interface EventRow {
  id: number;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  venue: string | null;
  city: string | null;
  starts_at: string;
  ends_at: string | null;
  poster_url: string | null;
  hero_url: string | null;
  lineup: string | null;
  status: EventStatus;
  featured: 0 | 1;
  tickets_open: 0 | 1;
  external_url: string | null;
  recap_video: string | null;
  attendance: number | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TicketTier {
  id: number;
  event_id: number;
  name: string;
  price: string | number;
  currency: string;
  perks: string | null;
  quantity: number | null;
  sold: number;
  sort_order: number;
  active: 0 | 1;
}

export interface GalleryItem {
  id: number;
  event_id: number | null;
  title: string | null;
  image_url: string;
  public_id: string | null;
  width: number | null;
  height: number | null;
  category: string | null;
  featured: 0 | 1;
  sort_order: number;
  created_at?: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "refunded";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export interface Booking {
  id: number;
  reference: string;
  event_id: number;
  tier_id: number | null;
  customer_name: string;
  email: string;
  phone: string;
  quantity: number;
  unit_price: string | number;
  total: string | number;
  currency: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  // joined
  event_title?: string;
  event_slug?: string;
  tier_name?: string | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin";
  created_at?: string;
}

export type Settings = Record<string, string>;

/** Parses the JSON-encoded lineup column, tolerating legacy comma strings. */
export function parseLineup(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
