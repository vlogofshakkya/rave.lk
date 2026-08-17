import type { Metadata } from "next";
import Link from "next/link";
import { getBookingByReference, getSettings } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking confirmation",
  robots: { index: false },
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const [booking, settings] = await Promise.all([
    ref ? getBookingByReference(ref) : Promise.resolve(null),
    getSettings(),
  ]);

  return (
    <section className="shell flex min-h-[70svh] items-center py-24 pt-[calc(var(--nav-h)+5rem)]">
      <div className="mx-auto w-full max-w-2xl">
        {!booking ? (
          <div className="cut-corner border border-bone/12 bg-void-2 p-10 text-center">
            <p className="eyebrow mb-4">Not found</p>
            <h1 className="display-lg mb-4 text-bone">No booking here</h1>
            <p className="mb-8 text-sm text-smoke">
              That reference doesn&apos;t match a booking. Check the link in your
              email, or get in touch and we&apos;ll find it.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/tickets" className="btn btn-lime cut-corner-sm">
                Book tickets
              </Link>
              <Link href="/contact" className="btn btn-ghost cut-corner-sm">
                Contact us
              </Link>
            </div>
          </div>
        ) : (
          <div className="cut-corner border border-lime/40 bg-lime/5 p-8 text-center md:p-12">
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-lime text-2xl text-lime">
              ✓
            </div>
            <p className="eyebrow mb-4">
              {booking.payment_status === "paid" ? "Payment received" : "Booking received"}
            </p>
            <h1 className="display-lg mb-4 text-bone">
              {booking.payment_status === "paid" ? "You're in" : "Almost there"}
            </h1>
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-bone/70">
              {booking.payment_status === "paid"
                ? "Your e-ticket is on its way to your inbox. Bring your ID to the door."
                : settings.booking_instructions ||
                  "Our team will contact you shortly to confirm payment."}
            </p>

            <dl className="mx-auto grid max-w-sm gap-3 border-y border-bone/10 py-6 text-left">
              {[
                ["Reference", booking.reference],
                ["Event", booking.event_title ?? "—"],
                ["Tier", booking.tier_name ?? "General"],
                ["Quantity", String(booking.quantity)],
                ["Total", formatMoney(booking.total, booking.currency)],
                ["Status", booking.status],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4">
                  <dt className="label-mono">{k}</dt>
                  <dd className="font-mono text-sm font-bold text-bone capitalize">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {booking.event_slug && (
                <Link
                  href={`/events/${booking.event_slug}`}
                  className="btn btn-lime cut-corner-sm"
                >
                  Event details
                </Link>
              )}
              <Link href="/events" className="btn btn-ghost cut-corner-sm">
                More events
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
