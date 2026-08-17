"use client";

import { useMemo, useState } from "react";
import {
  deleteBookingAction,
  updateBookingAction,
} from "@/app/admin/actions/content";
import { Badge, Field, inputClass } from "@/components/admin/ui";
import { formatMoney } from "@/lib/utils";
import type { Booking } from "@/lib/types";

const FILTERS = ["all", "pending", "confirmed", "cancelled", "refunded"] as const;

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Booking | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.reference.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        (b.event_title ?? "").toLowerCase().includes(q)
      );
    });
  }, [bookings, filter, search]);

  const exportCsv = () => {
    const head = [
      "Reference", "Name", "Email", "Phone", "Event", "Tier",
      "Qty", "Total", "Currency", "Status", "Payment", "Created",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      head.join(","),
      ...rows.map((b) =>
        [
          b.reference, b.customer_name, b.email, b.phone, b.event_title,
          b.tier_name ?? "", b.quantity, b.total, b.currency,
          b.status, b.payment_status, b.created_at,
        ].map(esc).join(",")
      ),
    ].join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rave-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={[
                "border px-3 py-2 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors",
                filter === f
                  ? "border-lime bg-lime text-void"
                  : "border-bone/15 text-smoke hover:border-bone/40 hover:text-bone",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reference, name, email…"
          className="min-w-[12rem] flex-1 border border-bone/15 bg-void px-3.5 py-2 text-sm text-bone outline-none placeholder:text-smoke/50 focus:border-lime"
        />

        <button
          type="button"
          onClick={exportCsv}
          className="border border-bone/15 px-4 py-2 font-mono text-[10px] tracking-[0.12em] text-smoke uppercase transition-colors hover:border-lime hover:text-lime"
        >
          Export CSV
        </button>
      </div>

      <div className="cut-corner-sm overflow-x-auto border border-bone/12 bg-void-2">
        <table className="w-full min-w-[52rem] text-left">
          <thead>
            <tr className="border-b border-bone/10">
              {["Reference", "Customer", "Event", "Qty", "Total", "Status", "Payment", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-smoke uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-bone/8">
            {rows.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-bone/3">
                <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-lime">
                  {b.reference}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-bone">{b.customer_name}</p>
                  <p className="font-mono text-[10px] text-smoke">{b.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="truncate text-sm text-bone">{b.event_title}</p>
                  <p className="font-mono text-[10px] text-smoke">
                    {b.tier_name ?? "General"}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-bone tabular-nums">
                  {b.quantity}
                </td>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-bone">
                  {formatMoney(b.total, b.currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      b.status === "confirmed"
                        ? "lime"
                        : b.status === "cancelled" || b.status === "refunded"
                          ? "hot"
                          : "muted"
                    }
                  >
                    {b.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={b.payment_status === "paid" ? "lime" : "muted"}>
                    {b.payment_status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setOpen(b)}
                    className="link-sweep font-mono text-[10px] tracking-[0.14em] text-lime uppercase"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="px-4 py-12 text-center font-mono text-[11px] tracking-[0.14em] text-smoke uppercase">
            Nothing matches that filter
          </p>
        )}
      </div>

      {/* Manage dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-void/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="my-8 w-full max-w-lg border border-bone/15 bg-void-2 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="display-md text-bone">{open.reference}</h3>
                <p className="mt-1 text-sm text-smoke">{open.event_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center border border-bone/20 text-bone hover:border-lime hover:text-lime"
              >
                ✕
              </button>
            </div>

            <dl className="mb-6 space-y-2 border-y border-bone/10 py-4 text-sm">
              {[
                ["Name", open.customer_name],
                ["Email", open.email],
                ["Phone", open.phone],
                ["Tier", open.tier_name ?? "General"],
                ["Quantity", String(open.quantity)],
                ["Total", formatMoney(open.total, open.currency)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-smoke">{k}</dt>
                  <dd className="text-right break-all text-bone">{v}</dd>
                </div>
              ))}
            </dl>

            <form
              action={async (fd) => {
                await updateBookingAction(fd);
                setOpen(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={open.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Booking status">
                  <select
                    name="status"
                    defaultValue={open.status}
                    className={inputClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </Field>
                <Field label="Payment" hint="Marking paid updates tier stock.">
                  <select
                    name="payment_status"
                    defaultValue={open.payment_status}
                    className={inputClass}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </Field>
              </div>

              <Field label="Internal notes">
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={open.notes ?? ""}
                  className={`${inputClass} resize-y`}
                />
              </Field>

              <div className="flex flex-wrap gap-2 pt-2">
                <button type="submit" className="btn btn-lime cut-corner-sm flex-1">
                  Save
                </button>
                <a
                  href={`https://wa.me/${open.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-ghost cut-corner-sm"
                >
                  WhatsApp
                </a>
              </div>
            </form>

            <form
              action={async (fd) => {
                await deleteBookingAction(fd);
                setOpen(null);
              }}
              className="mt-4 border-t border-bone/10 pt-4"
            >
              <input type="hidden" name="id" value={open.id} />
              <button
                type="submit"
                className="font-mono text-[10px] tracking-[0.14em] text-smoke uppercase transition-colors hover:text-hot"
              >
                Delete this booking
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
