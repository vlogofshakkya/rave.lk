/**
 * Runs once when the server process boots (Next.js instrumentation hook).
 * Used to start the database keep-alive so the hosting plan never suspends
 * the MySQL service for inactivity.
 */
export async function register() {
  // Only the Node.js runtime can hold timers or open MySQL sockets; the Edge
  // runtime also evaluates this file, so it must be skipped there.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startKeepAlive } = await import("./lib/keepalive");
  startKeepAlive();
}
