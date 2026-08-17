"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteTierAction,
  saveTierAction,
  type FormState,
} from "@/app/admin/actions/events";
import { Card, Field, inputClass, Badge } from "@/components/admin/ui";
import { formatMoney } from "@/lib/utils";
import type { TicketTier } from "@/lib/types";

function SaveTier({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-lime cut-corner-sm disabled:opacity-60"
    >
      {pending ? "Saving…" : editing ? "Update tier" : "Add tier"}
    </button>
  );
}

export default function TierManager({
  eventId,
  tiers,
}: {
  eventId: number;
  tiers: TicketTier[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveTierAction, {});
  const [editing, setEditing] = useState<TicketTier | null>(null);
  const [showForm, setShowForm] = useState(false);

  const open = (tier: TicketTier | null) => {
    setEditing(tier);
    setShowForm(true);
  };

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="label-mono">Ticket tiers</h2>
          <p className="mt-1.5 text-[11px] text-smoke">
            Sold counts update automatically when a payment clears.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => open(null)}
            className="btn btn-ghost cut-corner-sm !px-4 !py-2"
          >
            Add tier
          </button>
        )}
      </div>

      {tiers.length > 0 && (
        <ul className="mb-6 divide-y divide-bone/8 border-y border-bone/8">
          {tiers.map((t) => {
            const soldOut = t.quantity !== null && t.sold >= t.quantity;
            return (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-bone">{t.name}</span>
                    {t.active !== 1 && <Badge>Hidden</Badge>}
                    {soldOut && <Badge tone="hot">Sold out</Badge>}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-smoke">
                    {formatMoney(t.price, t.currency)} ·{" "}
                    {t.quantity === null
                      ? `${t.sold} sold · unlimited`
                      : `${t.sold} / ${t.quantity} sold`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open(t)}
                  className="link-sweep shrink-0 font-mono text-[10px] tracking-[0.14em] text-lime uppercase"
                >
                  Edit
                </button>
                <form action={deleteTierAction} className="shrink-0">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="event_id" value={eventId} />
                  <button
                    type="submit"
                    className="font-mono text-[10px] tracking-[0.14em] text-smoke uppercase transition-colors hover:text-hot"
                  >
                    Delete
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {showForm && (
        <form
          action={action}
          key={editing?.id ?? "new"}
          className="border border-bone/12 bg-void p-4"
        >
          <input type="hidden" name="event_id" value={eventId} />
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tier name" required>
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                className={inputClass}
                placeholder="General Admission"
              />
            </Field>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <Field label="Price" required>
                <input
                  type="number"
                  name="price"
                  required
                  min={0}
                  step="0.01"
                  defaultValue={editing ? Number(editing.price) : ""}
                  className={inputClass}
                  placeholder="4500"
                />
              </Field>
              <Field label="Currency">
                <input
                  name="currency"
                  defaultValue={editing?.currency ?? "LKR"}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Perks" hint="Shown under the tier name.">
              <input
                name="perks"
                defaultValue={editing?.perks ?? ""}
                className={inputClass}
                placeholder="Fast-track entry · VIP deck"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Quantity" hint="Blank = unlimited.">
                <input
                  type="number"
                  name="quantity"
                  min={0}
                  defaultValue={editing?.quantity ?? ""}
                  className={inputClass}
                  placeholder="2000"
                />
              </Field>
              <Field label="Sort order">
                <input
                  type="number"
                  name="sort_order"
                  defaultValue={editing?.sort_order ?? tiers.length}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="active"
              defaultChecked={editing ? editing.active === 1 : true}
              className="h-4 w-4 accent-[#c8ff00]"
            />
            <span className="text-sm text-bone">Show this tier on the site</span>
          </label>

          {state.error && (
            <p className="mt-4 border border-hot/40 bg-hot/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-hot uppercase">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="mt-4 border border-lime/40 bg-lime/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-lime uppercase">
              {state.ok}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <SaveTier editing={Boolean(editing)} />
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="btn btn-ghost cut-corner-sm"
            >
              Done
            </button>
          </div>
        </form>
      )}

      {tiers.length === 0 && !showForm && (
        <p className="py-8 text-center font-mono text-[11px] tracking-[0.14em] text-smoke uppercase">
          No tiers yet — add one to open bookings
        </p>
      )}
    </Card>
  );
}
