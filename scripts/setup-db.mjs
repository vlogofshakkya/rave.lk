/**
 * Applies schema.sql and seeds starter content.
 * Usage: npm run db:setup
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Minimal .env.local loader — avoids a dotenv dependency for a CLI script. */
function loadEnvFile() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — rely on the real environment.
  }
}
loadEnvFile();

const env = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || "3306",
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
};

if (!env.DB_HOST || !env.DB_USER || !env.DB_NAME) {
  console.error(
    "Database config missing. Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME\n" +
      "in .env.local (copy .env.example) or in your environment."
  );
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@rave.lk";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "RaveLK@2026";

const conn = await mysql.createConnection({
  host: env.DB_HOST,
  port: Number(env.DB_PORT ?? 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  multipleStatements: true,
  // Aiven requires TLS.
  ssl: { rejectUnauthorized: false },
});

console.log("→ Applying schema…");
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
await conn.query(schema);
console.log("  schema applied");

// ── Admin ──────────────────────────────────────────────────────
const [admins] = await conn.query("SELECT id FROM admins LIMIT 1");
if (admins.length === 0) {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await conn.execute(
    "INSERT INTO admins (name, email, password_hash, role) VALUES (?,?,?,'owner')",
    ["Rave.LK Admin", ADMIN_EMAIL, hash]
  );
  console.log(`  admin created → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
} else {
  console.log("  admin already exists, skipped");
}

// ── Settings ───────────────────────────────────────────────────
const defaults = {
  site_title: "RAVE.LK",
  site_tagline: "Sri Lanka's Electronic Music Movement",
  hero_heading: "WHERE THE ISLAND\nLOSES CONTROL",
  hero_sub: "Sri Lanka's loudest EDM collective. Warehouse raves, beach parties and main-stage madness.",
  about_text:
    "Rave.LK builds the events that define Sri Lanka's electronic scene. From sunrise beach sessions in Hikkaduwa to warehouse takeovers in Colombo, we bring international-grade production, sound and lighting to the island — and a crowd that never stops moving.",
  contact_email: "hello@rave.lk",
  contact_phone: "+94 77 000 0000",
  instagram_url: "https://instagram.com/rave.lk",
  facebook_url: "https://facebook.com/rave.lk",
  tiktok_url: "https://tiktok.com/@rave.lk",
  youtube_url: "",
  whatsapp_number: "+94770000000",
  // Payment gateway — editable from the CMS, disabled until configured.
  payment_enabled: "0",
  payment_provider: "payhere",
  payment_sandbox: "1",
  payhere_merchant_id: "",
  payhere_merchant_secret: "",
  stripe_publishable_key: "",
  stripe_secret_key: "",
  bank_transfer_details:
    "Bank: Commercial Bank\nAccount Name: Rave.LK\nAccount No: 0000 0000 0000\nBranch: Colombo 03",
  booking_instructions:
    "Your booking is reserved for 24 hours. Our team will contact you to confirm payment and issue your e-ticket.",
};
for (const [k, v] of Object.entries(defaults)) {
  await conn.execute(
    "INSERT INTO settings (`key`, value) VALUES (?,?) ON DUPLICATE KEY UPDATE `key`=`key`",
    [k, v]
  );
}
console.log("  settings seeded");

// ── Sample events ──────────────────────────────────────────────
const [evCount] = await conn.query("SELECT COUNT(*) c FROM events");
if (evCount[0].c === 0) {
  const events = [
    {
      slug: "neon-monsoon-2026",
      title: "NEON MONSOON",
      tagline: "Colombo · Main Stage Takeover",
      description:
        "The season opener. Three stages, a 60,000-watt rig and a lineup that runs until the sun comes up. Neon Monsoon is where Colombo's electronic scene resets itself every year.",
      venue: "Port City Open Grounds",
      city: "Colombo",
      starts_at: "2026-10-24 18:00:00",
      ends_at: "2026-10-25 04:00:00",
      poster_url:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
      hero_url:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=2000&q=80",
      lineup: JSON.stringify(["Dimitri Vegas", "KSHMR", "Ranidu", "DJ Mass", "Sanuka"]),
      status: "upcoming",
      featured: 1,
    },
    {
      slug: "sunrise-sessions-hikkaduwa",
      title: "SUNRISE SESSIONS",
      tagline: "Hikkaduwa · Beach Rave",
      description:
        "Barefoot on the sand from midnight to sunrise. Deep house, melodic techno and the Indian Ocean as the backdrop.",
      venue: "Hikkaduwa Beach",
      city: "Galle",
      starts_at: "2026-12-13 22:00:00",
      ends_at: "2026-12-14 06:00:00",
      poster_url:
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
      hero_url:
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=2000&q=80",
      lineup: JSON.stringify(["Ben Böhmer", "Yasas", "Nadeemal", "Tashi"]),
      status: "upcoming",
      featured: 0,
    },
    {
      slug: "warehouse-01",
      title: "WAREHOUSE 01",
      tagline: "Colombo · Underground Techno",
      description:
        "Raw industrial techno in a converted Kelaniya warehouse. No phones on the floor, no compromise on the sound.",
      venue: "Kelaniya Industrial Yard",
      city: "Colombo",
      starts_at: "2027-02-14 21:00:00",
      poster_url:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
      hero_url:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=2000&q=80",
      lineup: JSON.stringify(["Amelie Lens", "Chamith", "Ravindu"]),
      status: "upcoming",
      featured: 0,
    },
    {
      slug: "electric-avurudu-2026",
      title: "ELECTRIC AVURUDU",
      tagline: "Negombo · New Year Festival",
      description:
        "The Sinhala & Tamil New Year, rewired. 8,000 people, two stages and a fireworks finale over the lagoon.",
      venue: "Negombo Lagoon Grounds",
      city: "Negombo",
      starts_at: "2026-04-13 17:00:00",
      ends_at: "2026-04-14 03:00:00",
      poster_url:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
      hero_url:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=2000&q=80",
      lineup: JSON.stringify(["Alan Walker", "Iraj", "Dilo", "Senaya"]),
      status: "past",
      attendance: 8200,
      featured: 0,
    },
    {
      slug: "bass-republic-2025",
      title: "BASS REPUBLIC",
      tagline: "Colombo · Bass & Dubstep",
      description:
        "The heaviest night on the calendar. Subwoofers you feel in your ribcage.",
      venue: "BMICH Open Air",
      city: "Colombo",
      starts_at: "2025-11-08 19:00:00",
      poster_url:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
      hero_url:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=80",
      lineup: JSON.stringify(["Excision", "Zomboy", "Kanchana"]),
      status: "past",
      attendance: 5400,
      featured: 0,
    },
  ];

  for (const e of events) {
    const [res] = await conn.execute(
      `INSERT INTO events (slug,title,tagline,description,venue,city,starts_at,ends_at,poster_url,hero_url,lineup,status,featured,attendance)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        e.slug, e.title, e.tagline, e.description, e.venue, e.city,
        e.starts_at, e.ends_at ?? null, e.poster_url, e.hero_url,
        e.lineup, e.status, e.featured, e.attendance ?? null,
      ]
    );
    if (e.status === "upcoming") {
      const tiers = [
        ["General Admission", 4500, "Entry to all stages", 2000],
        ["VIP", 12000, "Fast-track entry · VIP deck · Private bar", 400],
        ["Table (6 pax)", 65000, "Reserved table · Bottle service · Host", 30],
      ];
      let i = 0;
      for (const [name, price, perks, qty] of tiers) {
        await conn.execute(
          "INSERT INTO ticket_tiers (event_id,name,price,perks,quantity,sort_order) VALUES (?,?,?,?,?,?)",
          [res.insertId, name, price, perks, qty, i++]
        );
      }
    }
  }
  console.log(`  ${events.length} events seeded`);
} else {
  console.log("  events already exist, skipped");
}

// ── Sample gallery ─────────────────────────────────────────────
const [gCount] = await conn.query("SELECT COUNT(*) c FROM gallery");
if (gCount[0].c === 0) {
  const photos = [
    ["Crowd at peak", "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1400&q=80", "crowd"],
    ["Main stage lights", "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80", "stage"],
    ["Confetti drop", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80", "crowd"],
    ["Decks", "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=1400&q=80", "artists"],
    ["Laser wall", "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80", "stage"],
    ["Beach sunrise set", "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=80", "beach"],
    ["Hands up", "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=80", "crowd"],
    ["Pyro finale", "https://images.unsplash.com/photo-1465225314224-587cd83d322b?auto=format&fit=crop&w=1400&q=80", "stage"],
    ["Backstage", "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1400&q=80", "artists"],
    ["Night crowd", "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1400&q=80", "crowd"],
    ["Smoke and strobe", "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80", "stage"],
    ["Festival grounds", "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1400&q=80", "crowd"],
  ];
  let i = 0;
  for (const [title, url, cat] of photos) {
    await conn.execute(
      "INSERT INTO gallery (title,image_url,category,featured,sort_order) VALUES (?,?,?,?,?)",
      [title, url, cat, i < 6 ? 1 : 0, i++]
    );
  }
  console.log(`  ${photos.length} gallery photos seeded`);
} else {
  console.log("  gallery already has rows, skipped");
}

await conn.end();
console.log("✓ Database ready");
