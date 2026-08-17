/**
 * Creates the target database if it doesn't exist.
 * Connects to `defaultdb` first, since the target may not exist yet.
 *   node scripts/create-db.mjs
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
} catch {
  // No .env.local — rely on the real environment.
}

const target = process.env.DB_NAME;
if (!process.env.DB_HOST || !process.env.DB_USER || !target) {
  console.error("Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME first.");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // The admin database always exists; the target might not.
  database: process.env.DB_BOOTSTRAP_DB || "defaultdb",
  ssl: process.env.DB_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

await conn.query(
  `CREATE DATABASE IF NOT EXISTS \`${target}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
console.log(`✓ database \`${target}\` ready`);
await conn.end();
