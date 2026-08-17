import { AdminHeader } from "@/components/admin/ui";
import SettingsForm from "@/components/admin/SettingsForm";
import PasswordForm from "@/components/admin/PasswordForm";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <AdminHeader
        title="Site settings"
        subtitle="Copy, contact details and social links across the public site."
      />
      <div className="space-y-8">
        <SettingsForm settings={settings} />
        <PasswordForm />
      </div>
    </>
  );
}
