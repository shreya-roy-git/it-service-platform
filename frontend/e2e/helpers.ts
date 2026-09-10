/**
 * Shared test helpers and constants for E2E tests.
 */

/** Credentials seeded in the database for testing */
export const USERS = {
  admin: {
    email: "manager@example.test",
    password: "Manager@123",
    role: "Administrator",
    /** Display name expected in the UI after login */
    namePattern: /manager|admin/i,
  },
  analyst: {
    email: "analyst@example.test",
    password: "Analyst@123",
    role: "Service Desk Analyst",
    namePattern: /analyst/i,
  },
} as const;

/** Route paths (relative to baseURL) */
export const ROUTES = {
  login: "/login",
  dashboard: "/",
  tickets: "/tickets",
  reports: "/reports",
  users: "/users",
} as const;

/** LocalStorage key used by the API client to persist the JWT */
export const TOKEN_KEY = "it_service_platform_token";
