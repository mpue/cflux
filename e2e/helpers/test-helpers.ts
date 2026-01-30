import { test as base, expect } from '@playwright/test';

/**
 * Test credentials for different user roles
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'godspeed',
  },
  manager: {
    email: 'manager@example.com',
    password: 'Manager123!',
  },
  employee: {
    email: 'employee@example.com',
    password: 'Employee123!',
  },
};

/**
 * Extended test fixtures with authentication helpers
 */
type TestFixtures = {
  authenticatedPage: any;
  adminPage: any;
};

export const test = base.extend<TestFixtures>({
  /**
   * Page with authenticated admin user
   */
  adminPage: async ({ page }, use) => {
    await page.goto('/#/login');
    await page.fill('input#email', TEST_USERS.admin.email);
    await page.fill('input#password', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait a bit for the response
    await page.waitForTimeout(2000);
    
    // Check if password change modal appeared
    const passwordChangeModal = page.locator('text=/Passwort ändern|Change Password/i').first();
    const isModalVisible = await passwordChangeModal.isVisible().catch(() => false);
    
    if (isModalVisible) {
      // Handle password change if required
      const newPasswordInput = page.locator('input[type="password"]').first();
      const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
      
      await newPasswordInput.fill('Admin123!');
      await confirmPasswordInput.fill('Admin123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/.*#\/dashboard/, { timeout: 10000 });
    } else {
      // Already logged in, wait for dashboard
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      if (!currentUrl.includes('#/dashboard')) {
        await page.goto('/#/dashboard');
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Don't navigate away from the login destination yet
    // Tests will navigate to their specific pages in beforeEach
    
    await use(page);
  },

  /**
   * Page with custom authentication
   */
  authenticatedPage: async ({ page }, use) => {
    // This can be customized per test
    await use(page);
  },
});

export { expect };

/**
 * Helper function to login with specific credentials
 */
export async function login(page: any, email: string, password: string) {
  await page.goto('/#/login');
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation or modal
  await page.waitForTimeout(2000);
  
  // Check if we're redirected or modal appeared
  const currentUrl = page.url();
  if (!currentUrl.includes('#/dashboard')) {
    // Wait a bit more
    await page.waitForTimeout(1000);
  }
}

/**
 * Helper function to logout
 */
export async function logout(page: any) {
  // Click user menu or logout button
  await page.click('[data-testid="user-menu"]').catch(() => {
    // Fallback: look for logout button directly
    return page.click('button:has-text("Abmelden")');
  });
  await page.click('button:has-text("Abmelden")').catch(() => {});
  await page.waitForURL(/.*#\/login/);
}

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(page: any, urlPattern: string | RegExp) {
  return page.waitForResponse((response: any) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Helper to check if element exists
 */
export async function elementExists(page: any, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
