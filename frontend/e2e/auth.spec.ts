import { expect, test } from "@playwright/test";
import { ROUTES, TOKEN_KEY, USERS } from "./helpers";

// ---------------------------------------------------------------------------
// Authentication E2E Tests — Part 1
// Covers: login (admin), login (analyst), invalid login, logout,
//         and protected-route redirection.
// ---------------------------------------------------------------------------

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any residual auth state before each test
    await page.goto(ROUTES.login);
    await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY);
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-001: Page renders correctly
  // -------------------------------------------------------------------------
  test("renders the login form with email, password and submit button", async ({ page }) => {
    await page.goto(ROUTES.login);

    await expect(page.getByRole("heading", { name: /servicedesk/i })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-002: Successful Administrator login
  // -------------------------------------------------------------------------
  test("logs in successfully as Administrator and redirects to dashboard", async ({ page }) => {
    await page.goto(ROUTES.login);

    await page.locator("#email").fill(USERS.admin.email);
    await page.locator("#password").fill(USERS.admin.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should navigate away from /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

    // A JWT token must be stored in localStorage
    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-003: Successful Service Desk Analyst login
  // -------------------------------------------------------------------------
  test("logs in successfully as Service Desk Analyst and redirects to dashboard", async ({ page }) => {
    await page.goto(ROUTES.login);

    await page.locator("#email").fill(USERS.analyst.email);
    await page.locator("#password").fill(USERS.analyst.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-004: Invalid credentials — wrong password
  // -------------------------------------------------------------------------
  test("shows an error message for invalid credentials", async ({ page }) => {
    await page.goto(ROUTES.login);

    await page.locator("#email").fill(USERS.admin.email);
    await page.locator("#password").fill("WrongPassword999!");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Error alert must appear; user must stay on /login
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);

    // Token must NOT be stored
    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeNull();
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-005: Invalid credentials — non-existent email
  // -------------------------------------------------------------------------
  test("shows an error message for a non-existent email", async ({ page }) => {
    await page.goto(ROUTES.login);

    await page.locator("#email").fill("nobody@doesnotexist.test");
    await page.locator("#password").fill("SomePassword@1");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Use .first() to target the MUI Alert; Next.js route announcer is also role=alert
    await expect(page.getByRole("alert").filter({ hasText: /invalid|not found|credentials|error/i }).or(page.getByRole("alert").first())).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-006: Submit button disabled when fields are empty
  // -------------------------------------------------------------------------
  test("disables the submit button when fields are empty", async ({ page }) => {
    await page.goto(ROUTES.login);

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await expect(submitBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Logout Tests
// ---------------------------------------------------------------------------

test.describe("Logout", () => {
  test.beforeEach(async ({ page }) => {
    // Perform a full login so we have an authenticated session
    await page.goto(ROUTES.login);
    await page.locator("#email").fill(USERS.admin.email);
    await page.locator("#password").fill(USERS.admin.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-007: Logout clears session and redirects to /login
  // -------------------------------------------------------------------------
  test("logs out and redirects to the login page", async ({ page }) => {
    // Find and click the logout button (button or link with "logout" text)
    const logoutBtn = page.getByRole("button", { name: /logout|sign out/i });
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
    await logoutBtn.click();

    // Must redirect back to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    // Token must be cleared
    const token = await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY);
    expect(token).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Protected Route Tests
// ---------------------------------------------------------------------------

test.describe("Protected Routes", () => {
  // -------------------------------------------------------------------------
  // TC-AUTH-008: Unauthenticated user is redirected from /dashboard to /login
  // -------------------------------------------------------------------------
  test("redirects unauthenticated user from dashboard to /login", async ({ page }) => {
    // Navigate directly without logging in
    await page.goto(ROUTES.dashboard);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-009: Unauthenticated user is redirected from /tickets to /login
  // -------------------------------------------------------------------------
  test("redirects unauthenticated user from /tickets to /login", async ({ page }) => {
    await page.goto(ROUTES.tickets);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-010: Unauthenticated user is redirected from /users to /login
  // -------------------------------------------------------------------------
  test("redirects unauthenticated user from /users to /login", async ({ page }) => {
    await page.goto(ROUTES.users);
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-011: Analyst cannot access /users (admin-only)
  // -------------------------------------------------------------------------
  test("denies Analyst access to /users (admin-only route)", async ({ page }) => {
    // Log in as Analyst
    await page.goto(ROUTES.login);
    await page.locator("#email").fill(USERS.analyst.email);
    await page.locator("#password").fill(USERS.analyst.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

    // Attempt to navigate directly to /users
    await page.goto(ROUTES.users);

    // The app renders a 403 Access Denied page at /users for non-Admins
    await expect(page.getByText(/403.*access denied|access denied/i)).toBeVisible({ timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TC-AUTH-012: Authenticated Admin can access /users
  // -------------------------------------------------------------------------
  test("allows Administrator to access /users", async ({ page }) => {
    // Log in as Admin
    await page.goto(ROUTES.login);
    await page.locator("#email").fill(USERS.admin.email);
    await page.locator("#password").fill(USERS.admin.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

    // Navigate to /users
    await page.goto(ROUTES.users);

    // Should stay on /users and NOT show a denied message
    await expect(page).toHaveURL(/\/users/, { timeout: 8_000 });
  });
});
