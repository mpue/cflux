import { test, expect } from '../helpers/test-helpers';
import path from 'path';
import fs from 'fs';

/**
 * Kickstart Screenshot Test
 * 
 * Navigiert systematisch durch alle Admin-Tabs und Hauptseiten,
 * wartet bis der Inhalt geladen ist und speichert Screenshots
 * mit sprechenden Namen im Ordner kickstart/.
 * 
 * Ausführen mit:
 *   npx playwright test e2e/tests/kickstart-screenshots.spec.ts --project=chromium
 */

const SCREENSHOT_DIR = path.resolve(__dirname, '../../web/kickstart');

// Alle Admin-Tabs mit sprechenden Screenshot-Namen
const ADMIN_TABS: { tab: string; name: string; waitFor?: string }[] = [
  // === Benutzer & Teams ===
  { tab: 'users', name: 'admin_benutzer', waitFor: 'Benutzer' },
  { tab: 'userGroups', name: 'admin_benutzergruppen', waitFor: 'Gruppen' },
  { tab: 'locations', name: 'admin_standorte', waitFor: 'Standort' },
  { tab: 'orgChart', name: 'admin_organigramm', waitFor: 'Organigramm' },

  // === Zeit & Abwesenheit ===
  { tab: 'timeEntries', name: 'admin_zeiteintraege', waitFor: 'Zeit' },
  { tab: 'absences', name: 'admin_abwesenheiten', waitFor: 'Abwesenheit' },
  { tab: 'vacationPlanner', name: 'admin_urlaubsplaner', waitFor: 'Urlaub' },
  { tab: 'holidays', name: 'admin_feiertage', waitFor: 'Feiertag' },

  // === Finanzen ===
  { tab: 'invoices', name: 'admin_rechnungen', waitFor: 'Rechnung' },
  { tab: 'invoiceTemplates', name: 'admin_rechnungsvorlagen', waitFor: 'Vorlage' },
  { tab: 'reminders', name: 'admin_mahnwesen', waitFor: 'Mahn' },
  { tab: 'travelExpenses', name: 'admin_reisekosten', waitFor: 'Reise' },
  { tab: 'payroll', name: 'admin_lohnabrechnung', waitFor: 'Lohn' },
  { tab: 'zeitmodelle', name: 'admin_zeitmodelle', waitFor: 'Zeitmodell' },

  // === Stammdaten ===
  { tab: 'customers', name: 'admin_kunden', waitFor: 'Kunde' },
  { tab: 'suppliers', name: 'admin_lieferanten', waitFor: 'Lieferant' },
  { tab: 'departments', name: 'admin_abteilungen', waitFor: 'Abteilung' },
  { tab: 'orders', name: 'admin_bestellungen', waitFor: 'Bestell' },
  { tab: 'articleGroups', name: 'admin_artikelgruppen', waitFor: 'Artikelgrupp' },
  { tab: 'articles', name: 'admin_artikel', waitFor: 'Artikel' },
  { tab: 'devices', name: 'admin_geraete', waitFor: 'Gerät' },
  { tab: 'costCenters', name: 'admin_kostenstellen', waitFor: 'Kostenstell' },
  { tab: 'inventory', name: 'admin_lagerbestand', waitFor: 'Lager' },

  // === Projektmanagement ===
  { tab: 'projects', name: 'admin_projekte', waitFor: 'Projekt' },
  { tab: 'projectBudget', name: 'admin_projektbudget', waitFor: 'Budget' },
  { tab: 'projectReports', name: 'admin_projektberichte', waitFor: 'Report' },
  { tab: 'projectPlanning', name: 'admin_projektplanung', waitFor: 'Planung' },

  // === Reports ===
  { tab: 'reports', name: 'admin_analytics', waitFor: 'Analytic' },
  { tab: 'timeBookings', name: 'admin_stunden_alle', waitFor: 'Stunden' },
  { tab: 'userTimeBookings', name: 'admin_stunden_user', waitFor: 'Stunden' },
  { tab: 'businessReport', name: 'admin_geschaeftsbericht', waitFor: 'Geschäft' },
  { tab: 'compliance', name: 'admin_compliance', waitFor: 'Compliance' },

  // === System ===
  { tab: 'workflows', name: 'admin_workflows', waitFor: 'Workflow' },
  { tab: 'workflowActions', name: 'admin_workflow_actions', waitFor: 'Workflow' },
  { tab: 'systemLogs', name: 'admin_system_logs', waitFor: 'Log' },
  { tab: 'modules', name: 'admin_module', waitFor: 'Modul' },
  { tab: 'modulePermissions', name: 'admin_berechtigungen', waitFor: 'Berechtigung' },
  { tab: 'settings', name: 'admin_einstellungen', waitFor: 'Einstellung' },
  { tab: 'elearning', name: 'admin_elearning', waitFor: 'Learning' },
  { tab: 'onboarding', name: 'admin_onboarding', waitFor: 'Onboarding' },
  { tab: 'jobFunctions', name: 'admin_funktionen', waitFor: 'Funktion' },
  { tab: 'checklists', name: 'admin_checklisten', waitFor: 'Checkliste' },
  { tab: 'news', name: 'admin_news', waitFor: 'News' },
  { tab: 'backup', name: 'admin_backup', waitFor: 'Backup' },
];

// Standalone-Seiten (nicht im Admin-Panel)
const STANDALONE_PAGES: { path: string; name: string; waitFor?: string }[] = [
  { path: '/dashboard', name: 'dashboard', waitFor: 'Dashboard' },
  { path: '/profile', name: 'profil', waitFor: 'Profil' },
  { path: '/incidents', name: 'incidents', waitFor: 'Vorfall' },
  { path: '/ehs-dashboard', name: 'ehs_dashboard', waitFor: 'EHS' },
  { path: '/messages', name: 'nachrichten', waitFor: 'Nachricht' },
  { path: '/intranet', name: 'intranet', waitFor: 'Intranet' },
  { path: '/media', name: 'medien', waitFor: 'Medien' },
  { path: '/orders', name: 'bestellungen', waitFor: 'Bestell' },
  { path: '/elearning', name: 'elearning', waitFor: 'Learning' },
  { path: '/checklists', name: 'checklisten', waitFor: 'Checkliste' },
];

test.describe('Kickstart Screenshots - Alle Tabs und Seiten', () => {
  test.beforeAll(() => {
    // Sicherstellen, dass der Screenshot-Ordner existiert
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  // ----- Admin-Panel Tabs -----
  for (const { tab, name, waitFor } of ADMIN_TABS) {
    test(`Admin Tab: ${name}`, async ({ adminPage }) => {
      // Höhere Auflösung setzen
      await adminPage.setViewportSize({ width: 1920, height: 1080 });

      // Navigiere zum Tab
      await adminPage.goto(`/#/admin?tab=${tab}`);
      await adminPage.waitForLoadState('networkidle');
      await adminPage.waitForTimeout(1500);

      // Versuche auf spezifischen Inhalt zu warten
      if (waitFor) {
        try {
          await adminPage.locator(`text=/${waitFor}/i`).first().waitFor({ timeout: 5000 });
        } catch {
          // Inhalt nicht gefunden — trotzdem Screenshot machen
        }
      }

      // Noch kurz warten für Animationen / lazy loading
      await adminPage.waitForTimeout(500);

      // Screenshot speichern
      await adminPage.screenshot({
        path: path.join(SCREENSHOT_DIR, `${name}.png`),
        fullPage: true,
      });
    });
  }

  // ----- Standalone-Seiten -----
  for (const { path: pagePath, name, waitFor } of STANDALONE_PAGES) {
    test(`Seite: ${name}`, async ({ adminPage }) => {
      // Höhere Auflösung setzen
      await adminPage.setViewportSize({ width: 1920, height: 1080 });

      await adminPage.goto(`/#${pagePath}`);
      await adminPage.waitForLoadState('networkidle');
      await adminPage.waitForTimeout(1500);

      if (waitFor) {
        try {
          await adminPage.locator(`text=/${waitFor}/i`).first().waitFor({ timeout: 5000 });
        } catch {
          // Inhalt nicht gefunden — trotzdem Screenshot machen
        }
      }

      await adminPage.waitForTimeout(500);

      await adminPage.screenshot({
        path: path.join(SCREENSHOT_DIR, `${name}.png`),
        fullPage: true,
      });
    });
  }

  // ----- Login-Seite (ohne Auth) -----
  test('Login-Seite', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'login.png'),
      fullPage: true,
    });
  });

  // ----- Landing Page (ohne Auth) -----
  test('Landing Page', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'landing_page.png'),
      fullPage: true,
    });
  });
});
