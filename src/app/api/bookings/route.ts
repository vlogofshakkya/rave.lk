import { NextResponse } from "next/server";
import { z } from "zod";
import { execute, queryOne } from "@/lib/db";
import { bookingReference } from "@/lib/utils";
import { getPaymentConfig, payhereEndpoint, payhereHash } from "@/lib/payments";
import { getSettings } from "@/lib/queries";
import { config } from "@/config";

const Schema = z.object({
  eventId: z.number().int().positive(),
  tierId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().min(1).max(10),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(190),
  phone: z.string().trim().min(6).max(40),
  notes: z.string().trim().max(1000).optional().default(""),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Event must be live and open.
  const event = await queryOne<{
    id: number;
    title: string;
    tickets_open: 0 | 1;
    status: string;
  }>("SELECT id, title, tickets_open, status FROM events WHERE id = ? LIMIT 1", [
    input.eventId,
  ]);

  if (!event || event.status === "draft" || event.status === "cancelled") {
    return NextResponse.json({ error: "Event not available" }, { status: 404 });
  }
  if (event.tickets_open !== 1) {
    return NextResponse.json(
      { error: "Tickets are not on sale for this event" },
      { status: 409 }
    );
  }

  // Price is read from the DB, never trusted from the client.
  let unitPrice = 0;
  let currency = "LKR";
  let tierId: number | null = null;

  if (input.tierId) {
    const tier = await queryOne<{
      id: number;
      price: string;
      currency: string;
      quantity: number | null;
      sold: number;
      active: 0 | 1;
    }>(
      "SELECT id, price, currency, quantity, sold, active FROM ticket_tiers WHERE id = ? AND event_id = ? LIMIT 1",
      [input.tierId, input.eventId]
    );

    if (!tier || tier.active !== 1) {
      return NextResponse.json({ error: "Ticket tier unavailable" }, { status: 404 });
    }
    if (tier.quantity !== null && tier.sold + input.quantity > tier.quantity) {
      const left = Math.max(0, tier.quantity - tier.sold);
      return NextResponse.json(
        {
          error:
            left === 0
              ? "That tier just sold out"
              : `Only ${left} left in that tier`,
        },
        { status: 409 }
      );
    }

    unitPrice = Number(tier.price);
    currency = tier.currency;
    tierId = tier.id;
  }

  const total = unitPrice * input.quantity;
  const reference = bookingReference();

  await execute(
    `INSERT INTO bookings
       (reference, event_id, tier_id, customer_name, email, phone,
        quantity, unit_price, total, currency, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      reference,
      input.eventId,
      tierId,
      input.name,
      input.email,
      input.phone,
      input.quantity,
      unitPrice,
      total,
      currency,
      input.notes || null,
    ]
  );

  const payment = await getPaymentConfig();

  // Gateway off (or unconfigured) → manual confirmation flow.
  if (!payment.enabled || total <= 0) {
    return NextResponse.json({
      reference,
      total,
      currency,
      eventTitle: event.title,
      redirect: null,
    });
  }

  if (payment.provider === "payhere") {
    const settings = await getSettings();
    // Prefer the configured public URL; fall back to the request origin so
    // preview deployments still round-trip correctly.
    const base = config.siteUrl || new URL(req.url).origin;

    const [firstName, ...rest] = input.name.split(" ");

    return NextResponse.json({
      reference,
      total,
      currency,
      eventTitle: event.title,
      redirect: {
        url: payhereEndpoint(payment.sandbox),
        fields: {
          merchant_id: payment.payhere.merchantId,
          return_url: `${base}/tickets/confirmation?ref=${reference}`,
          cancel_url: `${base}/tickets?cancelled=1`,
          notify_url: `${base}/api/payments/payhere/notify`,
          order_id: reference,
          items: `${event.title} × ${input.quantity}`,
          currency,
          amount: total.toFixed(2),
          first_name: firstName ?? input.name,
          last_name: rest.join(" ") || "-",
          email: input.email,
          phone: input.phone,
          address: settings.contact_address ?? "Colombo",
          city: "Colombo",
          country: "Sri Lanka",
          hash: payhereHash(
            payment.payhere.merchantId,
            reference,
            total,
            currency,
            payment.payhere.merchantSecret
          ),
        },
      },
    });
  }

  // Stripe is configured but the redirect isn't wired yet — fall back to
  // manual confirmation rather than dead-ending the customer.
  return NextResponse.json({
    reference,
    total,
    currency,
    eventTitle: event.title,
    redirect: null,
  });
}
