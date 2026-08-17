"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveEventAction, type FormState } from "@/app/admin/actions/events";
import { Card, Field, inputClass } from "@/components/admin/ui";
import ImagePicker from "@/components/admin/ImagePicker";
import { toInputDateTime } from "@/lib/utils";
import { parseLineup, type EventRow } from "@/lib/types";

function Save({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-lime cut-corner-sm disabled:opacity-60"
    >
      {pending ? "Saving…" : isNew ? "Create event" : "Save changes"}
    </button>
  );
}

export default function EventForm({ event }: { event?: EventRow }) {
  const [state, action] = useActionState<FormState, FormData>(saveEventAction, {});
  const isNew = !event;

  return (
    <form action={action} className="space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Main */}
        <div className="space-y-6">
          <Card>
            <h2 className="label-mono mb-5">The basics</h2>
            <div className="space-y-4">
              <Field label="Title" required>
                <input
                  name="title"
                  required
                  defaultValue={event?.title ?? ""}
                  className={inputClass}
                  placeholder="NEON MONSOON"
                />
              </Field>

              <Field label="Tagline" hint="One line under the title on the event page.">
                <input
                  name="tagline"
                  defaultValue={event?.tagline ?? ""}
                  className={inputClass}
                  placeholder="Colombo · Main Stage Takeover"
                />
              </Field>

              <Field
                label="URL slug"
                hint="Leave blank to generate from the title."
              >
                <input
                  name="slug"
                  defaultValue={event?.slug ?? ""}
                  className={inputClass}
                  placeholder="neon-monsoon-2026"
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  rows={6}
                  defaultValue={event?.description ?? ""}
                  className={`${inputClass} resize-y`}
                  placeholder="What happens on the night…"
                />
              </Field>

              <Field
                label="Lineup"
                hint="Separate artists with commas or new lines."
              >
                <textarea
                  name="lineup"
                  rows={3}
                  defaultValue={parseLineup(event?.lineup ?? null).join(", ")}
                  className={`${inputClass} resize-y`}
                  placeholder="Dimitri Vegas, KSHMR, Ranidu"
                />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="label-mono mb-5">When and where</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts" required>
                <input
                  type="datetime-local"
                  name="starts_at"
                  required
                  defaultValue={toInputDateTime(event?.starts_at)}
                  className={inputClass}
                />
              </Field>
              <Field label="Ends" hint="Optional.">
                <input
                  type="datetime-local"
                  name="ends_at"
                  defaultValue={toInputDateTime(event?.ends_at)}
                  className={inputClass}
                />
              </Field>
              <Field label="Venue">
                <input
                  name="venue"
                  defaultValue={event?.venue ?? ""}
                  className={inputClass}
                  placeholder="Port City Open Grounds"
                />
              </Field>
              <Field label="City">
                <input
                  name="city"
                  defaultValue={event?.city ?? ""}
                  className={inputClass}
                  placeholder="Colombo"
                />
              </Field>
            </div>
          </Card>

          <Card>
            <h2 className="label-mono mb-5">Images</h2>
            <div className="space-y-5">
              <ImagePicker
                name="poster_url"
                label="Poster (3:4)"
                defaultValue={event?.poster_url ?? ""}
                folder="rave-lk/posters"
              />
              <ImagePicker
                name="hero_url"
                label="Hero banner (wide)"
                defaultValue={event?.hero_url ?? ""}
                aspect="aspect-video"
                folder="rave-lk/heroes"
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h2 className="label-mono mb-5">Publishing</h2>
            <div className="space-y-4">
              <Field label="Status">
                <select
                  name="status"
                  defaultValue={event?.status ?? "upcoming"}
                  className={inputClass}
                >
                  <option value="draft">Draft — hidden from the site</option>
                  <option value="upcoming">Upcoming — live</option>
                  <option value="past">Past — in the archive</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={event?.featured === 1}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8ff00]"
                />
                <span>
                  <span className="block text-sm text-bone">Feature on homepage</span>
                  <span className="block text-[11px] text-smoke">
                    Leads the hero. Only one event can be featured.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="tickets_open"
                  defaultChecked={event ? event.tickets_open === 1 : true}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8ff00]"
                />
                <span>
                  <span className="block text-sm text-bone">Tickets on sale</span>
                  <span className="block text-[11px] text-smoke">
                    Turn off to show &ldquo;not on sale yet&rdquo;.
                  </span>
                </span>
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="label-mono mb-5">Extras</h2>
            <div className="space-y-4">
              <Field
                label="External ticket URL"
                hint="Set this to send buyers to another ticketing site instead of the built-in booking form."
              >
                <input
                  type="url"
                  name="external_url"
                  defaultValue={event?.external_url ?? ""}
                  className={inputClass}
                  placeholder="https://…"
                />
              </Field>

              <Field label="Recap video URL" hint="YouTube or Vimeo link.">
                <input
                  type="url"
                  name="recap_video"
                  defaultValue={event?.recap_video ?? ""}
                  className={inputClass}
                  placeholder="https://youtube.com/…"
                />
              </Field>

              <Field
                label="Attendance"
                hint="Shown on past events as social proof."
              >
                <input
                  type="number"
                  name="attendance"
                  min={0}
                  defaultValue={event?.attendance ?? ""}
                  className={inputClass}
                  placeholder="8200"
                />
              </Field>
            </div>
          </Card>
        </div>
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

      <div className="flex flex-wrap items-center gap-3 border-t border-bone/10 pt-6">
        <Save isNew={isNew} />
        <Link href="/admin/events" className="btn btn-ghost cut-corner-sm">
          Cancel
        </Link>
        {event && (
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            className="link-sweep ml-auto font-mono text-[10px] tracking-[0.14em] text-smoke uppercase hover:text-lime"
          >
            View on site →
          </Link>
        )}
      </div>
    </form>
  );
}
