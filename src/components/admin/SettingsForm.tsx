"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveSiteSettingsAction,
  type FormState,
} from "@/app/admin/actions/content";
import { Card, Field, inputClass } from "@/components/admin/ui";
import type { Settings } from "@/lib/types";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-lime cut-corner-sm disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState<FormState, FormData>(
    saveSiteSettingsAction,
    {}
  );

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="label-mono mb-5">Brand</h2>
          <div className="space-y-4">
            <Field label="Site title">
              <input
                name="site_title"
                defaultValue={settings.site_title ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Tagline" hint="Shown under the logo and in the hero eyebrow.">
              <input
                name="site_tagline"
                defaultValue={settings.site_tagline ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="label-mono mb-5">Homepage hero</h2>
          <div className="space-y-4">
            <Field
              label="Headline"
              hint="Each new line becomes its own animated line."
            >
              <textarea
                name="hero_heading"
                rows={3}
                defaultValue={settings.hero_heading ?? ""}
                className={`${inputClass} resize-y`}
              />
            </Field>
            <Field label="Sub-heading">
              <textarea
                name="hero_sub"
                rows={3}
                defaultValue={settings.hero_sub ?? ""}
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="label-mono mb-5">About</h2>
          <Field label="About text" hint="Used on the homepage and the About page.">
            <textarea
              name="about_text"
              rows={5}
              defaultValue={settings.about_text ?? ""}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </Card>

        <Card>
          <h2 className="label-mono mb-5">Contact</h2>
          <div className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                name="contact_email"
                defaultValue={settings.contact_email ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                name="contact_phone"
                defaultValue={settings.contact_phone ?? ""}
                className={inputClass}
              />
            </Field>
            <Field
              label="WhatsApp number"
              hint="With country code, e.g. +94770000000."
            >
              <input
                name="whatsapp_number"
                defaultValue={settings.whatsapp_number ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="label-mono mb-5">Social links</h2>
          <div className="space-y-4">
            {(
              [
                ["instagram_url", "Instagram"],
                ["facebook_url", "Facebook"],
                ["tiktok_url", "TikTok"],
                ["youtube_url", "YouTube"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label} hint="Leave blank to hide.">
                <input
                  type="url"
                  name={key}
                  defaultValue={settings[key] ?? ""}
                  className={inputClass}
                  placeholder="https://…"
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="label-mono mb-5">Booking</h2>
          <Field
            label="Confirmation message"
            hint="Shown to customers right after they book."
          >
            <textarea
              name="booking_instructions"
              rows={3}
              defaultValue={settings.booking_instructions ?? ""}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </Card>
      </div>

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
