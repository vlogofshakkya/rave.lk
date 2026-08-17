"use client";

import Link from "next/link";
import { useState } from "react";
import Magnetic from "@/components/motion/Magnetic";
import { formatMoney } from "@/lib/utils";
import type { TicketTier } from "@/lib/types";

export default function TicketTiers({
  tiers,
  eventId,
  eventTitle,
  ticketsOpen,
  externalUrl,
}: {
  tiers: TicketTier[];
  eventId: number;
  eventTitle: string;
  ticketsOpen: boolean;
  externalUrl: string | null;
}) {
  const [selected, setSelected] = useState<number | null>(tiers[0]?.id ?? null);

  if (!ticketsOpen) {
    return (
      <div className="cut-corner border border-bone/12 bg-void-2 p-7 text-center">
        <p className="label-mono mb-3">Tickets</p>
        <p className="display-md mb-3 text-bone">Not on sale yet</p>
        <p className="text-sm text-smoke">
          Join the mailing list to get the presale link before anyone else.
        </p>
      </div>
    );
  }

  if (externalUrl) {
    return (
      <div className="cut-corner border border-bone/12 bg-void-2 p-7 text-center">
        <p className="label-mono mb-3">Tickets</p>
        <p className="display-md mb-5 text-bone">On sale now</p>
        <Magnetic strength={0.3}>
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-lime cut-corner-sm"
          >
            Buy tickets →
          </a>
        </Magnetic>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="cut-corner border border-bone/12 bg-void-2 p-7 text-center">
        <p className="label-mono mb-3">Tickets</p>
        <p className="display-md mb-3 text-bone">Coming soon</p>
        <p className="text-sm text-smoke">Pricing is being finalised.</p>
      </div>
    );
  }

  return (
    <div className="cut-corner border border-bone/12 bg-void-2 p-6 md:p-7">
      <div className="mb-6 flex items-baseline justify-between">
        <p className="label-mono">Tickets</p>
        <p className="font-mono text-[10px] tracking-[0.14em] text-lime uppercase">
          {tiers.length} tiers
        </p>
      </div>

      <ul className="space-y-2.5">
        {tiers.map((t) => {
          const soldOut =
            t.quantity !== null && t.sold >= t.quantity;
          const remaining =
            t.quantity !== null ? Math.max(0, t.quantity - t.sold) : null;
          const active = selected === t.id;

          return (
            <li key={t.id}>
              <button
                type="button"
                disabled={soldOut}
                onClick={() => setSelected(t.id)}
                aria-pressed={active}
                className={[
                  "cut-corner-sm w-full border p-4 text-left transition-all duration-400",
                  soldOut
                    ? "cursor-not-allowed border-bone/8 opacity-40"
                    : active
                      ? "border-lime bg-lime/8"
                      : "border-bone/12 hover:border-bone/30",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3
                      className={[
                        "font-display text-lg leading-tight transition-colors",
                        active ? "text-lime" : "text-bone",
                      ].join(" ")}
                    >
                      {t.name}
                    </h3>
                    {t.perks && (
                      <p className="mt-1.5 text-xs leading-relaxed text-smoke">
                        {t.perks}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-sm font-bold whitespace-nowrap text-bone">
                      {formatMoney(t.price, t.currency)}
                    </div>
                    {soldOut ? (
                      <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-hot uppercase">
                        Sold out
                      </div>
                    ) : remaining !== null && remaining <= 50 ? (
                      <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-lime uppercase">
                        {remaining} left
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <Magnetic strength={0.25} className="block">
          <Link
            href={`/tickets?event=${eventId}${selected ? `&tier=${selected}` : ""}`}
            className="btn btn-lime cut-corner-sm w-full"
          >
            Book now →
          </Link>
        </Magnetic>
        <p className="mt-3 text-center font-mono text-[9px] tracking-[0.14em] text-smoke uppercase">
          {eventTitle}
        </p>
      </div>
    </div>
  );
}
