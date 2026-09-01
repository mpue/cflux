# Endpunktverzeichnis der Public API

> Erzeugt von `scripts/api-inventar.py`. Nicht von Hand bearbeiten —
> Änderungen gehen beim nächsten Lauf verloren. Nach einer neuen Route:
> `python3 scripts/api-inventar.py`

Aufstellung aller Endpunkte des Backends danach, was ein API-Schlüssel
erreicht und was einen echten Login verlangt. Die Architektur dahinter
steht in [`PUBLIC_API.md`](PUBLIC_API.md), die offenen Punkte in
[`PUBLIC_API_LUECKEN.md`](PUBLIC_API_LUECKEN.md).

| | Anzahl |
|---|---:|
| Endpunkte insgesamt | 658 |
| über die Public API erreichbar | 317 |
| nur mit echtem Login | 341 |
| davon Bereiche, die gesperrt bleiben sollen | 73 |
| freigegeben, aber zusätzlich nur für Administratoren | 103 |
| freigegeben und mit einer Modulrechtsprüfung | 45 |
| freigegeben und von einem MCP-Werkzeug benutzt | 27 |

**Marken:** `MCP` — ein Werkzeug des MCP-Servers ruft diesen Endpunkt auf.
`ADMIN` — verlangt zusätzlich zur Modulfreigabe die Rolle `ADMIN`.
`Modulrecht` — prüft, ob der Benutzer hinter dem Schlüssel das Modul haben darf.

---

## Freigegeben

317 Endpunkte in 25 Modulen.
Ein Schlüssel mit dem genannten Scope kommt hier durch — sofern die Marken
in der letzten Spalte nichts Weiteres verlangen.

### Abteilungen

Scope `departments:read` bzw. `departments:write` · 8 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/departments` | — |
| `POST` | `/api/departments` | ADMIN |
| `DELETE` | `/api/departments/:id` | ADMIN |
| `GET` | `/api/departments/:id` | — |
| `PUT` | `/api/departments/:id` | ADMIN |
| `GET` | `/api/departments/:id/available-employees` | ADMIN |
| `POST` | `/api/departments/:id/employees` | ADMIN |
| `DELETE` | `/api/departments/:id/employees/:employeeId` | ADMIN |

### Abwesenheiten

Scope `absences:read` bzw. `absences:write` · 9 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/absences` | ADMIN |
| `POST` | `/api/absences` | — |
| `DELETE` | `/api/absences/:id` | ADMIN |
| `PUT` | `/api/absences/:id/approve` | ADMIN |
| `PUT` | `/api/absences/:id/reject` | ADMIN |
| `POST` | `/api/absences/manual` | ADMIN |
| `GET` | `/api/absences/my-requests` | — |
| `DELETE` | `/api/absences/my-requests/:id` | — |
| `PUT` | `/api/absences/my-requests/:id` | — |

### Artikel & Artikelgruppen

Scope `articles:read` bzw. `articles:write` · 10 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/article-groups` | — |
| `POST` | `/api/article-groups` | ADMIN |
| `DELETE` | `/api/article-groups/:id` | ADMIN |
| `GET` | `/api/article-groups/:id` | — |
| `PUT` | `/api/article-groups/:id` | ADMIN |
| `GET` | `/api/articles` | — |
| `POST` | `/api/articles` | ADMIN |
| `DELETE` | `/api/articles/:id` | ADMIN |
| `GET` | `/api/articles/:id` | — |
| `PUT` | `/api/articles/:id` | ADMIN |

### Aufträge

Scope `orders:read` bzw. `orders:write` · 12 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/orders` | — |
| `POST` | `/api/orders` | — |
| `DELETE` | `/api/orders/:id` | — |
| `GET` | `/api/orders/:id` | — |
| `PUT` | `/api/orders/:id` | — |
| `POST` | `/api/orders/:id/approve` | — |
| `POST` | `/api/orders/:id/cancel` | — |
| `POST` | `/api/orders/:id/deliveries` | — |
| `POST` | `/api/orders/:id/mark-ordered` | — |
| `POST` | `/api/orders/:id/reject` | — |
| `POST` | `/api/orders/:id/request-approval` | — |
| `GET` | `/api/orders/statistics` | — |

### Auswertungen

Scope `reports:read` bzw. `reports:write` · 14 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/reports/absence-analytics` | ADMIN |
| `GET` | `/api/reports/all-users-summary` | ADMIN |
| `GET` | `/api/reports/attendance-by-month` | ADMIN |
| `GET` | `/api/reports/my-pdf` | — |
| `GET` | `/api/reports/my-summary` | — |
| `GET` | `/api/reports/overtime-report` | ADMIN |
| `GET` | `/api/reports/project-summary/:projectId` | ADMIN |
| `GET` | `/api/reports/project-time-by-user` | ADMIN |
| `GET` | `/api/reports/time-bookings` | ADMIN |
| `GET` | `/api/reports/time-bookings-pdf` | ADMIN |
| `GET` | `/api/reports/user-pdf/:userId` | ADMIN |
| `GET` | `/api/reports/user-summary/:userId` | ADMIN |
| `GET` | `/api/reports/user-time-bookings-pdf/:userId` | ADMIN |
| `GET` | `/api/reports/user-time-bookings/:userId` | ADMIN |

### Checklisten

Scope `checklists:read` bzw. `checklists:write` · 22 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `DELETE` | `/api/checklists/attachments/:attachmentId` | Modulrecht |
| `GET` | `/api/checklists/attachments/:attachmentId/download` | Modulrecht |
| `GET` | `/api/checklists/instances` | Modulrecht |
| `POST` | `/api/checklists/instances` | Modulrecht |
| `DELETE` | `/api/checklists/instances/:id` | Modulrecht |
| `GET` | `/api/checklists/instances/:id` | Modulrecht |
| `PUT` | `/api/checklists/instances/:id` | Modulrecht |
| `GET` | `/api/checklists/instances/assigned` | Modulrecht |
| `GET` | `/api/checklists/instances/my` | Modulrecht |
| `GET` | `/api/checklists/items/:itemId/attachments` | Modulrecht |
| `POST` | `/api/checklists/items/:itemId/attachments` | Modulrecht |
| `POST` | `/api/checklists/items/complete` | Modulrecht |
| `GET` | `/api/checklists/statistics` | Modulrecht |
| `GET` | `/api/checklists/templates` | Modulrecht |
| `POST` | `/api/checklists/templates` | Modulrecht |
| `DELETE` | `/api/checklists/templates/:id` | Modulrecht |
| `GET` | `/api/checklists/templates/:id` | Modulrecht |
| `PUT` | `/api/checklists/templates/:id` | Modulrecht |
| `POST` | `/api/checklists/templates/:templateId/reorder` | Modulrecht |
| `POST` | `/api/checklists/templates/items` | Modulrecht |
| `DELETE` | `/api/checklists/templates/items/:id` | Modulrecht |
| `PUT` | `/api/checklists/templates/items/:id` | Modulrecht |

### Geräte

Scope `devices:read` bzw. `devices:write` · 23 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/devices` | MCP, ADMIN |
| `POST` | `/api/devices` | ADMIN |
| `DELETE` | `/api/devices/:id` | ADMIN |
| `GET` | `/api/devices/:id` | MCP, ADMIN |
| `PUT` | `/api/devices/:id` | ADMIN |
| `POST` | `/api/devices/:id/action1/sync` | ADMIN |
| `POST` | `/api/devices/:id/assign` | ADMIN |
| `POST` | `/api/devices/:id/return` | ADMIN |
| `GET` | `/api/devices/:id/software` | MCP, ADMIN |
| `POST` | `/api/devices/:id/software` | ADMIN |
| `DELETE` | `/api/devices/:id/software/:softwareId` | ADMIN |
| `PUT` | `/api/devices/:id/software/:softwareId` | ADMIN |
| `GET` | `/api/devices/:id/updates` | ADMIN |
| `POST` | `/api/devices/:id/updates/deploy` | ADMIN |
| `GET` | `/api/devices/:id/vulnerabilities` | MCP, ADMIN |
| `POST` | `/api/devices/action1/sync` | ADMIN |
| `GET` | `/api/devices/action1/sync/status` | ADMIN |
| `GET` | `/api/devices/action1/test` | ADMIN |
| `GET` | `/api/devices/export/json` | ADMIN |
| `POST` | `/api/devices/import/json` | ADMIN |
| `GET` | `/api/devices/software/report` | MCP, ADMIN |
| `GET` | `/api/devices/software/report/installations` | ADMIN |
| `GET` | `/api/devices/user/:userId` | MCP |

### Intranet-Dokumente

Scope `intranet:read` bzw. `intranet:write` · 44 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/document-nodes/:nodeId/attachments` | — |
| `POST` | `/api/document-nodes/:nodeId/attachments` | — |
| `DELETE` | `/api/document-nodes/attachments/:attachmentId` | — |
| `PATCH` | `/api/document-nodes/attachments/:attachmentId` | — |
| `PUT` | `/api/document-nodes/attachments/:attachmentId` | — |
| `GET` | `/api/document-nodes/attachments/:attachmentId/download` | — |
| `GET` | `/api/document-nodes/attachments/:attachmentId/pdf` | — |
| `GET` | `/api/document-nodes/attachments/:attachmentId/thumbnail` | — |
| `GET` | `/api/document-nodes/attachments/:attachmentId/versions` | — |
| `GET` | `/api/document-nodes/attachments/:attachmentId/versions/:versionId/download` | — |
| `GET` | `/api/document-nodes/search` | — |
| `GET` | `/api/document-nodes/search/suggestions` | — |
| `POST` | `/api/intranet` | MCP |
| `DELETE` | `/api/intranet/:id` | — |
| `GET` | `/api/intranet/:id` | MCP |
| `PUT` | `/api/intranet/:id` | — |
| `POST` | `/api/intranet/:id/approve` | MCP |
| `GET` | `/api/intranet/:id/breadcrumb` | — |
| `GET` | `/api/intranet/:id/content` | — |
| `GET` | `/api/intranet/:id/export-pdf` | — |
| `POST` | `/api/intranet/:id/move` | — |
| `GET` | `/api/intranet/:id/permissions` | — |
| `PUT` | `/api/intranet/:id/permissions` | — |
| `POST` | `/api/intranet/:id/publish` | MCP |
| `POST` | `/api/intranet/:id/reject` | MCP |
| `POST` | `/api/intranet/:id/restore/:versionId` | — |
| `POST` | `/api/intranet/:id/return-to-draft` | MCP |
| `POST` | `/api/intranet/:id/submit` | MCP |
| `GET` | `/api/intranet/:id/versions` | — |
| `GET` | `/api/intranet/:id/versions/:versionId` | — |
| `GET` | `/api/intranet/:nodeId/attachments` | — |
| `POST` | `/api/intranet/:nodeId/attachments` | MCP |
| `DELETE` | `/api/intranet/attachments/:attachmentId` | — |
| `PUT` | `/api/intranet/attachments/:attachmentId` | — |
| `GET` | `/api/intranet/attachments/:attachmentId/download` | MCP |
| `PATCH` | `/api/intranet/attachments/:attachmentId/metadata` | — |
| `GET` | `/api/intranet/attachments/:attachmentId/versions` | — |
| `GET` | `/api/intranet/attachments/versions/:versionId/download` | — |
| `POST` | `/api/intranet/drop-file` | — |
| `POST` | `/api/intranet/import/zip` | — |
| `GET` | `/api/intranet/pending-approvals` | MCP |
| `GET` | `/api/intranet/search` | MCP |
| `GET` | `/api/intranet/search/suggestions` | — |
| `GET` | `/api/intranet/tree` | MCP |

### Kontakte

Scope `contacts:read` bzw. `contacts:write` · 10 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/contacts` | — |
| `POST` | `/api/contacts` | Modulrecht |
| `DELETE` | `/api/contacts/:id` | Modulrecht |
| `GET` | `/api/contacts/:id` | — |
| `PUT` | `/api/contacts/:id` | Modulrecht |
| `GET` | `/api/contacts/groups` | — |
| `POST` | `/api/contacts/groups` | ADMIN |
| `DELETE` | `/api/contacts/groups/:id` | ADMIN |
| `PUT` | `/api/contacts/groups/:id` | ADMIN |
| `POST` | `/api/contacts/sync-employees` | ADMIN |

### Kostenstellen

Scope `cost_centers:read` bzw. `cost_centers:write` · 6 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/cost-centers` | — |
| `POST` | `/api/cost-centers` | ADMIN |
| `DELETE` | `/api/cost-centers/:id` | ADMIN |
| `GET` | `/api/cost-centers/:id` | — |
| `PUT` | `/api/cost-centers/:id` | ADMIN |
| `GET` | `/api/cost-centers/:id/stats` | — |

### Kunden

Scope `customers:read` bzw. `customers:write` · 5 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/customers` | — |
| `POST` | `/api/customers` | ADMIN |
| `DELETE` | `/api/customers/:id` | ADMIN |
| `GET` | `/api/customers/:id` | — |
| `PUT` | `/api/customers/:id` | ADMIN |

### Lager

Scope `inventory:read` bzw. `inventory:write` · 6 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/inventory` | — |
| `POST` | `/api/inventory` | — |
| `DELETE` | `/api/inventory/:id` | — |
| `GET` | `/api/inventory/:id` | — |
| `GET` | `/api/inventory/low-stock` | — |
| `POST` | `/api/inventory/movement` | — |

### Lieferanten

Scope `suppliers:read` bzw. `suppliers:write` · 7 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/suppliers` | — |
| `POST` | `/api/suppliers` | ADMIN |
| `DELETE` | `/api/suppliers/:id` | ADMIN |
| `GET` | `/api/suppliers/:id` | — |
| `PUT` | `/api/suppliers/:id` | ADMIN |
| `GET` | `/api/suppliers/export/json` | ADMIN |
| `POST` | `/api/suppliers/import/json` | ADMIN |

### Mahnwesen

Scope `reminders:read` bzw. `reminders:write` · 13 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/reminders` | — |
| `POST` | `/api/reminders` | — |
| `DELETE` | `/api/reminders/:id` | — |
| `GET` | `/api/reminders/:id` | — |
| `PUT` | `/api/reminders/:id` | — |
| `POST` | `/api/reminders/:id/mark-paid` | — |
| `GET` | `/api/reminders/:id/pdf` | — |
| `POST` | `/api/reminders/:id/send` | — |
| `GET` | `/api/reminders/invoice/:invoiceId` | — |
| `GET` | `/api/reminders/overdue-invoices` | — |
| `PUT` | `/api/reminders/settings/:id` | — |
| `GET` | `/api/reminders/settings/current` | — |
| `GET` | `/api/reminders/stats` | — |

### News

Scope `news:read` bzw. `news:write` · 15 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `POST` | `/api/news/:id/read` | — |
| `GET` | `/api/news/dashboard` | — |
| `POST` | `/api/news/items` | ADMIN |
| `DELETE` | `/api/news/items/:id` | ADMIN |
| `GET` | `/api/news/items/:id` | ADMIN |
| `PUT` | `/api/news/items/:id` | ADMIN |
| `PATCH` | `/api/news/items/:id/toggle-pin` | ADMIN |
| `POST` | `/api/news/refresh-feeds` | ADMIN |
| `GET` | `/api/news/sources` | ADMIN |
| `POST` | `/api/news/sources` | ADMIN |
| `DELETE` | `/api/news/sources/:id` | ADMIN |
| `GET` | `/api/news/sources/:id` | ADMIN |
| `PUT` | `/api/news/sources/:id` | ADMIN |
| `PATCH` | `/api/news/sources/:id/toggle-visibility` | ADMIN |
| `GET` | `/api/news/sources/:sourceId/items` | ADMIN |

### Projektberichte

Scope `project_reports:read` bzw. `project_reports:write` · 2 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/project-reports/overview` | Modulrecht |
| `GET` | `/api/project-reports/time-tracking` | Modulrecht |

### Projektbudgets

Scope `project_budget:read` bzw. `project_budget:write` · 12 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/project-budgets` | — |
| `POST` | `/api/project-budgets` | — |
| `DELETE` | `/api/project-budgets/:id` | — |
| `GET` | `/api/project-budgets/:id` | — |
| `PUT` | `/api/project-budgets/:id` | — |
| `POST` | `/api/project-budgets/:id/items` | — |
| `POST` | `/api/project-budgets/:id/recalculate` | — |
| `POST` | `/api/project-budgets/:id/sync-time-entries` | — |
| `GET` | `/api/project-budgets/:id/time-entries` | — |
| `DELETE` | `/api/project-budgets/items/:itemId` | — |
| `PUT` | `/api/project-budgets/items/:itemId` | — |
| `GET` | `/api/project-budgets/project/:projectId` | — |

### Projekte & Aufgaben

Scope `projects:read` bzw. `projects:write` · 18 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `POST` | `/api/project-tasks` | Modulrecht |
| `DELETE` | `/api/project-tasks/:id` | Modulrecht |
| `GET` | `/api/project-tasks/:id` | Modulrecht |
| `PUT` | `/api/project-tasks/:id` | Modulrecht |
| `GET` | `/api/project-tasks/:id/dependencies` | Modulrecht |
| `GET` | `/api/project-tasks/:id/dependents` | Modulrecht |
| `GET` | `/api/project-tasks/project/:projectId` | Modulrecht |
| `DELETE` | `/api/project-time-allocations/:allocationId` | — |
| `GET` | `/api/project-time-allocations/stats` | — |
| `GET` | `/api/project-time-allocations/time-entry/:timeEntryId` | — |
| `POST` | `/api/project-time-allocations/time-entry/:timeEntryId` | — |
| `GET` | `/api/projects` | — |
| `POST` | `/api/projects` | ADMIN |
| `DELETE` | `/api/projects/:id` | ADMIN |
| `PUT` | `/api/projects/:id` | ADMIN |
| `POST` | `/api/projects/:id/assign` | ADMIN |
| `DELETE` | `/api/projects/:id/unassign/:userId` | ADMIN |
| `GET` | `/api/projects/my-projects` | — |

### Rechnungen & Vorlagen

Scope `invoices:read` bzw. `invoices:write` · 14 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/invoice-templates` | — |
| `POST` | `/api/invoice-templates` | — |
| `DELETE` | `/api/invoice-templates/:id` | — |
| `GET` | `/api/invoice-templates/:id` | — |
| `PUT` | `/api/invoice-templates/:id` | — |
| `PUT` | `/api/invoice-templates/:id/set-default` | — |
| `GET` | `/api/invoice-templates/default` | — |
| `GET` | `/api/invoices` | — |
| `POST` | `/api/invoices` | — |
| `DELETE` | `/api/invoices/:id` | — |
| `GET` | `/api/invoices/:id` | — |
| `PUT` | `/api/invoices/:id` | — |
| `GET` | `/api/invoices/:id/pdf` | — |
| `GET` | `/api/invoices/next-number` | — |

### Reisekosten

Scope `travel_expenses:read` bzw. `travel_expenses:write` · 7 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/travel-expenses` | — |
| `POST` | `/api/travel-expenses` | — |
| `DELETE` | `/api/travel-expenses/:id` | — |
| `GET` | `/api/travel-expenses/:id` | — |
| `PUT` | `/api/travel-expenses/:id` | — |
| `POST` | `/api/travel-expenses/:id/approve` | ADMIN |
| `POST` | `/api/travel-expenses/:id/reject` | ADMIN |

### Rundgangsberichte

Scope `berichte:read` bzw. `berichte:write` · 11 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/berichte` | MCP, Modulrecht |
| `POST` | `/api/berichte` | Modulrecht |
| `DELETE` | `/api/berichte/:id` | Modulrecht |
| `GET` | `/api/berichte/:id` | MCP, Modulrecht |
| `PUT` | `/api/berichte/:id` | Modulrecht |
| `GET` | `/api/berichte/:id/export.html` | Modulrecht |
| `GET` | `/api/berichte/:id/export.pdf` | MCP, Modulrecht |
| `POST` | `/api/berichte/:id/photos` | Modulrecht |
| `DELETE` | `/api/berichte/:id/photos/:photoId` | Modulrecht |
| `GET` | `/api/berichte/:id/photos/:photoId` | Modulrecht |
| `GET` | `/api/berichte/projects` | MCP, Modulrecht |

### Standorte

Scope `locations:read` bzw. `locations:write` · 6 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/locations` | ADMIN |
| `POST` | `/api/locations` | ADMIN |
| `DELETE` | `/api/locations/:id` | ADMIN |
| `GET` | `/api/locations/:id` | ADMIN |
| `PUT` | `/api/locations/:id` | ADMIN |
| `GET` | `/api/locations/active` | — |

### Vorfälle

Scope `incidents:read` bzw. `incidents:write` · 16 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/incidents` | MCP |
| `POST` | `/api/incidents` | MCP |
| `DELETE` | `/api/incidents/:id` | — |
| `GET` | `/api/incidents/:id` | MCP |
| `PUT` | `/api/incidents/:id` | — |
| `GET` | `/api/incidents/:id/comments` | — |
| `POST` | `/api/incidents/:id/comments` | — |
| `GET` | `/api/incidents/:id/pdf` | MCP |
| `GET` | `/api/incidents/:incidentId/attachments` | — |
| `POST` | `/api/incidents/:incidentId/attachments` | — |
| `DELETE` | `/api/incidents/attachments/:attachmentId` | — |
| `GET` | `/api/incidents/attachments/:attachmentId/download` | — |
| `GET` | `/api/incidents/export/csv` | — |
| `GET` | `/api/incidents/export/pdf` | — |
| `PUT` | `/api/incidents/reorder` | — |
| `GET` | `/api/incidents/statistics` | MCP |

### Zeiterfassung

Scope `time_tracking:read` bzw. `time_tracking:write` · 16 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `DELETE` | `/api/time/:id` | ADMIN |
| `PUT` | `/api/time/:id` | ADMIN |
| `PUT` | `/api/time/:id/allocations` | ADMIN |
| `POST` | `/api/time/clock-in` | — |
| `POST` | `/api/time/clock-out` | — |
| `GET` | `/api/time/current` | — |
| `POST` | `/api/time/end-pause` | — |
| `GET` | `/api/time/logged-in-users` | — |
| `POST` | `/api/time/manual-entry` | ADMIN |
| `GET` | `/api/time/my-entries` | — |
| `DELETE` | `/api/time/my-entries/:id` | — |
| `PUT` | `/api/time/my-entries/:id` | — |
| `POST` | `/api/time/my-manual-entry` | — |
| `POST` | `/api/time/start-pause` | — |
| `GET` | `/api/time/user/:userId` | ADMIN |
| `GET` | `/api/time/user/:userId/soll-ist` | ADMIN |

### Zeitmodelle

Scope `zeitmodelle:read` bzw. `zeitmodelle:write` · 11 Endpunkte

| Methode | Pfad | |
|---|---|---|
| `GET` | `/api/zeitmodelle` | — |
| `POST` | `/api/zeitmodelle` | ADMIN |
| `DELETE` | `/api/zeitmodelle/:id` | ADMIN |
| `GET` | `/api/zeitmodelle/:id` | — |
| `PUT` | `/api/zeitmodelle/:id` | ADMIN |
| `GET` | `/api/zeitmodelle/abrechnung/:mitarbeiterId` | — |
| `POST` | `/api/zeitmodelle/assign` | ADMIN |
| `DELETE` | `/api/zeitmodelle/assign/:id` | ADMIN |
| `GET` | `/api/zeitmodelle/mitarbeiter/:mitarbeiterId` | — |
| `GET` | `/api/zeitmodelle/stats/overview` | ADMIN |
| `GET` | `/api/zeitmodelle/stundensatz/:mitarbeiterId` | — |

---

## Nicht freigegeben

341 Endpunkte in 25 Bereichen.
Mit **gesperrt halten** sind die Bereiche gekennzeichnet, die auch künftig
nicht in die Freigabeliste gehören. Der Rest ist schlicht noch nicht
freigegeben; dafür genügt jeweils ein Eintrag in `apiScope.ts`.

### API-Schlüssel — **gesperrt halten**

`/api/api-keys` · 8 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/api-keys` |
| `POST` | `/api/api-keys` |
| `DELETE` | `/api/api-keys/:id` |
| `PUT` | `/api/api-keys/:id` |
| `POST` | `/api/api-keys/:id/revoke` |
| `GET` | `/api/api-keys/client` |
| `GET` | `/api/api-keys/client/download` |
| `GET` | `/api/api-keys/scopes` |

### Anmeldung — **gesperrt halten**

`/api/auth` · 5 Endpunkte

| Methode | Pfad |
|---|---|
| `POST` | `/api/auth/login` |
| `POST` | `/api/auth/register` |
| `POST` | `/api/auth/request-password-reset` |
| `POST` | `/api/auth/reset-password` |
| `POST` | `/api/auth/verify-reset-token` |

### Benutzer — **gesperrt halten**

`/api/users` · 14 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/users` |
| `DELETE` | `/api/users/:id` |
| `GET` | `/api/users/:id` |
| `PUT` | `/api/users/:id` |
| `DELETE` | `/api/users/:id/avatar` |
| `POST` | `/api/users/:id/avatar` |
| `POST` | `/api/users/:id/one-time-password` |
| `GET` | `/api/users/:id/subordinates` |
| `POST` | `/api/users/change-password` |
| `GET` | `/api/users/export` |
| `POST` | `/api/users/import` |
| `GET` | `/api/users/list` |
| `GET` | `/api/users/me` |
| `GET` | `/api/users/org-chart` |

### Benutzergruppen — **gesperrt halten**

`/api/user-groups` · 10 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/user-groups` |
| `POST` | `/api/user-groups` |
| `DELETE` | `/api/user-groups/:id` |
| `GET` | `/api/user-groups/:id` |
| `PUT` | `/api/user-groups/:id` |
| `GET` | `/api/user-groups/:id/users` |
| `POST` | `/api/user-groups/:id/users` |
| `DELETE` | `/api/user-groups/:id/users/:userId` |
| `GET` | `/api/user-groups/users/:userId/groups` |
| `PUT` | `/api/user-groups/users/:userId/groups` |

### Bewerber

`/api/applicants` · 17 Endpunkte

| Methode | Pfad |
|---|---|
| `DELETE` | `/api/applicants/:applicantId/documents/:documentId` |
| `GET` | `/api/applicants/:id` |
| `GET` | `/api/applicants/:id/documents` |
| `POST` | `/api/applicants/:id/documents` |
| `GET` | `/api/applicants/:id/interviews` |
| `GET` | `/api/applicants/:id/notes` |
| `POST` | `/api/applicants/:id/notes` |
| `PATCH` | `/api/applicants/:id/status` |
| `POST` | `/api/applicants/:id/verify-manual` |
| `GET` | `/api/applicants/admin/applicants` |
| `GET` | `/api/applicants/admin/documents/:documentId/download` |
| `POST` | `/api/applicants/interviews` |
| `PATCH` | `/api/applicants/interviews/:interviewId` |
| `POST` | `/api/applicants/login` |
| `DELETE` | `/api/applicants/notes/:noteId` |
| `POST` | `/api/applicants/register` |
| `GET` | `/api/applicants/verify/:token` |

### Compliance

`/api/compliance` · 11 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/compliance/cantons` |
| `GET` | `/api/compliance/holidays` |
| `POST` | `/api/compliance/holidays` |
| `DELETE` | `/api/compliance/holidays/:id` |
| `POST` | `/api/compliance/holidays/sync` |
| `GET` | `/api/compliance/overtime` |
| `GET` | `/api/compliance/settings` |
| `PUT` | `/api/compliance/settings` |
| `GET` | `/api/compliance/violations` |
| `PATCH` | `/api/compliance/violations/:id/resolve` |
| `GET` | `/api/compliance/violations/stats` |

### Dashboard-Layout

`/api/dashboard-layout` · 3 Endpunkte

| Methode | Pfad |
|---|---|
| `DELETE` | `/api/dashboard-layout/my-layout` |
| `GET` | `/api/dashboard-layout/my-layout` |
| `PUT` | `/api/dashboard-layout/my-layout` |

### Datensicherung — **gesperrt halten**

`/api/backup` · 7 Endpunkte

| Methode | Pfad |
|---|---|
| `DELETE` | `/api/backup/:filename` |
| `POST` | `/api/backup/create` |
| `GET` | `/api/backup/download/:filename` |
| `GET` | `/api/backup/export` |
| `GET` | `/api/backup/list` |
| `POST` | `/api/backup/restore/:filename` |
| `POST` | `/api/backup/upload` |

### E-Learning

`/api/elearning` · 66 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/elearning/analytics/admin` |
| `GET` | `/api/elearning/analytics/compliance` |
| `GET` | `/api/elearning/analytics/my` |
| `GET` | `/api/elearning/analytics/user/:userId` |
| `POST` | `/api/elearning/answers` |
| `POST` | `/api/elearning/answers` |
| `DELETE` | `/api/elearning/answers/:id` |
| `DELETE` | `/api/elearning/answers/:id` |
| `PUT` | `/api/elearning/answers/:id` |
| `PUT` | `/api/elearning/answers/:id` |
| `GET` | `/api/elearning/assignments` |
| `POST` | `/api/elearning/assignments` |
| `DELETE` | `/api/elearning/assignments/:id` |
| `PUT` | `/api/elearning/assignments/:id` |
| `GET` | `/api/elearning/assignments/my` |
| `GET` | `/api/elearning/categories` |
| `POST` | `/api/elearning/categories` |
| `PUT` | `/api/elearning/categories/:id` |
| `GET` | `/api/elearning/certificates` |
| `GET` | `/api/elearning/certificates/:enrollmentId` |
| `GET` | `/api/elearning/certificates/:enrollmentId/download` |
| `POST` | `/api/elearning/certificates/:enrollmentId/generate` |
| `GET` | `/api/elearning/courses` |
| `POST` | `/api/elearning/courses` |
| `GET` | `/api/elearning/courses/:courseId/assignments` |
| `DELETE` | `/api/elearning/courses/:id` |
| `GET` | `/api/elearning/courses/:id` |
| `PUT` | `/api/elearning/courses/:id` |
| `GET` | `/api/elearning/courses/:id/analytics` |
| `GET` | `/api/elearning/courses/:id/export` |
| `POST` | `/api/elearning/courses/import` |
| `POST` | `/api/elearning/enrollments` |
| `GET` | `/api/elearning/enrollments/:id` |
| `PUT` | `/api/elearning/enrollments/:id` |
| `GET` | `/api/elearning/enrollments/my` |
| `GET` | `/api/elearning/enrollments/user/:userId` |
| `POST` | `/api/elearning/lesson-progress` |
| `GET` | `/api/elearning/lesson-progress/:enrollmentId/:lessonId` |
| `POST` | `/api/elearning/lessons` |
| `DELETE` | `/api/elearning/lessons/:id` |
| `PUT` | `/api/elearning/lessons/:id` |
| `POST` | `/api/elearning/lessons/:id/complete` |
| `POST` | `/api/elearning/lessons/:id/complete` |
| `POST` | `/api/elearning/lessons/:id/progress` |
| `POST` | `/api/elearning/lessons/:id/progress` |
| `GET` | `/api/elearning/lessons/:lessonId/quiz` |
| `POST` | `/api/elearning/questions` |
| `POST` | `/api/elearning/questions` |
| `DELETE` | `/api/elearning/questions/:id` |
| `DELETE` | `/api/elearning/questions/:id` |
| `PUT` | `/api/elearning/questions/:id` |
| `PUT` | `/api/elearning/questions/:id` |
| `GET` | `/api/elearning/quiz-attempts` |
| `POST` | `/api/elearning/quiz-attempts` |
| `GET` | `/api/elearning/quiz-attempts/:id` |
| `POST` | `/api/elearning/quiz-attempts/:id/submit` |
| `POST` | `/api/elearning/quizzes` |
| `POST` | `/api/elearning/quizzes` |
| `DELETE` | `/api/elearning/quizzes/:id` |
| `GET` | `/api/elearning/quizzes/:id` |
| `PUT` | `/api/elearning/quizzes/:id` |
| `PUT` | `/api/elearning/quizzes/:id` |
| `DELETE` | `/api/elearning/upload/:type/:filename` |
| `POST` | `/api/elearning/upload/content-image` |
| `POST` | `/api/elearning/upload/pdf` |
| `POST` | `/api/elearning/upload/thumbnail` |

### EHS

`/api/ehs` · 5 Endpunkte

| Methode | Pfad |
|---|---|
| `POST` | `/api/ehs/calculate-kpis` |
| `GET` | `/api/ehs/dashboard` |
| `POST` | `/api/ehs/monthly-data` |
| `GET` | `/api/ehs/pdf-report` |
| `GET` | `/api/ehs/statistics` |

### EHS-Aufgaben

`/api/ehs-todos` · 12 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/ehs-todos` |
| `POST` | `/api/ehs-todos` |
| `DELETE` | `/api/ehs-todos/:id` |
| `GET` | `/api/ehs-todos/:id` |
| `PUT` | `/api/ehs-todos/:id` |
| `PATCH` | `/api/ehs-todos/:id/progress` |
| `PATCH` | `/api/ehs-todos/:id/status` |
| `GET` | `/api/ehs-todos/incident/:incidentId` |
| `GET` | `/api/ehs-todos/my/assigned` |
| `GET` | `/api/ehs-todos/my/created` |
| `GET` | `/api/ehs-todos/project/:projectId` |
| `GET` | `/api/ehs-todos/stats/overview` |

### Funktionen

`/api/job-functions` · 15 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/job-functions` |
| `POST` | `/api/job-functions` |
| `DELETE` | `/api/job-functions/:id` |
| `GET` | `/api/job-functions/:id` |
| `PUT` | `/api/job-functions/:id` |
| `GET` | `/api/job-functions/:id/documents` |
| `POST` | `/api/job-functions/:id/documents` |
| `DELETE` | `/api/job-functions/:id/documents/:documentId` |
| `POST` | `/api/job-functions/assign` |
| `GET` | `/api/job-functions/categories` |
| `GET` | `/api/job-functions/category/:category` |
| `GET` | `/api/job-functions/department/:department` |
| `GET` | `/api/job-functions/departments` |
| `GET` | `/api/job-functions/matrix` |
| `DELETE` | `/api/job-functions/user/:userId` |

### Geräteunterweisung

`/api/equipment-training` · 19 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/equipment-training/equipment` |
| `POST` | `/api/equipment-training/equipment` |
| `GET` | `/api/equipment-training/equipment/:id` |
| `PUT` | `/api/equipment-training/equipment/:id` |
| `POST` | `/api/equipment-training/equipment/assign` |
| `POST` | `/api/equipment-training/equipment/assignments/:assignmentId/protocol` |
| `PATCH` | `/api/equipment-training/equipment/assignments/:assignmentId/return` |
| `GET` | `/api/equipment-training/equipment/employee/:employeeId` |
| `POST` | `/api/equipment-training/training/assign` |
| `GET` | `/api/equipment-training/training/catalog` |
| `POST` | `/api/equipment-training/training/catalog` |
| `GET` | `/api/equipment-training/training/catalog/:id` |
| `PUT` | `/api/equipment-training/training/catalog/:id` |
| `PATCH` | `/api/equipment-training/training/completions/:completionId` |
| `GET` | `/api/equipment-training/training/employee/:employeeId` |
| `GET` | `/api/equipment-training/training/sessions` |
| `POST` | `/api/equipment-training/training/sessions` |
| `GET` | `/api/equipment-training/training/sessions/:id` |
| `PUT` | `/api/equipment-training/training/sessions/:id` |

### Kalender

`/api/calendar` · 6 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/calendar` |
| `POST` | `/api/calendar` |
| `DELETE` | `/api/calendar/:id` |
| `GET` | `/api/calendar/:id` |
| `PUT` | `/api/calendar/:id` |
| `POST` | `/api/calendar/:id/respond` |

### Lohnbuchhaltung — **gesperrt halten**

`/api/payroll` · 12 Endpunkte

| Methode | Pfad |
|---|---|
| `POST` | `/api/payroll/entries` |
| `GET` | `/api/payroll/my-entries` |
| `GET` | `/api/payroll/periods` |
| `POST` | `/api/payroll/periods` |
| `DELETE` | `/api/payroll/periods/:id` |
| `GET` | `/api/payroll/periods/:id` |
| `PUT` | `/api/payroll/periods/:id` |
| `POST` | `/api/payroll/periods/:id/calculate` |
| `POST` | `/api/payroll/periods/:id/recalculate` |
| `POST` | `/api/payroll/salary-config` |
| `GET` | `/api/payroll/salary-config/:userId` |
| `GET` | `/api/payroll/user/:userId/entries` |

### Massnahmen

`/api/actions` · 15 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/actions` |
| `POST` | `/api/actions` |
| `DELETE` | `/api/actions/:actionKey` |
| `GET` | `/api/actions/:actionKey` |
| `PUT` | `/api/actions/:actionKey` |
| `POST` | `/api/actions/:actionKey/trigger` |
| `GET` | `/api/actions/:actionKey/triggers` |
| `GET` | `/api/actions/logs` |
| `POST` | `/api/actions/seed` |
| `GET` | `/api/actions/statistics` |
| `POST` | `/api/actions/triggers` |
| `DELETE` | `/api/actions/triggers/:id` |
| `PUT` | `/api/actions/triggers/:id` |
| `PATCH` | `/api/actions/triggers/:id/toggle` |
| `GET` | `/api/actions/workflows/:workflowId/triggers` |

### Medien

`/api/media` · 8 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/media` |
| `POST` | `/api/media` |
| `DELETE` | `/api/media/:id` |
| `GET` | `/api/media/:id` |
| `PUT` | `/api/media/:id` |
| `GET` | `/api/media/:id/download` |
| `GET` | `/api/media/statistics` |
| `GET` | `/api/media/tags/:tag` |

### Module — **gesperrt halten**

`/api/modules` · 12 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/modules` |
| `POST` | `/api/modules` |
| `DELETE` | `/api/modules/:id` |
| `GET` | `/api/modules/:id` |
| `PUT` | `/api/modules/:id` |
| `POST` | `/api/modules/:moduleId/access` |
| `GET` | `/api/modules/:moduleId/groups` |
| `DELETE` | `/api/modules/access/:accessId` |
| `PUT` | `/api/modules/access/:accessId` |
| `GET` | `/api/modules/group/:groupId/access` |
| `GET` | `/api/modules/user/:userId` |
| `GET` | `/api/modules/user/me` |

### Nachrichten

`/api/messages` · 8 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/messages` |
| `POST` | `/api/messages` |
| `DELETE` | `/api/messages/:id` |
| `GET` | `/api/messages/:id` |
| `PATCH` | `/api/messages/:id/move` |
| `PATCH` | `/api/messages/:id/read` |
| `GET` | `/api/messages/recipients` |
| `GET` | `/api/messages/unread-count` |

### Onboarding

`/api/onboarding` · 47 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/onboarding/applicants` |
| `DELETE` | `/api/onboarding/applicants/:applicantId/documents/:documentId` |
| `DELETE` | `/api/onboarding/applicants/:id` |
| `GET` | `/api/onboarding/applicants/:id` |
| `GET` | `/api/onboarding/applicants/:id/documents` |
| `POST` | `/api/onboarding/applicants/:id/documents` |
| `GET` | `/api/onboarding/applicants/:id/interviews` |
| `GET` | `/api/onboarding/applicants/:id/notes` |
| `POST` | `/api/onboarding/applicants/:id/notes` |
| `POST` | `/api/onboarding/applicants/:id/reset` |
| `PATCH` | `/api/onboarding/applicants/:id/status` |
| `POST` | `/api/onboarding/applicants/:id/verify-manual` |
| `GET` | `/api/onboarding/applicants/documents/:documentId/download` |
| `POST` | `/api/onboarding/applicants/login` |
| `POST` | `/api/onboarding/applicants/register` |
| `GET` | `/api/onboarding/applicants/verify/:token` |
| `GET` | `/api/onboarding/dashboard` |
| `PATCH` | `/api/onboarding/documents/:documentId/status` |
| `GET` | `/api/onboarding/employees` |
| `GET` | `/api/onboarding/employees/:id` |
| `PUT` | `/api/onboarding/employees/:id` |
| `PATCH` | `/api/onboarding/employees/:id/complete-onboarding` |
| `GET` | `/api/onboarding/employees/:id/documents` |
| `POST` | `/api/onboarding/employees/:id/documents` |
| `GET` | `/api/onboarding/employees/:id/probation-reviews` |
| `POST` | `/api/onboarding/employees/:id/probation-reviews/generate` |
| `GET` | `/api/onboarding/employees/:id/progress` |
| `GET` | `/api/onboarding/employees/:id/tasks` |
| `POST` | `/api/onboarding/hire` |
| `POST` | `/api/onboarding/interviews` |
| `PATCH` | `/api/onboarding/interviews/:interviewId` |
| `GET` | `/api/onboarding/jobs` |
| `POST` | `/api/onboarding/jobs` |
| `DELETE` | `/api/onboarding/jobs/:jobId` |
| `GET` | `/api/onboarding/jobs/:jobId` |
| `PUT` | `/api/onboarding/jobs/:jobId` |
| `GET` | `/api/onboarding/jobs/public` |
| `GET` | `/api/onboarding/jobs/public/:jobId` |
| `DELETE` | `/api/onboarding/notes/:noteId` |
| `POST` | `/api/onboarding/probation-reviews` |
| `DELETE` | `/api/onboarding/probation-reviews/:reviewId` |
| `PATCH` | `/api/onboarding/probation-reviews/:reviewId` |
| `POST` | `/api/onboarding/start` |
| `POST` | `/api/onboarding/tasks` |
| `PATCH` | `/api/onboarding/tasks/:taskId/assign` |
| `PATCH` | `/api/onboarding/tasks/:taskId/status` |
| `GET` | `/api/onboarding/tasks/overdue` |

### Stories

`/api/stories` · 5 Endpunkte

| Methode | Pfad |
|---|---|
| `POST` | `/api/stories` |
| `DELETE` | `/api/stories/:id` |
| `GET` | `/api/stories/:id` |
| `PUT` | `/api/stories/:id` |
| `GET` | `/api/stories/project/:projectId` |

### Systemeinstellungen — **gesperrt halten**

`/api/system-settings` · 5 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/system-settings` |
| `PUT` | `/api/system-settings` |
| `GET` | `/api/system-settings/public` |
| `POST` | `/api/system-settings/test-email` |
| `POST` | `/api/system-settings/upload-logo` |

### Uploads

`/api/uploads` · 3 Endpunkte

| Methode | Pfad |
|---|---|
| `POST` | `/api/uploads` |
| `DELETE` | `/api/uploads/:filename` |
| `POST` | `/api/uploads/logo` |

### Werkzeuge

`/api/werkzeuge` · 8 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/werkzeuge` |
| `POST` | `/api/werkzeuge` |
| `DELETE` | `/api/werkzeuge/:id` |
| `GET` | `/api/werkzeuge/:id` |
| `PUT` | `/api/werkzeuge/:id` |
| `POST` | `/api/werkzeuge/:id/assign` |
| `POST` | `/api/werkzeuge/:id/return` |
| `GET` | `/api/werkzeuge/user/:userId` |

### Workflows

`/api/workflows` · 20 Endpunkte

| Methode | Pfad |
|---|---|
| `GET` | `/api/workflows` |
| `POST` | `/api/workflows` |
| `DELETE` | `/api/workflows/:id` |
| `GET` | `/api/workflows/:id` |
| `PUT` | `/api/workflows/:id` |
| `POST` | `/api/workflows/:id/test` |
| `POST` | `/api/workflows/:workflowId/steps` |
| `GET` | `/api/workflows/entities/:entityType/:entityId/instances` |
| `POST` | `/api/workflows/instances/steps/:instanceStepId/acknowledge` |
| `POST` | `/api/workflows/instances/steps/:instanceStepId/approve` |
| `POST` | `/api/workflows/instances/steps/:instanceStepId/reject` |
| `GET` | `/api/workflows/invoices/:invoiceId/check-approval` |
| `GET` | `/api/workflows/invoices/:invoiceId/instances` |
| `GET` | `/api/workflows/my-approvals` |
| `GET` | `/api/workflows/my-message-dialogs` |
| `DELETE` | `/api/workflows/steps/:id` |
| `PUT` | `/api/workflows/steps/:id` |
| `POST` | `/api/workflows/template-links` |
| `DELETE` | `/api/workflows/template-links/:templateId/:workflowId` |
| `GET` | `/api/workflows/templates/:templateId` |

