import {
  PUBLIC_API_ROUTES,
  checkApiKeyAccess,
  publicApiScopeModules,
  resolvePublicApiModule,
} from '../middleware/apiScope';

/**
 * Die Freigabeliste ist die eigentliche Sicherheitsgrenze der Public API.
 * Deshalb wird hier nicht nur geprueft, was erlaubt ist, sondern vor allem,
 * dass alles Nichtgenannte zu bleibt.
 */

describe('resolvePublicApiModule', () => {
  it('ordnet einen freigegebenen Pfad seinem Modul zu', () => {
    expect(resolvePublicApiModule('/api/projects')).toBe('projects');
    expect(resolvePublicApiModule('/api/projects/42')).toBe('projects');
    expect(resolvePublicApiModule('/api/projects/42/tasks')).toBe('projects');
  });

  it('ignoriert Query-String und abschliessenden Slash', () => {
    expect(resolvePublicApiModule('/api/customers/?page=2')).toBe('customers');
    expect(resolvePublicApiModule('/api/customers?search=a%2Fb')).toBe('customers');
  });

  it('trifft nur auf Segmentgrenzen', () => {
    // Sonst wuerde /api/project-tasks als /api/projects durchgehen.
    expect(resolvePublicApiModule('/api/project-tasks')).toBe('projects');
    expect(resolvePublicApiModule('/api/project-reports')).toBe('project_reports');
    expect(resolvePublicApiModule('/api/project-budgets')).toBe('project_budget');
    expect(resolvePublicApiModule('/api/projectsomething')).toBeNull();
  });

  it('liefert null fuer nicht freigegebene Pfade', () => {
    expect(resolvePublicApiModule('/api/backup/export')).toBeNull();
    expect(resolvePublicApiModule('/api/users')).toBeNull();
    expect(resolvePublicApiModule('/api/api-keys')).toBeNull();
    expect(resolvePublicApiModule('/api/system-stats')).toBeNull();
    expect(resolvePublicApiModule('/api/auth/login')).toBeNull();
  });
});

describe('checkApiKeyAccess — gesperrte Endpunkte', () => {
  const SENSITIVE = [
    '/api/backup/export',
    '/api/backup/create',
    '/api/users',
    '/api/user-groups',
    '/api/api-keys',
    '/api/auth/login',
    '/api/payroll',
    '/api/system-settings',
    '/api/modules',
    '/api/workflows',
    '/api/uploads',
    '/api/system-stats',
  ];

  it.each(SENSITIVE)('sperrt %s auch fuer einen Wildcard-Schluessel', (path) => {
    const result = checkApiKeyAccess(path, 'GET', ['*']);
    expect(result).toEqual({ allowed: false, reason: 'not-public' });
  });
});

describe('checkApiKeyAccess — Scope-Pruefung', () => {
  it('laesst einen Lese-Request mit passendem read-Scope durch', () => {
    expect(checkApiKeyAccess('/api/projects', 'GET', ['projects:read'])).toEqual({
      allowed: true,
      moduleKey: 'projects',
      permission: 'read',
    });
  });

  it('leitet aus einem read-Scope kein Schreibrecht ab', () => {
    expect(checkApiKeyAccess('/api/projects', 'POST', ['projects:read'])).toEqual({
      allowed: false,
      reason: 'missing-scope',
      requiredScope: 'projects:write',
    });
  });

  it('schliesst read in write mit ein', () => {
    expect(checkApiKeyAccess('/api/projects', 'GET', ['projects:write']).allowed).toBe(true);
    expect(checkApiKeyAccess('/api/projects', 'DELETE', ['projects:write']).allowed).toBe(true);
  });

  it('trennt Module sauber', () => {
    expect(checkApiKeyAccess('/api/invoices', 'GET', ['projects:write'])).toEqual({
      allowed: false,
      reason: 'missing-scope',
      requiredScope: 'invoices:read',
    });
  });

  it('behandelt PUT und PATCH als schreibend', () => {
    for (const method of ['PUT', 'PATCH', 'POST', 'DELETE']) {
      expect(checkApiKeyAccess('/api/orders', method, ['orders:read']).allowed).toBe(false);
    }
  });

  it('behandelt GET, HEAD und OPTIONS als lesend', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS', 'get']) {
      expect(checkApiKeyAccess('/api/orders', method, ['orders:read']).allowed).toBe(true);
    }
  });

  it('lehnt einen Schluessel ganz ohne Scopes ueberall ab', () => {
    for (const prefix of Object.keys(PUBLIC_API_ROUTES)) {
      expect(checkApiKeyAccess(prefix, 'GET', []).allowed).toBe(false);
    }
  });

  it('erlaubt dem Wildcard-Scope jedes freigegebene Modul', () => {
    for (const prefix of Object.keys(PUBLIC_API_ROUTES)) {
      expect(checkApiKeyAccess(prefix, 'GET', ['*']).allowed).toBe(true);
      expect(checkApiKeyAccess(prefix, 'POST', ['*']).allowed).toBe(true);
    }
  });
});

describe('publicApiScopeModules', () => {
  it('liefert jedes Modul genau einmal, sortiert', () => {
    const modules = publicApiScopeModules();
    expect(new Set(modules).size).toBe(modules.length);
    expect([...modules].sort()).toEqual(modules);
  });

  it('deckt sich mit den Werten der Freigabeliste', () => {
    expect(new Set(publicApiScopeModules())).toEqual(new Set(Object.values(PUBLIC_API_ROUTES)));
  });

  it('benutzt ausschliesslich Modul-Keys, die es in der Anwendung gibt', () => {
    // Gegen die Modultabelle gepflegt: ein Scope auf ein unbekanntes Modul
    // liesse sich im Controller gar nicht erst vergeben.
    const KNOWN_MODULE_KEYS = [
      'absences', 'articles', 'berichte', 'checklists', 'compliance', 'cost_centers',
      'customers', 'dashboard', 'departments', 'devices', 'elearning', 'holidays',
      'incidents', 'intranet', 'inventory', 'invoices', 'job_functions', 'locations',
      'modules', 'news', 'onboarding', 'orders', 'payroll', 'project_budget',
      'project_planning', 'project_reports', 'projects', 'reminders', 'reports',
      'settings', 'suppliers', 'system_logs', 'time_tracking', 'travel_expenses',
      'user_groups', 'users', 'workflows', 'zeitmodelle',
    ];

    for (const moduleKey of publicApiScopeModules()) {
      expect(KNOWN_MODULE_KEYS).toContain(moduleKey);
    }
  });

  it('gibt kein Modul frei, das nur mit Login erreichbar sein darf', () => {
    const LOGIN_ONLY = ['users', 'user_groups', 'modules', 'settings', 'payroll', 'workflows', 'system_logs'];
    for (const moduleKey of LOGIN_ONLY) {
      expect(publicApiScopeModules()).not.toContain(moduleKey);
    }
  });
});
