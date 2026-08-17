import { AdminHeader, Badge, Card, Empty } from "@/components/admin/ui";
import {
  deleteMessageAction,
  toggleMessageAction,
} from "@/app/admin/actions/content";
import { query } from "@/lib/db";
import { formatLongDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

interface Message {
  id: number;
  name: string;
  email: string;
  topic: string | null;
  message: string;
  handled: 0 | 1;
  created_at: string;
}

export default async function AdminMessagesPage() {
  const messages = await query<Message>(
    "SELECT * FROM messages ORDER BY handled ASC, created_at DESC LIMIT 200"
  );

  return (
    <>
      <AdminHeader
        title="Messages"
        subtitle="Enquiries sent through the contact form."
      />

      {messages.length === 0 ? (
        <Empty
          title="No messages"
          copy="Anything sent through the contact form shows up here."
        />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card
              key={m.id}
              className={m.handled === 1 ? "opacity-55" : undefined}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-bone">{m.name}</h2>
                    {m.topic && <Badge tone="uv">{m.topic}</Badge>}
                    {m.handled === 1 && <Badge tone="lime">Handled</Badge>}
                  </div>
                  <a
                    href={`mailto:${m.email}`}
                    className="link-sweep font-mono text-[11px] text-smoke hover:text-lime"
                  >
                    {m.email}
                  </a>
                </div>
                <span className="font-mono text-[10px] whitespace-nowrap text-smoke">
                  {formatLongDate(m.created_at)}
                </span>
              </div>

              <p className="border-l-2 border-bone/12 pl-4 text-sm leading-relaxed whitespace-pre-line text-bone/80">
                {m.message}
              </p>

              <div className="mt-4 flex gap-3 border-t border-bone/8 pt-3">
                <form action={toggleMessageAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="font-mono text-[10px] tracking-[0.14em] text-lime uppercase transition-opacity hover:opacity-70"
                  >
                    {m.handled === 1 ? "Mark unhandled" : "Mark handled"}
                  </button>
                </form>
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(
                    `Re: ${m.topic ?? "Your message"} — Rave.LK`
                  )}`}
                  className="font-mono text-[10px] tracking-[0.14em] text-smoke uppercase transition-colors hover:text-bone"
                >
                  Reply
                </a>
                <form action={deleteMessageAction} className="ml-auto">
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="font-mono text-[10px] tracking-[0.14em] text-smoke uppercase transition-colors hover:text-hot"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
