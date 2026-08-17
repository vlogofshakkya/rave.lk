import { AdminHeader } from "@/components/admin/ui";
import EventForm from "@/components/admin/EventForm";

export const metadata = { title: "Add event" };

export default function NewEventPage() {
  return (
    <>
      <AdminHeader
        title="Add event"
        subtitle="Create the event first, then add ticket tiers to it."
      />
      <EventForm />
    </>
  );
}
