import { AppLayout } from "@/components/layout/AppLayout";
import { TicketDetailsPage } from "@/components/tickets/TicketDetailsPage";

export default async function TicketDetailsRoute({ params }: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  return <AppLayout><TicketDetailsPage ticketId={id} /></AppLayout>;
}
