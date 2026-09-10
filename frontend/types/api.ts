export interface ApiHealthResponse {
  success: true;
  message: string;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Person { id: string; firstName: string; lastName: string; }
export interface Project { id: string; key: string; name: string; }
export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  project: Project;
  creator: Person;
  assignee: Person | null;
  createdAt: string;
  updatedAt: string;
}
export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  recent: Ticket[];
}
export interface TicketFormOptions { projects: Project[]; users: Person[]; }
export interface CreateTicketInput {
  title: string;
  description?: string;
  projectId: string;
  creatorId: string;
  assigneeId?: string;
  status: TicketStatus;
  priority: TicketPriority;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

