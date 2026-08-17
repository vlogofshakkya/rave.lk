"use client";

import { useState } from "react";
import { deleteEventAction } from "@/app/admin/actions/events";

/**
 * Two-step delete: the confirm step requires typing the event title, so a
 * stray click can never destroy an event and its bookings.
 */
export default function DeleteEventButton({
  eventId,
  eventTitle,
}: {
  eventId: number;
  eventTitle: string;
}) {
  const [arming, setArming] = useState(false);
  const [typed, setTyped] = useState("");

  if (!arming) {
    return (
      <button
        type="button"
        onClick={() => setArming(true)}
        className="border border-hot/50 px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-hot uppercase transition-colors hover:bg-hot hover:text-void"
      >
        Delete event
      </button>
    );
  }

  return (
    <form action={deleteEventAction} className="space-y-3">
      <input type="hidden" name="id" value={eventId} />
      <p className="text-sm text-bone">
        Type <span className="font-mono text-hot">{eventTitle}</span> to confirm.
      </p>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="w-full max-w-sm border border-bone/15 bg-void px-3.5 py-2.5 text-sm text-bone outline-none focus:border-hot"
        placeholder={eventTitle}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={typed !== eventTitle}
          className="border border-hot bg-hot px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-void uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
        >
          Delete permanently
        </button>
        <button
          type="button"
          onClick={() => {
            setArming(false);
            setTyped("");
          }}
          className="border border-bone/15 px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-smoke uppercase transition-colors hover:border-bone/40 hover:text-bone"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
