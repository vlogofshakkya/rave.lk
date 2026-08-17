export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** MySQL DATETIME strings are UTC-naive; parse them without TZ shifting. */
export function parseDbDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const s = String(value).replace(" ", "T");
  return new Date(s.endsWith("Z") ? s : `${s}Z`);
}

export function formatDate(value: string | Date) {
  const d = parseDbDate(value);
  return {
    day: String(d.getUTCDate()).padStart(2, "0"),
    month: MONTHS[d.getUTCMonth()],
    year: String(d.getUTCFullYear()),
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase(),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }),
  };
}

export function formatLongDate(value: string | Date) {
  const d = parseDbDate(value);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMoney(amount: number | string, currency = "LKR") {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return `${currency} 0`;
  return `${currency} ${n.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

/** For datetime-local inputs, which expect local-naive "YYYY-MM-DDTHH:mm". */
export function toInputDateTime(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = parseDbDate(value);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** Converts a datetime-local value back to a MySQL DATETIME string. */
export function fromInputDateTime(value: string): string | null {
  if (!value) return null;
  return value.replace("T", " ") + (value.length === 16 ? ":00" : "");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function bookingReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RAVE-${out}`;
}

export function countdownParts(target: string | Date, from: Date = new Date()) {
  const diff = parseDbDate(target).getTime() - from.getTime();
  const clamped = Math.max(0, diff);
  return {
    expired: diff <= 0,
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped / 3_600_000) % 24),
    minutes: Math.floor((clamped / 60_000) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
  };
}
