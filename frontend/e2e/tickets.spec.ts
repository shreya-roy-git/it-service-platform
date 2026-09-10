import { expect, test, type Locator, type Page } from "@playwright/test";
import { ROUTES, TOKEN_KEY, USERS } from "./helpers";

// ---------------------------------------------------------------------------
// Shared helper: login as Administrator
// ---------------------------------------------------------------------------
async function loginAsAdmin(page: Page) {
  await page.goto(ROUTES.login);
  await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY);
  await page.locator("#email").fill(USERS.admin.email);
  await page.locator("#password").fill(USERS.admin.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
}

/**
 * Wait for the tickets list table OR an empty-state message to appear.
 * This confirms that the page has fully loaded data from the backend.
 */
async function waitForTicketsPage(page: Page) {
  await expect(
    page.getByRole("table", { name: /tickets/i })
      .or(page.getByText(/no tickets yet/i))
      .or(page.getByText(/no matching tickets/i))
  ).toBeVisible({ timeout: 12_000 });
}

/**
 * Get the combobox element INSIDE a MUI Select wrapper that has the given aria-label.
 * MUI renders: <div aria-label="Filter tickets by status"><div role="combobox">…</div></div>
 */
function getFilterSelect(page: Page, ariaLabel: string): Locator {
  return page.locator(`[aria-label="${ariaLabel}"] [role="combobox"]`);
}

/**
 * Select a value from a MUI Select filter on the tickets page.
 * Clicks the combobox to open the listbox, then clicks the option.
 */
async function selectFilter(page: Page, ariaLabel: string, optionText: string) {
  await getFilterSelect(page, ariaLabel).click();
  await page.getByRole("option", { name: new RegExp(`^${optionText}$`, "i") }).click();
}

/**
 * Fill a MUI TextField (floating label) using the label text.
 * MUI links <label> to <input> via htmlFor/id, so getByLabel works with the full label.
 */
async function fillField(page: Page, labelText: string | RegExp, value: string) {
  // Try exact label first; MUI required fields have "Title *" etc.
  const field = page.getByLabel(labelText);
  await field.fill(value);
}

/**
 * Select a value from a MUI Select field in the CREATE TICKET FORM.
 * These selects use an <InputLabel> + <Select>, rendered as combobox with the label linked.
 */
async function selectFormField(page: Page, labelText: string | RegExp, optionText: string) {
  // The combobox has an aria-labelledby referencing the label
  const combo = page.getByRole("combobox", { name: labelText });
  await combo.click();
  await page.getByRole("option", { name: new RegExp(`^${optionText}$`, "i") }).click();
}

// ---------------------------------------------------------------------------
// TC-TKT-001: Tickets list page renders correctly
// ---------------------------------------------------------------------------
test.describe("Ticket List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.tickets);
    await waitForTicketsPage(page);
  });

  test("TC-TKT-001: renders heading, create button, search box and filter controls", async ({ page }) => {
    // Heading
    await expect(page.getByRole("heading", { name: /^tickets$/i })).toBeVisible();

    // "Create ticket" is a <a href="/tickets/create"> inside a MUI Button
    // The link has no accessible name from button text in some MUI versions —
    // use href attribute to locate it reliably
    const createLink = page.locator('a[href="/tickets/create"]');
    await expect(createLink).toBeVisible();

    // Ticket search box — use exact placeholder to avoid matching the header search
    await expect(
      page.getByPlaceholder("Search ticket number, title, description...")
    ).toBeVisible();

    // Filter comboboxes (MUI Select inside aria-labeled wrappers)
    await expect(getFilterSelect(page, "Filter tickets by status")).toBeVisible();
    await expect(getFilterSelect(page, "Filter tickets by priority")).toBeVisible();
    await expect(getFilterSelect(page, "Filter tickets by assignee")).toBeVisible();
    await expect(getFilterSelect(page, "Filter tickets by project")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-TKT-002 → TC-TKT-004: Create → Detail → Edit (each test is self-contained)
// ---------------------------------------------------------------------------
test.describe("Ticket CRUD Flow", () => {
  const RUN_ID = Date.now();
  const TICKET_TITLE = `[E2E-${RUN_ID}] Network Drive Inaccessible`;
  const TICKET_DESC = "Created by Playwright E2E. Safe to delete.";

  /** Navigate to create ticket form and wait for it to load */
  async function goToCreateForm(page: Page) {
    await page.goto("/tickets/create");
    // Wait for any form field to become interactive (options loaded from backend)
    await expect(page.getByRole("combobox", { name: /project/i })).toBeVisible({ timeout: 12_000 });
  }

  // -------------------------------------------------------------------------
  // TC-TKT-002: Create a ticket via the form
  // -------------------------------------------------------------------------
  test("TC-TKT-002: creates a new ticket via the form and confirms it appears in the list", async ({ page }) => {
    await loginAsAdmin(page);
    await goToCreateForm(page);

    // Fill Title (MUI TextField: label "Title *" links to the input via htmlFor)
    await page.getByLabel("Title *").fill(TICKET_TITLE);

    // Fill Description (label "Description" — no asterisk)
    await page.getByLabel("Description").fill(TICKET_DESC);

    // Project is auto-selected to first option — no change needed
    // Priority — change from default "Medium" to "High"
    await selectFormField(page, /^priority$/i, "High");

    // Assignee — select "Avery Shah"
    await selectFormField(page, /^assignee$/i, "Avery Shah");

    // Submit
    await page.getByRole("button", { name: /create ticket/i }).click();

    // Should redirect to /tickets?created=1
    await expect(page).toHaveURL(/\/tickets\?created=1/, { timeout: 12_000 });
    await expect(page.getByText(/ticket created successfully/i)).toBeVisible({ timeout: 5_000 });

    // The new ticket should appear in the list
    await expect(page.getByText(TICKET_TITLE)).toBeVisible({ timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TC-TKT-003: Open ticket details and verify displayed fields
  // -------------------------------------------------------------------------
  test("TC-TKT-003: opens ticket details and verifies title, description, status, priority, project", async ({ page }) => {
    await loginAsAdmin(page);
    await goToCreateForm(page);

    // Create a fresh ticket
    await page.getByLabel("Title *").fill(TICKET_TITLE);
    await page.getByLabel("Description").fill(TICKET_DESC);
    await page.getByRole("button", { name: /create ticket/i }).click();
    await expect(page).toHaveURL(/\/tickets\?created=1/, { timeout: 12_000 });

    // Click on the ticket in the list
    // Use .first() to handle cases where multiple test-created tickets share the same title
    await expect(page.getByText(TICKET_TITLE).first()).toBeVisible({ timeout: 8_000 });
    await page.getByText(TICKET_TITLE).first().click();
    await expect(page).toHaveURL(/\/tickets\/[a-z0-9]+$/i, { timeout: 8_000 });

    // Ticket number (ITOPS-xxx format)
    await expect(page.getByText(/ITOPS-[A-Z0-9]+/i).first()).toBeVisible({ timeout: 5_000 });

    // Title in h4 heading
    await expect(page.getByRole("heading", { name: TICKET_TITLE })).toBeVisible();

    // Description in content area
    await expect(page.getByText(TICKET_DESC)).toBeVisible();

    // Status chip: OPEN (default for new ticket)
    await expect(page.getByText(/^Open$/i).first()).toBeVisible();

    // Priority chip: MEDIUM (default, we didn't change it in this test)
    await expect(page.getByText(/^MEDIUM$/i).first()).toBeVisible();

    // Project shown in the detail card
    await expect(page.getByText(/IT Operations/i).first()).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // TC-TKT-004: Edit ticket — change status to In Progress, priority to Critical
  // -------------------------------------------------------------------------
  test("TC-TKT-004: edits ticket status and priority, verifies update is reflected in UI", async ({ page }) => {
    await loginAsAdmin(page);
    await goToCreateForm(page);

    // Create a fresh ticket
    await page.getByLabel("Title *").fill(TICKET_TITLE);
    await page.getByRole("button", { name: /create ticket/i }).click();
    await expect(page).toHaveURL(/\/tickets\?created=1/, { timeout: 12_000 });

    // Open the ticket — use .first() since multiple tests may have created same-titled tickets
    await expect(page.getByText(TICKET_TITLE).first()).toBeVisible({ timeout: 8_000 });
    await page.getByText(TICKET_TITLE).first().click();
    await expect(page).toHaveURL(/\/tickets\/[a-z0-9]+$/i, { timeout: 8_000 });

    // Click "Edit Ticket" button in the header
    await page.getByRole("button", { name: /edit ticket/i }).click();
    await expect(page.getByRole("heading", { name: /edit ticket information/i })).toBeVisible({ timeout: 5_000 });

    // Change Status from "Open" to "In Progress"
    // In the edit form, Status is a <TextField select> with label "Status"
    await page.getByLabel(/^status$/i).click();
    await page.getByRole("option", { name: /^in progress$/i }).click();

    // Change Priority from "Medium" to "Critical"
    await page.getByLabel(/^priority$/i).click();
    await page.getByRole("option", { name: /^critical$/i }).click();

    // Save changes
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify success message
    await expect(page.getByText(/ticket updated successfully/i)).toBeVisible({ timeout: 8_000 });

    // Verify updated status and priority in the header chips
    await expect(page.getByText(/in progress/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/^CRITICAL$/i).first()).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-TKT-005 → TC-TKT-006: Search (self-contained — creates ticket within test)
// ---------------------------------------------------------------------------
test.describe("Ticket Search", () => {
  // -------------------------------------------------------------------------
  // TC-TKT-005: Search for a ticket by its unique title fragment
  // -------------------------------------------------------------------------
  test("TC-TKT-005: finds a ticket by searching for its unique title prefix", async ({ page }) => {
    const SEARCH_ID = `E2E-SRC-${Date.now()}`;
    const SEARCH_TITLE = `[${SEARCH_ID}] VPN Connection Dropped`;

    // Create the ticket first
    await loginAsAdmin(page);
    await page.goto("/tickets/create");
    await expect(page.getByRole("combobox", { name: /project/i })).toBeVisible({ timeout: 12_000 });
    await page.getByLabel("Title *").fill(SEARCH_TITLE);
    await page.getByRole("button", { name: /create ticket/i }).click();
    await expect(page).toHaveURL(/\/tickets\?created=1/, { timeout: 12_000 });

    // Navigate to the tickets list and search
    await page.goto(ROUTES.tickets);
    await waitForTicketsPage(page);

    const searchBox = page.getByPlaceholder("Search ticket number, title, description...");
    await searchBox.fill(SEARCH_ID);

    // Wait for debounce (400ms) + network response
    await page.waitForTimeout(900);
    await expect(page.getByText(/loading/i)).toBeHidden({ timeout: 8_000 });

    // The ticket should appear
    await expect(page.getByText(SEARCH_TITLE)).toBeVisible({ timeout: 8_000 });
  });

  // -------------------------------------------------------------------------
  // TC-TKT-006: Search returns empty state for a nonexistent query
  // -------------------------------------------------------------------------
  test("TC-TKT-006: shows empty state for a search that matches no tickets", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.tickets);
    await waitForTicketsPage(page);

    const searchBox = page.getByPlaceholder("Search ticket number, title, description...");
    await searchBox.fill("XYZNONEXISTENT99999PQRSTUVWXYZ");

    await page.waitForTimeout(900);
    await expect(page.getByText(/loading/i)).toBeHidden({ timeout: 8_000 });

    await expect(page.getByText(/no matching tickets/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-TKT-007 → TC-TKT-010: Filters
// ---------------------------------------------------------------------------
test.describe("Ticket Filters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.tickets);
    await waitForTicketsPage(page);
  });

  // -------------------------------------------------------------------------
  // TC-TKT-007: Filter by Status = Open
  // -------------------------------------------------------------------------
  test("TC-TKT-007: filters tickets by status 'Open'", async ({ page }) => {
    await selectFilter(page, "Filter tickets by status", "Open");

    await page.waitForTimeout(700);
    await expect(page.getByText(/loading/i)).toBeHidden({ timeout: 8_000 });

    const hasTickets = await page.getByRole("table", { name: /tickets/i }).isVisible();
    const isEmpty = await page.getByText(/no matching tickets/i).isVisible();
    expect(hasTickets || isEmpty).toBeTruthy();

    if (hasTickets) {
      // Status column (index 2 in the table) should only show "Open"
      const rows = page.locator("table tbody tr");
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const statusCell = rows.nth(i).locator("td").nth(2);
        const text = (await statusCell.textContent()) ?? "";
        expect(text.toLowerCase()).not.toMatch(/closed|in progress|resolved/);
      }
    }
  });

  // -------------------------------------------------------------------------
  // TC-TKT-008: Filter by Priority = Critical
  // -------------------------------------------------------------------------
  test("TC-TKT-008: filters tickets by priority 'Critical'", async ({ page }) => {
    await selectFilter(page, "Filter tickets by priority", "Critical");

    await page.waitForTimeout(700);
    await expect(page.getByText(/loading/i)).toBeHidden({ timeout: 8_000 });

    const hasTickets = await page.getByRole("table", { name: /tickets/i }).isVisible();
    const isEmpty = await page.getByText(/no matching tickets/i).isVisible();
    expect(hasTickets || isEmpty).toBeTruthy();

    if (hasTickets) {
      // Priority column (index 3)
      const rows = page.locator("table tbody tr");
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const priorityCell = rows.nth(i).locator("td").nth(3);
        await expect(priorityCell).toHaveText("CRITICAL");
      }
    }
  });

  // -------------------------------------------------------------------------
  // TC-TKT-009: Filter by Project (first available project)
  // -------------------------------------------------------------------------
  test("TC-TKT-009: filters tickets by project", async ({ page }) => {
    // Open the project filter combobox
    await getFilterSelect(page, "Filter tickets by project").click();

    // Pick the first project option (not "All projects")
    const firstProjectOption = page
      .getByRole("option")
      .filter({ hasNotText: /all projects/i })
      .first();
    await expect(firstProjectOption).toBeVisible({ timeout: 5_000 });
    await firstProjectOption.click();

    await page.waitForTimeout(700);
    await expect(page.getByText(/loading/i)).toBeHidden({ timeout: 8_000 });

    const hasTickets = await page.getByRole("table", { name: /tickets/i }).isVisible();
    const isEmpty = await page.getByText(/no matching tickets/i).isVisible();
    expect(hasTickets || isEmpty).toBeTruthy();

    if (hasTickets) {
      const projectCells = page.locator("table tbody tr td:nth-child(2)");
      const count = await projectCells.count();
      if (count > 0) {
        const firstCellText = await projectCells.first().textContent();
        expect(firstCellText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // -------------------------------------------------------------------------
  // TC-TKT-010: Clear filters resets to all-tickets view
  // -------------------------------------------------------------------------
  test("TC-TKT-010: clear filters resets to the full unfiltered ticket list", async ({ page }) => {
    // Apply a filter
    await selectFilter(page, "Filter tickets by status", "Resolved");
    await page.waitForTimeout(700);

    // Clear filters — use .first() since an empty-state secondary button also exists
    await page.getByRole("button", { name: /clear filters/i }).first().click();
    await page.waitForTimeout(700);
    await expect(page.getByText(/loading/i)).toBeHidden({ timeout: 8_000 });

    // Filters should be back to "All …" values
    await expect(getFilterSelect(page, "Filter tickets by status")).toHaveText(/all statuses/i);
    await expect(getFilterSelect(page, "Filter tickets by priority")).toHaveText(/all priorities/i);
  });
});

// ---------------------------------------------------------------------------
// TC-TKT-011: Pagination
// ---------------------------------------------------------------------------
test.describe("Ticket Pagination", () => {
  test("TC-TKT-011: pagination info renders; navigates pages if multiple exist", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTES.tickets);
    await waitForTicketsPage(page);

    const hasTickets = await page.getByRole("table", { name: /tickets/i }).isVisible();

    if (!hasTickets) {
      console.log("TC-TKT-011: No tickets in DB. Pagination cannot be tested with current data.");
      return;
    }

    // Pagination summary always appears when tickets exist
    const paginationInfo = page.getByText(/showing page \d+ of \d+/i);
    await expect(paginationInfo).toBeVisible({ timeout: 5_000 });

    const infoText = (await paginationInfo.textContent()) ?? "";
    const match = infoText.match(/page\s+(\d+)\s+of\s+(\d+)/i);
    const totalPages = parseInt(match?.[2] ?? "1");

    if (totalPages > 1) {
      await page.getByRole("button", { name: "2" }).click();
      await page.waitForTimeout(600);
      await expect(page.getByText(/showing page 2 of/i)).toBeVisible({ timeout: 8_000 });

      await page.getByRole("button", { name: "1" }).click();
      await page.waitForTimeout(600);
      await expect(page.getByText(/showing page 1 of/i)).toBeVisible({ timeout: 5_000 });
    } else {
      console.log(
        `TC-TKT-011: Only ${totalPages} page exists (≤10 tickets). ` +
        "Multi-page pagination not testable with current seed data. " +
        "Pagination info is correctly rendered."
      );
      // The pagination component should still be rendered
      await expect(page.getByText(/showing page 1 of/i)).toBeVisible();
    }
  });
});
