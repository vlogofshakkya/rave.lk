"use client";

import { useMemo, useState } from "react";
import { deleteSubscriberAction } from "@/app/admin/actions/content";
import type { Subscriber } from "@/app/admin/subscribers/page";

export default function SubscribersTable({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? subscribers.filter((s) => s.email.includes(q)) : subscribers;
  }, [subscribers, search]);

  const copyAll = async () => {
    await navigator.clipboard.writeText(rows.map((r) => r.email).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCsv = () => {
    const csv = ["Email,Subscribed"]
      .concat(rows.map((r) => `"${r.email}","${r.created_at}"`))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rave-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email…"
          className="min-w-[12rem] flex-1 border border-bone/15 bg-void px-3.5 py-2 text-sm text-bone outline-none placeholder:text-smoke/50 focus:border-lime"
        />
        <span className="font-mono text-[10px] tracking-[0.12em] text-smoke uppercase">
          {rows.length} of {subscribers.length}
        </span>
        <button
          type="button"
          onClick={copyAll}
          className="border border-bone/15 px-4 py-2 font-mono text-[10px] tracking-[0.12em] text-smoke uppercase transition-colors hover:border-lime hover:text-lime"
        >
          {copied ? "Copied" : "Copy emails"}
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="border border-bone/15 px-4 py-2 font-mono text-[10px] tracking-[0.12em] text-smoke uppercase transition-colors hover:border-lime hover:text-lime"
        >
          Export CSV
        </button>
      </div>

      <div className="cut-corner-sm overflow-x-auto border border-bone/12 bg-void-2">
        <table className="w-full min-w-[28rem] text-left">
          <thead>
            <tr className="border-b border-bone/10">
              {["Email", "Subscribed", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-smoke uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bone/8">
            {rows.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-bone/3">
                <td className="px-4 py-3 text-sm break-all text-bone">{s.email}</td>
                <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-smoke">
                  {new Date(s.created_at).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteSubscriberAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="font-mono text-[10px] tracking-[0.14em] text-smoke uppercase transition-colors hover:text-hot"
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
