import "server-only";
import { getPool, dbConfigured } from "./db";

/**
 * DATABASE KEEP-ALIVE
 *
 * The hosting plan suspends the MySQL service when it sees no activity, and
 * waking it costs the first visitor a multi-second stall. This pings the
 * database on an interval so it never goes idle.
 *
 * Runs in-process on the server. `globalThis` guards it so dev hot-reloads
 * and multiple route imports can't stack up timers.
 */

const INTERVAL_MS = 5_000;

declare global {
  var __raveKeepAlive: { timer: NodeJS.Timeout; started: number } | undefined;
}

let consecutiveFailures = 0;

async function ping() {
  if (!dbConfigured()) return;
  try {
    // SELECT 1 is the cheapest possible round trip — no tables touched.
    await getPool().query("SELECT 1");
    consecutiveFailures = 0;
  } catch (err) {
    consecutiveFailures++;
    // Only log the first few failures; a long outage shouldn't flood logs.
    if (consecutiveFailures <= 3) {
      console.error(
        `[keepalive] ping failed (${consecutiveFailures}):`,
        (err as Error).message
      );
    }
  }
}

export function startKeepAlive() {
  if (typeof window !== "undefined") return;
  if (global.__raveKeepAlive) return;
  if (!dbConfigured()) return;

  // unref() so the timer never holds a serverless invocation open or blocks
  // the process from exiting.
  const timer = setInterval(ping, INTERVAL_MS);
  timer.unref?.();

  global.__raveKeepAlive = { timer, started: Date.now() };

  // Prime it immediately so the very first request finds a warm connection.
  void ping();
}

export function keepAliveStatus() {
  return {
    running: Boolean(global.__raveKeepAlive),
    intervalMs: INTERVAL_MS,
    startedAt: global.__raveKeepAlive?.started ?? null,
    consecutiveFailures,
  };
}
