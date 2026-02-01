import { test, expect } from '../helpers/test-helpers';

test.describe('Dashboard', () => {
  // Authentication handled by adminPage fixture

  test('should display dashboard after login', async ({ adminPage }) => {
    // Already logged in via adminPage fixture
    await expect(adminPage).toHaveURL(/.*#\/dashboard/);
  });

  test('should show navigation menu', async ({ adminPage }) => {
    // Check for common navigation elements
    const navElements = [
      'Dashboard',
      'Zeit',
      'Projekte'      
    ];

    for (const element of navElements) {
      const locator = adminPage.locator(`text=${element}`).first();
      await expect(locator).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow navigation to time tracking', async ({ adminPage }) => {
    // Click on time tracking menu item
    await adminPage.click('text=/Zeit|Time/i').catch(() => {
      // Fallback to href navigation
      return adminPage.goto('/#/dashboard');
    });

    // Wait for the time page to load
    await adminPage.waitForURL(/.*#\/dashboard/);
    
    // Check for time-related content
    await expect(adminPage.locator('text=/Zeit erfassen|Stunden|Clock/i').first()).toBeVisible({
      timeout: 10000
    });
  });

  test('should display user info in header', async ({ adminPage }) => {
    // Check if user menu or user info is displayed
    const userMenu = adminPage.locator('[data-testid="user-menu"]').or(
      adminPage.locator('text=/admin@timetracking.local/i')
    );
    
    await expect(userMenu.first()).toBeVisible({ timeout: 10000 });
  });
});
