"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  savePaymentSettingsAction,
  type FormState,
} from "@/app/admin/actions/content";
import { Card, Field, inputClass, Badge } from "@/components/admin/ui";
import type { Settings } from "@/lib/types";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-lime cut-corner-sm disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save payment settings"}
    </button>
  );
}

export default function PaymentsForm({
  settings,
  live,
}: {
  settings: Settings;
  live: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    savePaymentSettingsAction,
    {}
  );
  const [provider, setProvider] = useState(settings.payment_provider ?? "payhere");
  const [enabled, setEnabled] = useState(settings.payment_enabled === "1");

  return (
    <form action={action} className="space-y-6">
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="label-mono mb-1">Status</h2>
            <p className="text-sm text-smoke">
              {live
                ? "Online payments are live. Customers pay at checkout."
                : "Online payments are off. Bookings are confirmed by hand."}
            </p>
          </div>
          <Badge tone={live ? "lime" : "muted"}>{live ? "Live" : "Manual"}</Badge>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border-t border-bone/10 pt-5">
          <input
            type="checkbox"
            name="payment_enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8ff00]"
          />
          <span>
            <span className="block text-sm text-bone">Take payments online</span>
            <span className="block text-[11px] text-smoke">
              Needs the gateway credentials below. Leave off to keep the manual
              booking flow.
            </span>
          </span>
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="payment_sandbox"
            defaultChecked={settings.payment_sandbox !== "0"}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8ff00]"
          />
          <span>
            <span className="block text-sm text-bone">Sandbox / test mode</span>
            <span className="block text-[11px] text-smoke">
              Use the gateway&apos;s test environment. Turn this off only when
              you&apos;re ready to take real money.
            </span>
          </span>
        </label>
      </Card>

      <Card>
        <h2 className="label-mono mb-5">Gateway</h2>
        <div className="mb-6 flex gap-2">
          {(
            [
              ["payhere", "PayHere (Sri Lanka)"],
              ["stripe", "Stripe (international)"],
            ] as const
          ).map(([id, label]) => (
            <label
              key={id}
              className={[
                "flex-1 cursor-pointer border px-4 py-3 text-center transition-colors",
                provider === id
                  ? "border-lime bg-lime/8 text-lime"
                  : "border-bone/15 text-smoke hover:border-bone/40",
              ].join(" ")}
            >
              <input
                type="radio"
                name="payment_provider"
                value={id}
                checked={provider === id}
                onChange={() => setProvider(id)}
                className="sr-only"
              />
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase">
                {label}
              </span>
            </label>
          ))}
        </div>

        {provider === "payhere" ? (
          <div className="space-y-4">
            <Field
              label="Merchant ID"
              hint="From your PayHere dashboard → Domains & Credentials."
            >
              <input
                name="payhere_merchant_id"
                defaultValue={settings.payhere_merchant_id ?? ""}
                className={inputClass}
                placeholder="1220000"
              />
            </Field>
            <Field label="Merchant Secret">
              <input
                type="password"
                name="payhere_merchant_secret"
                defaultValue={settings.payhere_merchant_secret ?? ""}
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>
            <p className="border border-bone/12 bg-void p-3 text-[11px] leading-relaxed text-smoke">
              Add your site&apos;s domain to PayHere&apos;s allowed domains, and
              set the notify URL to{" "}
              <span className="font-mono text-lime">
                /api/payments/payhere/notify
              </span>
              . Payments are only marked paid when PayHere confirms them
              server-to-server.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Publishable key">
              <input
                name="stripe_publishable_key"
                defaultValue={settings.stripe_publishable_key ?? ""}
                className={inputClass}
                placeholder="pk_live_…"
              />
            </Field>
            <Field label="Secret key">
              <input
                type="password"
                name="stripe_secret_key"
                defaultValue={settings.stripe_secret_key ?? ""}
                className={inputClass}
                placeholder="sk_live_…"
              />
            </Field>
            <p className="border border-uv/40 bg-uv/10 p-3 text-[11px] leading-relaxed text-bone">
              Stripe keys are stored, but the redirect isn&apos;t wired up yet —
              bookings still use the manual flow. PayHere is the completed
              integration; tell us when you want Stripe finished.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="label-mono mb-5">Bank transfer details</h2>
        <Field
          label="Account details"
          hint="Shown on the confirmation screen when payments are manual."
        >
          <textarea
            name="bank_transfer_details"
            rows={5}
            defaultValue={settings.bank_transfer_details ?? ""}
            className={`${inputClass} resize-y font-mono text-[12px]`}
          />
        </Field>
      </Card>

      {state.error && (
        <p className="cut-corner-sm border border-hot/40 bg-hot/10 px-4 py-3 font-mono text-[11px] tracking-[0.1em] text-hot uppercase">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="cut-corner-sm border border-lime/40 bg-lime/10 px-4 py-3 font-mono text-[11px] tracking-[0.1em] text-lime uppercase">
          {state.ok}
        </p>
      )}

      <div className="border-t border-bone/10 pt-6">
        <Save />
      </div>
    </form>
  );
}
