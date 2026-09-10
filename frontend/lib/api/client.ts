import axios from "axios";
import type {
  ApiErrorResponse,
  ApiHealthResponse,
  ApiResponse,
  AuthResponseData,
  CreateTicketInput,
  GetTicketsParams,
  GetTicketsResponse,
  LoginInput,
  PaginationMeta,
  Ticket,
  TicketFormOptions,
  TicketSummary,
  UpdateTicketInput,
  User,
} from "@/types/api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiBaseUrl = apiUrl ? `${apiUrl.replace(/\/$/, "")}/api` : undefined;

export const TOKEN_KEY = "it_service_platform_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
  timeout: 5_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorizedHandler: (() => void) | null = null;

export function setOnUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorizedHandler = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (onUnauthorizedHandler) {
        onUnauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export async function getHealthStatus(): Promise<ApiHealthResponse> {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
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

export function loginApi(input: LoginInput): Promise<AuthResponseData> {
  return request(() => apiClient.post<ApiResponse<AuthResponseData>>("/auth/login", input));
}

export function getCurrentUserApi(): Promise<User> {
  return request(() => apiClient.get<ApiResponse<User>>("/auth/me"));
}

export function logoutApi(): Promise<{ message: string }> {
  return request(() => apiClient.post<ApiResponse<{ message: string }>>("/auth/logout"));
}

export async function getTickets(params?: GetTicketsParams): Promise<GetTicketsResponse> {
  if (!apiBaseUrl) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured.");
  }
  try {
    const { data } = await apiClient.get<ApiResponse<Ticket[]> & { pagination: PaginationMeta }>("/tickets", {
      params,
    });
    return {
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    throw getApiError(error);
  }
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

export function updateTicket(id: string, input: UpdateTicketInput): Promise<Ticket> {
  return request(() => apiClient.patch<ApiResponse<Ticket>>(`/tickets/${encodeURIComponent(id)}`, input));
}

