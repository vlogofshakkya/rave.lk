import { AdminHeader } from "@/components/admin/ui";
import AdminAccounts from "@/components/admin/AdminAccounts";
import { listAdmins } from "@/app/admin/actions/admins";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin accounts" };

export default async function AdminAccountsPage() {
  const [admins, session] = await Promise.all([listAdmins(), getSession()]);

  return (
    <>
      <AdminHeader
        title="Admin accounts"
        subtitle="Who can sign in to this CMS. Owners can add and remove accounts."
      />
      <AdminAccounts
        admins={admins}
        currentId={Number(session?.sub ?? 0)}
        isOwner={session?.role === "owner"}
      />
    </>
  );
}
