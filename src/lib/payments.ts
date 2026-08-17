import "server-only";
import crypto from "node:crypto";
import { getSettings } from "./queries";

/**
 * Payment gateway config lives in the `settings` table, not in env vars,
 * so the client can switch provider / swap keys / flip sandbox from the
 * CMS without a redeploy.
 *
 * Until `payment_enabled` is turned on, checkout falls back to the
 * manual-confirmation flow (booking reference + bank transfer).
 */

export type Provider = "payhere" | "stripe";

export interface PaymentConfig {
  enabled: boolean;
  provider: Provider;
  sandbox: boolean;
  payhere: { merchantId: string; merchantSecret: string };
  stripe: { publishableKey: string; secretKey: string };
  bankDetails: string;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const s = await getSettings();
  const provider = (s.payment_provider === "stripe" ? "stripe" : "payhere") as Provider;

  const payhere = {
    merchantId: s.payhere_merchant_id ?? "",
    merchantSecret: s.payhere_merchant_secret ?? "",
  };
  const stripe = {
    publishableKey: s.stripe_publishable_key ?? "",
    secretKey: s.stripe_secret_key ?? "",
  };

  // "Enabled" requires both the flag AND usable credentials, so a
  // half-configured gateway can never strand a customer mid-checkout.
  const hasKeys =
    provider === "payhere"
      ? Boolean(payhere.merchantId && payhere.merchantSecret)
      : Boolean(stripe.secretKey);

  return {
    enabled: s.payment_enabled === "1" && hasKeys,
    provider,
    sandbox: s.payment_sandbox !== "0",
    payhere,
    stripe,
    bankDetails: s.bank_transfer_details ?? "",
  };
}

/** PayHere requires an MD5 hash of merchant id + order + amount + currency + hashed secret. */
export function payhereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string,
  merchantSecret: string
) {
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const amountFormatted = amount.toFixed(2);

  return crypto
    .createHash("md5")
    .update(merchantId + orderId + amountFormatted + currency + secretHash)
    .digest("hex")
    .toUpperCase();
}

/** Verifies the signature PayHere sends to the server-side notify URL. */
export function verifyPayhereNotification(
  params: Record<string, string>,
  merchantSecret: string
) {
  const secretHash = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const local = crypto
    .createHash("md5")
    .update(
      (params.merchant_id ?? "") +
        (params.order_id ?? "") +
        (params.payhere_amount ?? "") +
        (params.payhere_currency ?? "") +
        (params.status_code ?? "") +
        secretHash
    )
    .digest("hex")
    .toUpperCase();

  return local === (params.md5sig ?? "").toUpperCase();
}

export function payhereEndpoint(sandbox: boolean) {
  return sandbox
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";
}
