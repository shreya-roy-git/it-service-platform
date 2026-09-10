import { AppLayout } from "@/components/layout/AppLayout";
import { TicketsPage } from "@/components/tickets/TicketsPage";

export default async function TicketsRoute({ searchParams }: PageProps<"/tickets">) {
  const { created } = await searchParams;
  return <AppLayout><TicketsPage created={created === "1"} /></AppLayout>;
}
