import { ScopePermission, scopesAllow } from '../services/apiKey.service';

/**
 * Deny-by-default fuer die Public API.
 *
 * Ein API-Schluessel erreicht ausschliesslich Pfade, die hier ausdruecklich
 * freigegeben sind. Alles andere ist gesperrt — auch neue Routen, ohne dass
 * jemand daran denken muss. Das ist der Unterschied zu einer Pruefung, die an
 * `requireModuleAccess` haengt: die steht nur in einem Bruchteil der Routen,
 * und was sie nicht abdeckt, waere sonst fuer jeden gueltigen Schluessel offen.
 *
 * Bewusst NICHT freigegeben und damit nur mit echtem Login erreichbar:
 * /api/auth, /api/api-keys, /api/users, /api/user-groups, /api/modules,
 * /api/backup, /api/system-settings, /api/payroll, /api/workflows, /api/actions,
 * /api/uploads, /api/media, /api/messages, /api/intranet, /api/document-nodes,
 * /api/compliance, /api/applicants, /api/onboarding, /api/job-functions,
 * /api/elearning, /api/equipment-training, /api/stories, /api/dashboard-layout,
 * /api/system-stats.
 */

/**
 * Mount-Praefix aus index.ts -> Modul-Key aus der Tabelle `modules`.
 *
 * Der Modul-Key muss existieren, sonst laesst sich der passende Scope gar nicht
 * erst vergeben (validateScopes im Controller prueft gegen dieselbe Tabelle).
 * `publicApiScopeModules` haelt beide Seiten zusammen, der Test dazu prueft es.
 */
export const PUBLIC_API_ROUTES: Record<string, string> = {
  '/api/absences': 'absences',
  '/api/article-groups': 'articles',
  '/api/articles': 'articles',
  '/api/berichte': 'berichte',
  '/api/checklists': 'checklists',
  '/api/cost-centers': 'cost_centers',
  '/api/customers': 'customers',
  '/api/departments': 'departments',
  '/api/devices': 'devices',
  '/api/incidents': 'incidents',
  '/api/inventory': 'inventory',
  '/api/invoice-templates': 'invoices',
  '/api/invoices': 'invoices',
  '/api/locations': 'locations',
  '/api/news': 'news',
  '/api/orders': 'orders',
  '/api/project-budgets': 'project_budget',
  '/api/project-reports': 'project_reports',
  '/api/project-tasks': 'projects',
  '/api/project-time-allocations': 'projects',
  '/api/projects': 'projects',
  '/api/reminders': 'reminders',
  '/api/reports': 'reports',
  '/api/suppliers': 'suppliers',
  '/api/time': 'time_tracking',
  '/api/travel-expenses': 'travel_expenses',
  '/api/zeitmodelle': 'zeitmodelle',
};

/** Nur lesende Methoden; alles andere verlangt einen :write-Scope. */
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/** Die Modul-Keys, fuer die ueberhaupt ein Scope Sinn ergibt. */
export const publicApiScopeModules = (): string[] =>
  Array.from(new Set(Object.values(PUBLIC_API_ROUTES))).sort();

/**
 * Ordnet einen Request-Pfad einem Modul zu. Trifft nur auf Segmentgrenzen,
 * damit /api/project-tasks nicht faelschlich als /api/projects durchgeht.
 */
export const resolvePublicApiModule = (rawPath: string): string | null => {
  const path = rawPath.split('?')[0].replace(/\/+$/, '') || '/';

  let match: string | null = null;
  for (const prefix of Object.keys(PUBLIC_API_ROUTES)) {
    if (path !== prefix && !path.startsWith(`${prefix}/`)) continue;
    // Laengster Treffer gewinnt, falls sich Praefixe je ueberlappen sollten.
    if (!match || prefix.length > match.length) {
      match = prefix;
    }
  }

  return match ? PUBLIC_API_ROUTES[match] : null;
};

export type ApiScopeResult =
  | { allowed: true; moduleKey: string; permission: ScopePermission }
  | { allowed: false; reason: 'not-public' }
  | { allowed: false; reason: 'missing-scope'; requiredScope: string };

/**
 * Entscheidet, ob ein Schluessel diesen Request stellen darf.
 *
 * Der Wildcard-Scope "*" deckt alle Module ab, hebelt die Freigabe aber nicht
 * aus: was hier nicht steht, ist auch fuer einen Wildcard-Schluessel zu.
 */
export const checkApiKeyAccess = (
  rawPath: string,
  method: string,
  scopes: string[]
): ApiScopeResult => {
  const moduleKey = resolvePublicApiModule(rawPath);
  if (!moduleKey) {
    return { allowed: false, reason: 'not-public' };
  }

  const permission: ScopePermission = READ_METHODS.includes(method.toUpperCase())
    ? 'read'
    : 'write';

  if (!scopesAllow(scopes, moduleKey, permission)) {
    return { allowed: false, reason: 'missing-scope', requiredScope: `${moduleKey}:${permission}` };
  }

  return { allowed: true, moduleKey, permission };
};
