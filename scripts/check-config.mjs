/**
 * Verifies the environment is configured and the database is reachable.
 *   npm run check
 */
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  console.log("Loaded .env.local");
} catch {
  console.log("No .env.local — using the ambient environment");
}

const REQUIRED = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "AUTH_SECRET"];
const OPTIONAL = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];

let missing = 0;
console.log("\nRequired:");
for (const k of REQUIRED) {
  const v = process.env[k];
  const shown = !v ? "MISSING" : /PASSWORD|SECRET/.test(k) ? "(set)" : v;
  if (!v) missing++;
  console.log(`  ${v ? "✓" : "✗"} ${k.padEnd(24)} ${shown}`);
}

console.log("\nOptional:");
for (const k of OPTIONAL) {
  const v = process.env[k];
  console.log(
    `  ${v ? "✓" : "–"} ${k.padEnd(24)} ${
      !v ? "(not set)" : /SECRET|KEY/.test(k) ? "(set)" : v
    }`
  );
}

if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 16) {
  console.error("\n✗ AUTH_SECRET is too short — use at least 16 characters.");
  missing++;
}

if (missing) {
  console.error(`\n✗ ${missing} problem(s). Copy .env.example to .env.local and fill it in.`);
  process.exit(1);
}

try {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "false" ? undefined : { rejectUnauthorized: false },
  });
  const [[row]] = await conn.query("SELECT COUNT(*) AS c FROM events");
  console.log(`\n✓ Connected to \`${process.env.DB_NAME}\` — ${row.c} events.`);
  await conn.end();
} catch (err) {
  console.error(`\n✗ Could not connect: ${err.message}`);
  process.exit(1);
}
