export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed" | "Critical";
export interface Incident { id: string; title: string; status: TicketStatus; updatedAt: string; assignee: string; }
export interface ActivityItem { id: string; actor: string; action: string; detail: string; timestamp: string; }
