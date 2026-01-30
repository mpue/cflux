import { test as setup } from '@playwright/test';
import { TEST_USERS } from '../helpers/test-helpers';

const adminAuthFile = 'e2e/.auth/admin.json';

/**
 * Setup authentication state for admin user
 * This will be reused across tests to avoid logging in every time
 */
setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/#/login');

  // Fill in admin credentials
  await page.fill('input#email', TEST_USERS.admin.email);
  await page.fill('input#password', TEST_USERS.admin.password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for redirect after successful login
  await page.waitForURL(/.*#\/dashboard/, { timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: adminAuthFile });
});
