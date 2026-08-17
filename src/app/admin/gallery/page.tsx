import { AdminHeader } from "@/components/admin/ui";
import GalleryManager from "@/components/admin/GalleryManager";
import { query } from "@/lib/db";
import type { GalleryItem, EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  const [items, events] = await Promise.all([
    query<GalleryItem>(
      "SELECT * FROM gallery ORDER BY sort_order ASC, id DESC LIMIT 400"
    ),
    query<Pick<EventRow, "id" | "title">>(
      "SELECT id, title FROM events ORDER BY starts_at DESC"
    ),
  ]);

  return (
    <>
      <AdminHeader
        title="Gallery"
        subtitle="Upload event photos. Featured photos appear on the homepage."
      />
      <GalleryManager items={items} events={events} />
    </>
  );
}
