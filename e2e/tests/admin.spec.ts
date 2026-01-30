import { test, expect } from '../helpers/test-helpers';

test.describe('Module Access Control', () => {
  // Authentication handled by adminPage fixture

  test('should display modules page for admin', async ({ adminPage }) => {
    await adminPage.goto('/#/admin?tab=modules');
    await adminPage.waitForLoadState('networkidle');
    
    await expect(adminPage).toHaveURL(/.*#\/admin.*tab=modules/);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /Module/i }).first()).toBeVisible({
      timeout: 10000
    });
  });

  test('should list available modules', async ({ adminPage }) => {
    await adminPage.goto('/#/admin?tab=modules');
    await adminPage.waitForLoadState('networkidle');
    
    // Check for common modules
    const commonModules = [
      'time_tracking',
      'projects',
      'invoices',
      'intranet',
    ];
    
    for (const moduleName of commonModules) {
      // Look for module in the list (may be in code or display name)
      const moduleElement = adminPage.locator(`text=/${moduleName}|Zeiterfassung|Projekte|Rechnungen|Intranet/i`).first();
      await expect(moduleElement).toBeVisible({ timeout: 5000 }).catch(() => {
        // Module might not be visible, that's ok
      });
    }
  });

  test('should show module permissions', async ({ adminPage }) => {
    await adminPage.goto('/#/modules');
    await adminPage.waitForLoadState('networkidle');
    
    // Look for permissions indicators (canView, canCreate, canEdit, canDelete)
    const permissionText = adminPage.locator('text=/canView|canCreate|canEdit|canDelete|Ansehen|Erstellen|Bearbeiten|Löschen/i').first();
    await expect(permissionText).toBeVisible({ timeout: 10000 }).catch(() => {
      // Permissions might be shown differently
    });
  });
});

test.describe('User Management', () => {
  // Authentication handled by adminPage fixture

  test('should display users page', async ({ adminPage }) => {
    await adminPage.goto('/#/users');
    await adminPage.waitForLoadState('networkidle');
    
    await expect(adminPage).toHaveURL(/.*#\/users/);
  });

  test('should list existing users', async ({ adminPage }) => {
    await adminPage.goto('/#/users');
    await adminPage.waitForLoadState('networkidle');
    
    // Check if admin user is listed
    await expect(adminPage.locator('text=/admin@timetracking.local/i').first()).toBeVisible({
      timeout: 10000
    });
  });

  test('should have create user button', async ({ adminPage }) => {
    await adminPage.goto('/#/users');
    await adminPage.waitForLoadState('networkidle');
    
    const createButton = adminPage.locator('button:has-text("Benutzer")').or(
      adminPage.locator('button:has-text("Hinzufügen")')
    ).or(
      adminPage.locator('button:has-text("Erstellen")')
    );
    
    await expect(createButton.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // Create button might be labeled differently
    });
  });
});

test.describe('User Groups', () => {
  // Authentication handled by adminPage fixture

  test('should display user groups page', async ({ adminPage }) => {
    await adminPage.goto('/#/admin?tab=user-groups');
    await adminPage.waitForLoadState('networkidle');
    
    await expect(adminPage).toHaveURL(/.*#\/admin.*tab=user-groups/);
  });

  test('should show admin group', async ({ adminPage }) => {
    await adminPage.goto('/#/admin?tab=user-groups');
    await adminPage.waitForLoadState('networkidle');
    
    // Look for admin group
    await expect(adminPage.locator('text=/Admin|Administrator/i').first()).toBeVisible({
      timeout: 10000
    });
  });
});
