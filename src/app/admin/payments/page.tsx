import { AdminHeader } from "@/components/admin/ui";
import PaymentsForm from "@/components/admin/PaymentsForm";
import { getSettings } from "@/lib/queries";
import { getPaymentConfig } from "@/lib/payments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const [settings, config] = await Promise.all([getSettings(), getPaymentConfig()]);

  return (
    <>
      <AdminHeader
        title="Payments"
        subtitle="Connect a payment gateway to take money online. Until it's on, bookings are confirmed manually."
      />
      <PaymentsForm settings={settings} live={config.enabled} />
    </>
  );
}
