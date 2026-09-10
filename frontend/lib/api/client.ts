import axios from "axios";
import type { ApiErrorResponse, ApiHealthResponse, ApiResponse, CreateTicketInput, Ticket, TicketFormOptions, TicketSummary } from "@/types/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiBaseUrl = apiUrl ? `${apiUrl.replace(/\/$/, "")}/api` : undefined;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
  timeout: 5_000,
});

export async function getHealthStatus(): Promise<ApiHealthResponse> {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  const { data } = await apiClient.get<ApiHealthResponse>("/health");
  return data;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return new ApiError(error.response?.data.message ?? error.message ?? "Unable to reach the API.", error.response?.status);
  }
  return new ApiError(error instanceof Error ? error.message : "An unexpected error occurred.");
}

async function request<T>(operation: () => Promise<{ data: ApiResponse<T> }>): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured.");
  }
  try {
    const { data } = await operation();
    return data.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export function getTickets(): Promise<Ticket[]> {
  return request(() => apiClient.get<ApiResponse<Ticket[]>>("/tickets"));
}

export function getTicket(id: string): Promise<Ticket> {
  return request(() => apiClient.get<ApiResponse<Ticket>>(`/tickets/${encodeURIComponent(id)}`));
}

export function getTicketSummary(): Promise<TicketSummary> {
  return request(() => apiClient.get<ApiResponse<TicketSummary>>("/tickets/summary"));
}

export function getTicketFormOptions(): Promise<TicketFormOptions> {
  return request(() => apiClient.get<ApiResponse<TicketFormOptions>>("/tickets/form-options"));
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return request(() => apiClient.post<ApiResponse<Ticket>>("/tickets", input));
}
