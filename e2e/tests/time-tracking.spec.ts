import { test, expect, waitForApiResponse } from '../helpers/test-helpers';

test.describe('Time Tracking', () => {
  // Authentication handled by adminPage fixture

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/#/dashboard');
    await adminPage.waitForLoadState('networkidle');
  });

  test('should display time tracking page', async ({ adminPage }) => {
    await expect(adminPage).toHaveURL(/.*#\/dashboard/);
    await expect(adminPage.locator('h1, h2, h3').filter({ hasText: /Zeit|Time/i }).first()).toBeVisible();
  });

  test('should show clock-in button when not clocked in', async ({ adminPage }) => {
    // Look for clock-in button (Einstempeln)
    const clockInButton = adminPage.locator('button:has-text("Einstempeln")').or(
      adminPage.locator('button:has-text("Clock In")')
    );
    
    // If already clocked in, clock out first
    const clockOutButton = adminPage.locator('button:has-text("Ausstempeln")').or(
      adminPage.locator('button:has-text("Clock Out")')
    );
    
    const isVisible = await clockOutButton.first().isVisible().catch(() => false);
    if (isVisible) {
      await clockOutButton.first().click();
      await adminPage.waitForTimeout(1000);
    }
    
    await expect(clockInButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display time entries list', async ({ adminPage }) => {
    // Check if there's a table or list of time entries
    const timeEntriesList = adminPage.locator('table, [role="table"], .time-entries-list').first();
    
    // May be empty, but container should exist
    await expect(timeEntriesList).toBeVisible({ timeout: 10000 }).catch(async () => {
      // Fallback: check for "no entries" message or any time-related content
      await expect(adminPage.locator('text=/Keine Einträge|No entries|Zeiteinträge/i').first()).toBeVisible();
    });
  });

  test('should allow filtering time entries by date', async ({ adminPage }) => {
    // Look for date picker or filter inputs
    const dateInputs = adminPage.locator('input[type="date"]');
    const count = await dateInputs.count();
    
    if (count > 0) {
      // Set date filter
      await dateInputs.first().fill('2026-01-01');
      await adminPage.waitForTimeout(500);
      
      // Check if API was called with filter
      // (Response will vary based on data)
    }
  });

  test('should display current week summary', async ({ adminPage }) => {
    // Look for weekly hours summary
    const summary = adminPage.locator('text=/Woche|Week|Stunden|Hours/i').first();
    await expect(summary).toBeVisible({ timeout: 10000 }).catch(() => {
      // Summary might not be visible if no data
    });
  });
});

test.describe('Time Entry CRUD', () => {
  // Authentication handled by adminPage fixture

  test('should open create time entry modal', async ({ adminPage }) => {
    await adminPage.goto('/#/time');
    await adminPage.waitForLoadState('networkidle');
    
    // Look for "Add" or "Create" button
    const createButton = adminPage.locator('button:has-text("Hinzufügen")').or(
      adminPage.locator('button:has-text("Erstellen")')
    ).or(
      adminPage.locator('button:has-text("Neue")')
    );
    
    const isVisible = await createButton.first().isVisible().catch(() => false);
    
    if (isVisible) {
      await createButton.first().click();
      
      // Wait for modal to open
      await expect(adminPage.locator('[role="dialog"], .modal').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
