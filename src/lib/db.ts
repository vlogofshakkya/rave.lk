import mysql from "mysql2/promise";
import { config } from "@/config";

declare global {
  var __ravePool: mysql.Pool | undefined;
}

/** Values accepted as prepared-statement parameters. */
export type SqlParam = string | number | boolean | Date | null;

/**
 * Guards against a half-filled config: without this mysql2 silently falls
 * back to ''@'localhost' and fails with a confusing "Access denied" /
 * ECONNREFUSED instead of saying what is actually missing.
 */
export function dbConfigured(): boolean {
  return Boolean(config.db.host && config.db.user && config.db.database);
}

/**
 * Clever Cloud's free MySQL plan caps concurrent connections hard (5 on the
 * dev plan), so the pool is cached on globalThis to survive dev hot-reloads
 * and kept deliberately small.
 */
export function getPool(): mysql.Pool {
  if (!dbConfigured()) {
    throw new Error(
      "Database is not configured — set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME " +
        "in .env.local locally, or in Vercel → Settings → Environment Variables."
    );
  }
  if (!global.__ravePool) {
    global.__ravePool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 4,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      timezone: "Z",
      dateStrings: ["DATE"],
      // Aiven terminates non-TLS connections. rejectUnauthorized:false keeps
      // this working without shipping their CA bundle — the connection is
      // still encrypted, it just doesn't pin the certificate chain.
      ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
    });
  }
  return global.__ravePool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = []
): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: SqlParam[] = []
): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/**
 * Read for public pages that must still render if the database is missing or
 * unreachable — a build-time outage should degrade to empty content, not fail
 * the deploy. Writes and admin reads deliberately do NOT use this: there, a
 * failure must surface rather than look like success.
 */
export async function safeQuery<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
  fallback: T[] = []
): Promise<T[]> {
  try {
    return await query<T>(sql, params);
  } catch (err) {
    console.error("[db] read failed:", (err as Error).message);
    return fallback;
  }
}

export async function safeQueryOne<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = []
): Promise<T | null> {
  const rows = await safeQuery<T>(sql, params);
  return rows[0] ?? null;
}
