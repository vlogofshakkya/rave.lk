import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { keepAliveStatus } from "@/lib/keepalive";

/**
 * Pings the database and reports keep-alive health.
 *
 * The in-process timer (src/lib/keepalive.ts) covers long-running servers.
 * On serverless hosts, where the process is frozen between requests, hitting
 * this route on a schedule is what actually keeps the database awake — see
 * the cron entry in vercel.json.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await query("SELECT 1");
    return NextResponse.json(
      {
        ok: true,
        latencyMs: Date.now() - started,
        timer: keepAliveStatus(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
