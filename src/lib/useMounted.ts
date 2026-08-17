"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false during SSR and the first client render, true afterwards.
 *
 * Used to gate values that differ between server and client (clocks,
 * countdowns) so the first paint matches the server HTML instead of
 * hydrating mismatched. useSyncExternalStore rather than a setState-in-
 * effect, which triggers an avoidable cascading render.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
