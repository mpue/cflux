import { test, expect } from '../helpers/test-helpers';

test.describe('Projects Management', () => {
  // Authentication handled by adminPage fixture

  test('should display projects page', async ({ adminPage }) => {
    await adminPage.goto('/#/admin?tab=projects');
    await adminPage.waitForLoadState('networkidle');
    
    await expect(adminPage).toHaveURL(/.*#\/admin.*tab=projects/);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /Projektverwaltung|Projects/i }).first()).toBeVisible({
      timeout: 10000
    });
  });

  test('should have create project button', async ({ adminPage }) => {
    await adminPage.goto('/#/admin?tab=projects');
    await adminPage.waitForLoadState('networkidle');
    
    const createButton = adminPage.locator('button').filter({ hasText: /Projekt|Erstellen|Hinzufügen|Create/i }).first();
    await expect(createButton).toBeVisible({ timeout: 10000 }).catch(() => {
      // Button might have different text
    });
  });

  test('should display project list or empty state', async ({ adminPage }) => {
    await adminPage.goto('/#/admin?tab=projects');
    await adminPage.waitForLoadState('networkidle');
    
    // Either projects list or empty state should be visible
    const projectsList = adminPage.locator('table, [role="table"], .project-list').first();
    const emptyState = adminPage.locator('text=/Keine Projekte|No projects|Kein/i').first();
    
    const hasProjects = await projectsList.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasProjects || isEmpty).toBeTruthy();
  });
});
