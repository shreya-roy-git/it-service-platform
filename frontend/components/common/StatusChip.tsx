import { Chip } from "@mui/material";
import type { TicketStatus } from "@/types/dashboard";
const statusColor: Record<TicketStatus, "default" | "info" | "success" | "error"> = { Open: "info", "In Progress": "default", Resolved: "success", Critical: "error" };
export function StatusChip({ status }: { status: TicketStatus }) { return <Chip color={statusColor[status]} label={status} size="small" variant={status === "In Progress" ? "outlined" : "filled"} />; }
