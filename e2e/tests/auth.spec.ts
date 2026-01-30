import { test, expect } from '../helpers/test-helpers';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/CFlux|Time Tracking|cflux/i);
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input#email', 'invalid@example.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=/ungültig|invalid|fehlgeschlagen|error/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'godspeed');
    await page.click('button[type="submit"]');
    
    // Wait a bit for the response
    await page.waitForTimeout(2000);
    
    // Check if we're on the dashboard OR if password change modal appeared
    const currentUrl = page.url();
    if (currentUrl.includes('#/dashboard')) {
      await expect(page).toHaveURL(/.*#\/dashboard/);
    } else if (currentUrl.includes('#/login')) {
      // Still on login, check if password change modal is visible
      const passwordModal = page.locator('text=/Passwort ändern|Change Password/i').first();
      const isModalVisible = await passwordModal.isVisible().catch(() => false);
      expect(isModalVisible || currentUrl.includes('#/dashboard')).toBeTruthy();
    }
  });

  test('should require email field', async ({ page }) => {
    await page.fill('input#password', 'somepassword');
    await page.click('button[type="submit"]');
    
    // HTML5 validation or custom error should appear
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeFocused();
  });

  test('should require password field', async ({ page }) => {
    await page.fill('input#email', 'test@example.com');
    // Don't fill password
    await page.click('button[type="submit"]');
    
    // Check if password field is required
    const passwordInput = page.locator('input#password');
    const isRequired = await passwordInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });
});
