"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Magnetic from "@/components/motion/Magnetic";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EventRow, TicketTier } from "@/lib/types";

type Step = 0 | 1 | 2;

interface Confirmation {
  reference: string;
  total: number;
  currency: string;
  eventTitle: string;
  redirect?: { url: string; fields: Record<string, string> } | null;
}

const STEPS = ["Event", "Tickets", "Details"] as const;

export default function BookingFlow({
  events,
  tiersByEvent,
  preselectEvent,
  preselectTier,
  instructions,
  bankDetails,
  paymentEnabled,
  whatsapp,
}: {
  events: EventRow[];
  tiersByEvent: Record<number, TicketTier[]>;
  preselectEvent: number | null;
  preselectTier: number | null;
  instructions: string;
  bankDetails: string;
  paymentEnabled: boolean;
  whatsapp: string;
}) {
  const initialEvent =
    events.find((e) => e.id === preselectEvent)?.id ?? events[0]?.id ?? null;

  const [step, setStep] = useState<Step>(preselectEvent ? 1 : 0);
  const [eventId, setEventId] = useState<number | null>(initialEvent);
  const [tierId, setTierId] = useState<number | null>(preselectTier);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Confirmation | null>(null);

  const event = events.find((e) => e.id === eventId) ?? null;
  const tiers = eventId ? (tiersByEvent[eventId] ?? []) : [];
  const tier = tiers.find((t) => t.id === tierId) ?? null;

  const total = useMemo(
    () => (tier ? Number(tier.price) * qty : 0),
    [tier, qty]
  );

  const maxQty = useMemo(() => {
    if (!tier) return 10;
    if (tier.quantity === null) return 10;
    return Math.max(1, Math.min(10, tier.quantity - tier.sold));
  }, [tier]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !event || !tier) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          tierId: tier.id,
          quantity: qty,
          name: form.name,
          email: form.email,
          phone: form.phone,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      // Gateway configured → hand off to the hosted checkout.
      if (data.redirect?.url) {
        const f = document.createElement("form");
        f.method = "POST";
        f.action = data.redirect.url;
        for (const [k, v] of Object.entries(
          data.redirect.fields as Record<string, string>
        )) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          f.appendChild(input);
        }
        document.body.appendChild(f);
        f.submit();
        return;
      }

      setDone(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Confirmation ────────────────────────────────────────────
  if (done) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="cut-corner border border-lime/40 bg-lime/5 p-8 text-center md:p-12">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-lime text-2xl text-lime">
            ✓
          </div>
          <p className="eyebrow mb-4">Booking received</p>
          <h2 className="display-lg mb-4 text-bone">You&apos;re on the list</h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-bone/70">
            {instructions ||
              "Our team will contact you shortly to confirm payment and issue your e-ticket."}
          </p>

          <dl className="mx-auto mb-8 grid max-w-sm gap-3 border-y border-bone/10 py-6 text-left">
            {[
              ["Reference", done.reference],
              ["Event", done.eventTitle],
              ["Total", formatMoney(done.total, done.currency)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4">
                <dt className="label-mono">{k}</dt>
                <dd className="font-mono text-sm font-bold text-bone">{v}</dd>
              </div>
            ))}
          </dl>

          {bankDetails && (
            <div className="mb-8 text-left">
              <p className="label-mono mb-3">Payment details</p>
              <pre className="cut-corner-sm overflow-x-auto border border-bone/12 bg-void p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-bone/80">
                {bankDetails}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi Rave.LK, I just booked ${done.reference} for ${done.eventTitle}.`
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-lime cut-corner-sm"
              >
                Send payment slip
              </a>
            )}
            <Link href="/events" className="btn btn-ghost cut-corner-sm">
              Browse more events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-lg border border-dashed border-bone/15 px-6 py-20 text-center">
        <p className="display-md mb-3 text-bone">No tickets on sale</p>
        <p className="mb-6 text-sm text-smoke">
          Nothing is open for booking right now. Join the mailing list and
          you&apos;ll hear first when the next presale drops.
        </p>
        <Link href="/events" className="btn btn-ghost cut-corner-sm">
          See all events
        </Link>
      </div>
    );
  }

  const canNext = step === 0 ? Boolean(eventId) : step === 1 ? Boolean(tier) : true;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        {/* Stepper */}
        <ol className="mb-10 flex items-center gap-2 md:gap-4">
          {STEPS.map((label, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={label} className="flex flex-1 items-center gap-2 md:gap-4">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i as Step)}
                  disabled={i > step}
                  className="flex items-center gap-2.5 text-left disabled:cursor-default"
                >
                  <span
                    className={[
                      "grid h-8 w-8 shrink-0 place-items-center border font-mono text-[10px] transition-all duration-400",
                      state === "current"
                        ? "border-lime bg-lime text-void"
                        : state === "done"
                          ? "border-lime text-lime"
                          : "border-bone/20 text-smoke",
                    ].join(" ")}
                  >
                    {state === "done" ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={[
                      "hidden font-mono text-[10px] tracking-[0.16em] uppercase transition-colors sm:block",
                      state === "todo" ? "text-smoke" : "text-bone",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="h-px flex-1 bg-bone/12">
                    <span
                      className="block h-full origin-left bg-lime transition-transform duration-700"
                      style={{
                        transform: i < step ? "scaleX(1)" : "scaleX(0)",
                        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                      }}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {/* ── Step 0: event ──────────────────────────────────── */}
        {step === 0 && (
          <div key="s0" className="animate-[fade-zoom_0.45s_cubic-bezier(0.16,1,0.3,1)]">
            <h2 className="display-md mb-6 text-bone">Which night?</h2>
            <ul className="space-y-3">
              {events.map((e) => {
                const d = formatDate(e.starts_at);
                const active = eventId === e.id;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEventId(e.id);
                        setTierId(null);
                      }}
                      aria-pressed={active}
                      className={[
                        "cut-corner-sm flex w-full items-center gap-4 border p-3 text-left transition-all duration-400",
                        active
                          ? "border-lime bg-lime/8"
                          : "border-bone/12 hover:border-bone/30",
                      ].join(" ")}
                    >
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden bg-void-3">
                        {e.poster_url && (
                          <Image
                            src={e.poster_url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            "block font-display text-lg leading-tight transition-colors",
                            active ? "text-lime" : "text-bone",
                          ].join(" ")}
                        >
                          {e.title}
                        </span>
                        <span className="mt-1 block truncate font-mono text-[10px] tracking-[0.14em] text-smoke uppercase">
                          {d.day} {d.month} {d.year}
                          {e.venue ? ` · ${e.venue}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── Step 1: tier + quantity ────────────────────────── */}
        {step === 1 && (
          <div key="s1" className="animate-[fade-zoom_0.45s_cubic-bezier(0.16,1,0.3,1)]">
            <h2 className="display-md mb-6 text-bone">Pick your tier</h2>
            {tiers.length === 0 ? (
              <p className="border border-dashed border-bone/15 px-6 py-12 text-center font-mono text-[11px] tracking-[0.16em] text-smoke uppercase">
                Pricing coming soon for this event
              </p>
            ) : (
              <>
                <ul className="space-y-3">
                  {tiers.map((t) => {
                    const soldOut = t.quantity !== null && t.sold >= t.quantity;
                    const active = tierId === t.id;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          disabled={soldOut}
                          onClick={() => {
                            setTierId(t.id);
                            setQty(1);
                          }}
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
                                  "font-display text-lg leading-tight",
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
                              {soldOut && (
                                <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-hot uppercase">
                                  Sold out
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {tier && (
                  <div className="mt-8 flex items-center justify-between border-t border-bone/10 pt-6">
                    <span className="label-mono">How many?</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        aria-label="Decrease quantity"
                        className="grid h-10 w-10 place-items-center border border-bone/15 text-bone transition-colors hover:border-lime hover:text-lime"
                      >
                        −
                      </button>
                      <span className="w-14 text-center font-display text-2xl text-bone tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                        aria-label="Increase quantity"
                        className="grid h-10 w-10 place-items-center border border-bone/15 text-bone transition-colors hover:border-lime hover:text-lime"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 2: details ────────────────────────────────── */}
        {step === 2 && (
          <form
            key="s2"
            onSubmit={submit}
            className="animate-[fade-zoom_0.45s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <h2 className="display-md mb-6 text-bone">Your details</h2>
            <div className="space-y-4">
              {(
                [
                  ["name", "Full name", "text", "As it appears on your ID"],
                  ["email", "Email", "email", "For your e-ticket"],
                  ["phone", "Phone", "tel", "We'll WhatsApp your confirmation"],
                ] as const
              ).map(([key, label, type, hint]) => (
                <div key={key}>
                  <label
                    htmlFor={key}
                    className="label-mono mb-2 block"
                  >
                    {label}
                  </label>
                  <input
                    id={key}
                    type={type}
                    required
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full border border-bone/15 bg-transparent px-4 py-3.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime"
                    placeholder={hint}
                  />
                </div>
              ))}

              <div>
                <label htmlFor="notes" className="label-mono mb-2 block">
                  Anything else <span className="opacity-50">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full resize-y border border-bone/15 bg-transparent px-4 py-3.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime"
                  placeholder="Table requests, accessibility needs, group bookings…"
                />
              </div>
            </div>

            {error && (
              <p className="cut-corner-sm mt-5 border border-hot/40 bg-hot/10 px-4 py-3 font-mono text-[11px] tracking-[0.1em] text-hot uppercase">
                {error}
              </p>
            )}

            <div className="mt-8">
              <Magnetic strength={0.25} className="block">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-lime cut-corner-sm w-full disabled:opacity-60"
                >
                  {submitting
                    ? "Processing…"
                    : paymentEnabled
                      ? `Pay ${formatMoney(total, tier?.currency ?? "LKR")}`
                      : "Confirm booking"}
                </button>
              </Magnetic>
              <p className="mt-3 text-center text-[11px] text-smoke">
                {paymentEnabled
                  ? "You'll be redirected to a secure payment page."
                  : "No payment taken now — we'll confirm the details with you."}
              </p>
            </div>
          </form>
        )}

        {/* Nav */}
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-bone/10 pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
            disabled={step === 0}
            className="link-sweep font-mono text-[10px] tracking-[0.18em] text-smoke uppercase transition-colors hover:text-bone disabled:cursor-default disabled:opacity-30"
          >
            ← Back
          </button>
          {step < 2 && (
            <Magnetic strength={0.25}>
              <button
                type="button"
                onClick={() => canNext && setStep((s) => (s + 1) as Step)}
                disabled={!canNext}
                className="btn btn-lime cut-corner-sm disabled:opacity-40"
              >
                Continue →
              </button>
            </Magnetic>
          )}
        </div>
      </div>

      {/* ── Order summary ────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:self-start">
        <div className="cut-corner border border-bone/12 bg-void-2 p-6">
          <p className="label-mono mb-5">Your order</p>

          {event ? (
            <>
              <div className="mb-5 flex gap-3">
                <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-void-3">
                  {event.poster_url && (
                    <Image
                      src={event.poster_url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-tight text-bone">
                    {event.title}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] tracking-[0.14em] text-smoke uppercase">
                    {(() => {
                      const d = formatDate(event.starts_at);
                      return `${d.day} ${d.month} ${d.year}`;
                    })()}
                  </span>
                  {event.venue && (
                    <span className="mt-0.5 block text-[11px] text-smoke">
                      {event.venue}
                    </span>
                  )}
                </span>
              </div>

              <dl className="space-y-2.5 border-t border-bone/10 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-smoke">Tier</dt>
                  <dd className="text-right text-bone">{tier?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-smoke">Quantity</dt>
                  <dd className="text-bone tabular-nums">{tier ? qty : "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-smoke">Unit price</dt>
                  <dd className="text-bone tabular-nums">
                    {tier ? formatMoney(tier.price, tier.currency) : "—"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-bone/10 pt-5">
                <span className="label-mono">Total</span>
                <span className="font-display text-2xl text-lime tabular-nums">
                  {formatMoney(total, tier?.currency ?? "LKR")}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-smoke">Pick an event to get started.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
