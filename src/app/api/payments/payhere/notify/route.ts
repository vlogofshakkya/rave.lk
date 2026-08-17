import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { getPaymentConfig, verifyPayhereNotification } from "@/lib/payments";

/**
 * PayHere server-to-server callback. This — not the browser return_url —
 * is the only thing allowed to mark a booking paid, because the signature
 * is what proves the amount actually cleared.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => (params[k] = String(v)));

  const payment = await getPaymentConfig();
  if (!payment.payhere.merchantSecret) {
    return NextResponse.json({ error: "Gateway not configured" }, { status: 503 });
  }

  if (!verifyPayhereNotification(params, payment.payhere.merchantSecret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const reference = params.order_id;
  const booking = await queryOne<{ id: number; total: string; currency: string }>(
    "SELECT id, total, currency FROM bookings WHERE reference = ? LIMIT 1",
    [reference]
  );
  if (!booking) {
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }

  // status_code 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargedback
  const code = Number(params.status_code);
  const paidAmount = Number(params.payhere_amount);
  const expected = Number(booking.total);

  if (code === 2) {
    // Guard against a tampered amount that still carries a valid signature
    // for a different total.
    if (Math.abs(paidAmount - expected) > 0.01) {
      await execute(
        "UPDATE bookings SET payment_status = 'failed', notes = CONCAT(COALESCE(notes,''), '\n[amount mismatch]') WHERE id = ?",
        [booking.id]
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    await execute(
      `UPDATE bookings
         SET status = 'confirmed', payment_status = 'paid',
             payment_method = 'payhere', payment_ref = ?
       WHERE id = ?`,
      [params.payment_id ?? null, booking.id]
    );

    // Only count the sale once it is actually paid.
    await execute(
      `UPDATE ticket_tiers t
         JOIN bookings b ON b.tier_id = t.id
          SET t.sold = t.sold + b.quantity
        WHERE b.id = ?`,
      [booking.id]
    );
  } else if (code === -1 || code === -2) {
    await execute(
      "UPDATE bookings SET payment_status = 'failed', status = 'cancelled' WHERE id = ?",
      [booking.id]
    );
  } else if (code === -3) {
    await execute(
      "UPDATE bookings SET payment_status = 'refunded', status = 'refunded' WHERE id = ?",
      [booking.id]
    );
  }

  return NextResponse.json({ ok: true });
}
