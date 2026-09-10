import { expect, test, type Page } from "@playwright/test";
import { ROUTES, TOKEN_KEY, USERS } from "./helpers";

// ---------------------------------------------------------------------------
// Helpers for Authentication
// ---------------------------------------------------------------------------
async function loginAsAdmin(page: Page) {
  await page.goto(ROUTES.login);
  await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY);
  await page.locator("#email").fill(USERS.admin.email);
  await page.locator("#password").fill(USERS.admin.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
}

async function loginAsAnalyst(page: Page) {
  await page.goto(ROUTES.login);
  await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY);
  await page.locator("#email").fill(USERS.analyst.email);
  await page.locator("#password").fill(USERS.analyst.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
}

test.describe("Role-Based Access Control (RBAC)", () => {
  // -------------------------------------------------------------------------
  // TASK 1: Administrator access
  // -------------------------------------------------------------------------
  test("TASK 1 — Administrator access to User Management", async ({ page }) => {
    await loginAsAdmin(page);

    // Verify User Management is visible in the Sidebar
    const userMgmtLink = page.getByRole("link", { name: /user management/i });
    await expect(userMgmtLink).toBeVisible();

    // Clicking User Management opens /users
    await userMgmtLink.click();
    await expect(page).toHaveURL(/\/users/, { timeout: 8_000 });

    // User Management page loads successfully & Users table/list is visible
    await expect(
      page.getByRole("heading", { name: /user management/i })
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // TASK 2: Administrator user creation
  // -------------------------------------------------------------------------
  test("TASK 2 — Administrator user creation", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.users);
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });

    // Click Create user button
    await page.getByRole("button", { name: /create user/i }).click();

    // Fill form using unique test data
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const testEmail = `playwright-${uniqueId}@example.test`;

    await page.getByLabel(/first name/i).fill("Playwright");
    await page.getByLabel(/last name/i).fill("TestUser");
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill("Test@12345");

    // Select Role: Service Desk Analyst
    await page.getByRole("combobox", { name: /role/i }).click();
    await page.getByRole("option", { name: "Service Desk Analyst" }).click();

    // Submit dialog form
    await page.getByRole("button", { name: "Create User" }).click();

    // Verify request succeeds & success feedback is displayed
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 8_000,
    });

    // Verify newly created user appears in the user list table
    await expect(page.getByRole("cell", { name: testEmail })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TASK 3: Administrator user editing
  // -------------------------------------------------------------------------
  test("TASK 3 — Administrator user editing", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.users);
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });

    // First create a dedicated test user for isolation
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const testEmail = `edit-test-${uniqueId}@example.test`;

    await page.getByRole("button", { name: /create user/i }).click();
    await page.getByLabel(/first name/i).fill("EditTest");
    await page.getByLabel(/last name/i).fill("BeforeEdit");
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill("Test@12345");
    await page.getByRole("combobox", { name: /role/i }).click();
    await page.getByRole("option", { name: "Service Desk Analyst" }).click();
    await page.getByRole("button", { name: "Create User" }).click();
    await expect(page.getByText(/created successfully/i)).toBeVisible({
      timeout: 8_000,
    });

    // Locate row for created user and click Edit
    const userRow = page.getByRole("row").filter({ hasText: testEmail });
    await expect(userRow).toBeVisible();
    await userRow.getByRole("button", { name: /edit/i }).click();

    // Edit Last Name field
    const updatedLastName = `Updated-${uniqueId.slice(-4)}`;
    await page.getByLabel(/last name/i).fill(updatedLastName);

    // Save changes
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Verify update succeeds and updated value is visible
    await expect(page.getByText(/updated successfully/i)).toBeVisible({
      timeout: 8_000,
    });
    await expect(userRow.getByText(updatedLastName)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TASK 4: Analyst UI permissions
  // -------------------------------------------------------------------------
  test("TASK 4 — Analyst UI permissions in Sidebar", async ({ page }) => {
    await loginAsAnalyst(page);

    // Verify Sidebar contains Dashboard, Tickets, Reports
    await expect(
      page.getByRole("link", { name: /dashboard/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^tickets$/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /reports/i })
    ).toBeVisible();

    // Verify User Management is NOT visible
    await expect(
      page.getByRole("link", { name: /user management/i })
    ).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TASK 5: Analyst direct route protection
  // -------------------------------------------------------------------------
  test("TASK 5 — Analyst direct route protection for /users", async ({ page }) => {
    await loginAsAnalyst(page);

    // Directly navigate to /users
    await page.goto(ROUTES.users);

    // Verify Access Denied / 403 page
    await expect(
      page.getByText(/403.*access denied|access denied/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TASK 6: Analyst backend authorization
  // -------------------------------------------------------------------------
  test("TASK 6 — Analyst backend authorization protection (403 from API)", async ({ page }) => {
    await loginAsAnalyst(page);

    // Get the stored JWT token for the Analyst session
    const token = await page.evaluate(
      (key) => localStorage.getItem(key),
      TOKEN_KEY
    );
    expect(token).toBeTruthy();

    // Send direct API request to backend users endpoint with Analyst token
    const apiResponse = await page.request.get("http://localhost:4000/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Backend must return 403 Forbidden
    expect(apiResponse.status()).toBe(403);
  });

  // -------------------------------------------------------------------------
  // TASK 7: Analyst normal permissions
  // -------------------------------------------------------------------------
  test("TASK 7 — Analyst normal permissions (Dashboard, Tickets, Create Ticket, Reports)", async ({ page }) => {
    await loginAsAnalyst(page);

    // Dashboard
    await page.goto(ROUTES.dashboard);
    await expect(
      page.getByRole("heading", { name: /recent tickets/i })
    ).toBeVisible({ timeout: 10_000 });

    // Tickets
    await page.goto(ROUTES.tickets);
    await expect(
      page.getByRole("heading", { name: /^tickets$/i })
    ).toBeVisible({ timeout: 10_000 });

    // Create Ticket
    await page.goto("/tickets/create");
    await expect(
      page.getByRole("heading", { name: /create ticket/i })
    ).toBeVisible({ timeout: 10_000 });

    // Reports
    await page.goto(ROUTES.reports);
    await expect(
      page.getByRole("heading", { name: /^reports$/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // TASK 8: Administrator normal permissions
  // -------------------------------------------------------------------------
  test("TASK 8 — Administrator normal permissions (Dashboard, Tickets, Create Ticket, Reports, User Management)", async ({ page }) => {
    await loginAsAdmin(page);

    // Dashboard
    await page.goto(ROUTES.dashboard);
    await expect(
      page.getByRole("heading", { name: /recent tickets/i })
    ).toBeVisible({ timeout: 10_000 });

    // Tickets
    await page.goto(ROUTES.tickets);
    await expect(
      page.getByRole("heading", { name: /^tickets$/i })
    ).toBeVisible({ timeout: 10_000 });

    // Create Ticket
    await page.goto("/tickets/create");
    await expect(
      page.getByRole("heading", { name: /create ticket/i })
    ).toBeVisible({ timeout: 10_000 });

    // Reports
    await page.goto(ROUTES.reports);
    await expect(
      page.getByRole("heading", { name: /^reports$/i })
    ).toBeVisible({ timeout: 10_000 });

    // User Management
    await page.goto(ROUTES.users);
    await expect(
      page.getByRole("heading", { name: /user management/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});
