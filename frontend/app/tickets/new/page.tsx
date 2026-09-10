import { redirect } from "next/navigation";

export default function LegacyCreateTicketRoute() {
  redirect("/tickets/create");
}
