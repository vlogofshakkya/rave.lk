import { AdminHeader, Empty } from "@/components/admin/ui";
import SubscribersTable from "@/components/admin/SubscribersTable";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subscribers" };

export interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

export default async function AdminSubscribersPage() {
  const subscribers = await query<Subscriber>(
    "SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 2000"
  );

  return (
    <>
      <AdminHeader
        title="Subscribers"
        subtitle="People on the mailing list. Export the list to send your presale announcements."
      />

      {subscribers.length === 0 ? (
        <Empty
          title="No subscribers yet"
          copy="Signups from the footer form collect here."
        />
      ) : (
        <SubscribersTable subscribers={subscribers} />
      )}
    </>
  );
}
