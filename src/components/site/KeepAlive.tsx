"use client";

import { useEffect } from "react";

/**
 * Pings /api/keepalive on an interval from the browser.
 *
 * Why this exists alongside the server timer: on serverless hosts the server
 * process is frozen between requests, so an in-process interval can't run,
 * and Vercel's Hobby cron only fires once a day. A request from an open tab
 * is the one thing guaranteed to reach the database on a short cadence.
 *
 * Pauses while the tab is hidden — a background tab throttles timers anyway,
 * and pinging from tabs nobody is looking at just burns quota.
 */
export default function KeepAlive({ intervalMs = 5000 }: { intervalMs?: number }) {
  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const ping = () => {
      // keepalive:true lets the request survive a page navigation.
      fetch("/api/keepalive", { cache: "no-store", keepalive: true }).catch(() => {
        // Offline or mid-deploy — the next tick retries.
      });
    };

    const start = () => {
      if (stopped || timer !== undefined) return;
      ping();
      timer = window.setInterval(ping, intervalMs);
    };

    const stop = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return null;
}
