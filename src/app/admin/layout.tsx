import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Rave.LK Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The login page renders inside this layout too, before a session exists.
  if (!session) return <>{children}</>;

  return <AdminShell session={session}>{children}</AdminShell>;
}
