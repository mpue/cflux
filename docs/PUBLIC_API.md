# Public API (API-Schlüssel)

Zugang für externe Integrationen, ohne dafür einen Benutzer mit Passwort
weiterzugeben. Ein Schlüssel handelt im Namen genau eines Benutzers, kann nie
mehr als dieser — und zusätzlich schränken seine Scopes ein.

Verwaltet wird das im Admin-Panel unter **System → 🔌 API-Schlüssel**.

## Authentifizierung

Der Schlüssel geht entweder in einen eigenen Header oder als Bearer-Token:

```
X-API-Key: cflux_…
Authorization: Bearer cflux_…
```

Beides ist gleichwertig; `X-API-Key` ist für Integrationen meist bequemer, weil
`Authorization` in manchen Werkzeugen schon anderweitig belegt ist.

Als **Query-Parameter geht ein Schlüssel bewusst nicht**. Der `?token=`-Fallback
existiert nur für JWTs (Datei-Downloads und Vorschauen) und weist alles ab, was
mit `cflux_` beginnt — sonst landete der Schlüssel in Server- und Proxy-Logs.

Das Format ist `cflux_` plus 43 Zeichen base64url. Gespeichert wird ausschließlich
der SHA-256-Hash; der Klartext ist genau einmal sichtbar, direkt nach dem Anlegen.
Geht er verloren, hilft nur ein neuer Schlüssel.

## Die drei Schranken

Jede Anfrage mit einem Schlüssel läuft durch drei voneinander unabhängige
Prüfungen. Alle drei müssen zustimmen.

| # | Prüfung | Wo | Frage |
|---|---|---|---|
| 1 | Freigabeliste | `middleware/apiScope.ts` | Ist dieser Pfad überhaupt Teil der Public API? |
| 2 | Scopes | `middleware/apiScope.ts` | Deckt der Schlüssel dieses Modul in dieser Richtung ab? |
| 3 | Rechte des Benutzers | `moduleAccess`, Controller | Dürfte der Benutzer, in dessen Namen der Schlüssel handelt, das selbst? |

Dazu kommt das Kennzeichen **Nur-Lesen** als Notausschalter: es blockt `POST`,
`PUT`, `PATCH` und `DELETE` unabhängig von allem anderen.

Die Prüfung sitzt in `authenticate`, **bevor** `req.user` gesetzt wird. Sie greift
deshalb unabhängig davon, welche Middleware eine Route sonst noch benutzt — das
war der Kern des Problems, das sie löst (siehe „Warum Deny-by-default“).

## Scopes

Ein Scope ist `<modul>:read` oder `<modul>:write`.

- `write` schließt `read` mit ein — `projects:write` erlaubt auch `GET`.
- Lesend sind `GET`, `HEAD` und `OPTIONS`; alles andere gilt als schreibend.
- `*` deckt **alle freigegebenen Module** ab und ist Admins vorbehalten.
  Er hebelt die Freigabeliste *nicht* aus: `/api/backup/export` bleibt auch für
  einen Wildcard-Schlüssel gesperrt.

Vergebbar sind nur Module, die auch erreichbar sind. `GET /api/api-keys/scopes`
liefert genau diese Liste — die Oberfläche und die Validierung beim Anlegen
benutzen beide diese Quelle, damit niemand einen Scope setzt, der ins Leere greift.

## Freigegebene Endpunkte

| Präfix | Modul-Scope |
|---|---|
| `/api/absences` | `absences` |
| `/api/articles`, `/api/article-groups` | `articles` |
| `/api/berichte` | `berichte` |
| `/api/checklists` | `checklists` |
| `/api/cost-centers` | `cost_centers` |
| `/api/customers` | `customers` |
| `/api/departments` | `departments` |
| `/api/devices` | `devices` |
| `/api/incidents` | `incidents` |
| `/api/intranet`, `/api/document-nodes` | `intranet` |
| `/api/inventory` | `inventory` |
| `/api/invoices`, `/api/invoice-templates` | `invoices` |
| `/api/locations` | `locations` |
| `/api/news` | `news` |
| `/api/orders` | `orders` |
| `/api/project-budgets` | `project_budget` |
| `/api/project-reports` | `project_reports` |
| `/api/projects`, `/api/project-tasks`, `/api/project-time-allocations` | `projects` |
| `/api/reminders` | `reminders` |
| `/api/reports` | `reports` |
| `/api/suppliers` | `suppliers` |
| `/api/time` | `time_tracking` |
| `/api/travel-expenses` | `travel_expenses` |
| `/api/zeitmodelle` | `zeitmodelle` |

Alles andere ist für Schlüssel gesperrt und braucht einen echten Login,
insbesondere: `auth`, `api-keys`, `users`, `user-groups`, `modules`, `backup`,
`system-settings`, `payroll`, `workflows`, `actions`, `uploads`, `media`,
`messages`, `compliance`, `applicants`, `onboarding`, `job-functions`,
`elearning`, `equipment-training`, `stories`, `dashboard-layout`,
`system-stats`.

Pfade treffen nur auf Segmentgrenzen. `/api/project-tasks` wird deshalb nicht
versehentlich als `/api/projects` behandelt.

### Eine Route freigeben

Einen Eintrag in `PUBLIC_API_ROUTES` in `backend/src/middleware/apiScope.ts`
ergänzen — Mount-Präfix aus `index.ts` auf einen Modul-Key aus der Tabelle
`modules`. Mehr ist nicht nötig; Scope-Liste, Validierung und Oberfläche ziehen
automatisch nach. Existiert der Modul-Key nicht, schlägt der Test in
`__tests__/apiScope.test.ts` fehl.

## Warum Deny-by-default

Ursprünglich hing die Scope-Prüfung an `requireModuleAccess`. Diese Middleware
steht aber nur in 10 von 55 Routen-Dateien. Für alle übrigen reichte ein
beliebiger gültiger Schlüssel: `authenticate` setzte `req.user`, und danach sah
niemand mehr die Scopes an. Ein Read-Only-Schlüssel mit `projects:read` kam so
an `GET /api/backup/export` — und damit an die komplette Datenbank.

Eine Freigabeliste dreht die Beweislast um: nicht „was ist gesperrt“, sondern
„was ist offen“. Neue Routen sind damit automatisch dicht, ohne dass jemand beim
Hinzufügen daran denken muss.

Die Scope-Prüfung in `requireModuleAccess` steht weiterhin, als zweite Schicht.
Sie liegt dort bewusst **vor** dem Admin-Bypass — sonst hätte der Schlüssel eines
Admins automatisch Zugriff auf alle Module.

## Antworten bei Ablehnung

| Status | `error` | Bedeutung |
|---|---|---|
| 401 | `Invalid API key` | Unbekannt, widerrufen, abgelaufen, oder der Benutzer ist deaktiviert |
| 403 | `Not available via the public API` | Pfad steht nicht in der Freigabeliste |
| 403 | `Access denied` | Pfad ist freigegeben, aber der Scope fehlt (`message` nennt den nötigen) |
| 403 | `API key is read-only` | Schreibende Methode auf einem Nur-Lesen-Schlüssel |

Ein widerrufener oder abgelaufener Schlüssel ist bewusst nicht von einem
unbekannten zu unterscheiden — die Antwort verrät nicht, ob es den Schlüssel
einmal gab.

## Lebenszyklus

**Widerrufen** sperrt sofort und behält den Datensatz für die Nachvollziehbarkeit.
**Löschen** entfernt auch die Spur. Im Zweifel widerrufen.

`expiresAt` ist optional; ist es gesetzt und überschritten, verhält sich der
Schlüssel wie ein unbekannter.

`lastUsedAt` wird höchstens alle 60 Sekunden geschrieben, nicht bei jedem Request
— sonst käme auf jede Leseanfrage ein Schreibvorgang. Ein Fehler dabei darf die
eigentliche Anfrage nicht kippen.

Die Schlüsselverwaltung selbst (`/api/api-keys`) ist für Schlüssel gesperrt
(`denyApiKey`): ein Schlüssel darf sich nicht selbst verlängern oder neue ausstellen.

Nicht-Admins sehen und verwalten ausschließlich ihre eigenen Schlüssel.

## Beispiel

```bash
KEY="cflux_…"

# Lesen
curl -H "X-API-Key: $KEY" https://cflux.example/api/projects

# Schreiben — braucht projects:write und einen Schlüssel ohne Nur-Lesen
curl -X POST https://cflux.example/api/customers \
  -H "X-API-Key: $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Beispiel AG"}'
```

### Geräte und die Rolle ADMIN

`/api/devices` ist zwar freigegeben, aber die Routen dahinter verlangen fast
durchgehend `authorize('ADMIN')` — also die **Rolle**, nicht ein Modulrecht.
Für einen API-Schlüssel heisst das: `devices:read` allein reicht nicht, der
Benutzer hinter dem Schlüssel muss zusätzlich Administrator sein. Sonst kommt
ein `403 {"error":"Forbidden"}`.

Einzige Ausnahme ist `GET /api/devices/user/:userId`; sie kommt ohne die Rolle
aus. Das ist die Route, über die ein Kollege ohne Adminrechte die Geräte eines
Mitarbeiters abfragen kann.

Diese Asymmetrie ist eine Eigenschaft des Gerätemoduls und keine der Public
API — sie gilt im Browser genauso. Wer sie ändern will, ändert
`routes/device.routes.ts`, nicht die Allowlist.

### Intranet und Benutzergruppen

Beim Intranet kommt eine vierte Schranke dazu: die Gruppenrechte am Dokument.
Sie werden serverseitig für den Benutzer ausgewertet, zu dem der Schlüssel
gehört — ein Schlüssel sieht also genau das, was diese Person im Browser sähe.
Dafür ist auf der API-Seite nichts zu tun.

Ein Recht auf einem Ordner gilt für alles darin: die Prüfung läuft den Pfad
hoch zum nächsten Vorfahren mit gesetzten Rechten. Sind nirgends im Pfad welche
gesetzt, ist der Knoten offen. Details in `services/documentAccess.service.ts`.

Das gilt auch für die Suche — ein gesperrtes Dokument taucht dort nicht als
Treffer auf, weder mit Titel noch mit Textausschnitt.

## Schreiben

Ein schreibender Aufruf braucht **beides**: den `:write`-Scope für das Modul und
einen Schlüssel, bei dem **Nur-Lesen nicht gesetzt** ist. Das Kennzeichen wird
vor den Scopes geprüft und blockt `POST`, `PUT`, `PATCH` und `DELETE`
unabhängig davon — es ist der Notausschalter, nicht die Feineinstellung.

Danach greift weiterhin die dritte Schranke: die Modulrechte des Benutzers, in
dessen Namen der Schlüssel handelt. Fehlt dem das Schreibrecht, antwortet der
Controller mit `No permission to …` — ein Schlüssel kann nie mehr als sein
Benutzer.

Angelegte Datensätze tragen diesen Benutzer als Urheber. Ein Vorfall über die
Public API erscheint also unter dessen Namen, mit Status `OPEN`.

### Anlegen und Verschieben im Intranet

`POST /api/intranet` verlangt seit August 2026 das Schreibrecht am Zielordner,
nicht mehr nur das Modulrecht — sonst könnte jeder mit dem Modul Inhalte in
fremden Bereichen ablegen. Ein so angelegtes Dokument ist sofort durch die
Rechte seines Ordners geschützt; es muss nichts gesetzt werden.

`POST /api/intranet/:id/move` verlangt das Schreibrecht an **beiden** Enden.
Die Quelle ist dabei die wichtigere Hälfte: ohne sie liesse sich ein geschütztes
Dokument aus seinem Ordner herausziehen und verlöre dabei den geerbten Schutz —
die Vererbung wäre mit einem Handgriff ausgehebelt.

Umgekehrt gilt: wer am Ordner schreiben darf, darf ein Dokument auch
herausschieben und damit entschützen. Das ist Absicht, entspricht dem
Schreibrecht und ist im Browser genauso.

### Anlegen von Vorfällen

`POST /api/incidents` nimmt seit August 2026 auch die EHS-Detailfelder und die
Massnahmen entgegen (`lostWorkDays`, `medicalTreatment`, `hospitalRequired`,
`workersOnDay`, `hoursWorkedDay`, `correctiveActions`, `preventiveActions`,
`notes`). Vorher kannte nur `PUT` sie, wodurch ein vollständiger EHS-Vorfall
sich nicht in einem Zug melden liess — die Angaben verschwanden kommentarlos.
`status` bleibt bewusst aussen vor: ein neuer Vorfall ist immer `OPEN`.

### Freigabelauf für Dokumente

Ein Intranet-Dokument durchläuft `DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED`,
mit `REJECTED` als Seitenast. Einreichen und Zurückholen verlangen die Stufe
`WRITE` auf dem Dokument, Freigeben, Ablehnen und Veröffentlichen die Stufe
`ADMIN`. Aus `REJECTED` führt kein direkter Weg zurück ins Einreichen — erst
`POST /:id/return-to-draft`.

`GET /:id/pending-approvals` liefert nur, was dem aufrufenden Benutzer über
`assignedApproverId` zugewiesen ist.

**Solange auf keinem Knoten Gruppenrechte gesetzt sind, erfüllt jeder mit dem
Modulrecht auch `ADMIN`** — die Prüfung läuft bis zur Wurzel, findet nichts und
lässt durch. Der Freigabelauf wird also erst zur Kontrolle, wenn Gruppenrechte
vergeben sind.

### Anhänge

`POST /api/intranet/:nodeId/attachments` nimmt `multipart/form-data` mit dem
Feld `file` und optional `description`, höchstens 100 MB. cflux erzeugt über
Gotenberg eine PDF-Vorschau; dafür muss der Content-Type stimmen.

## Client-Paket

`GET /api/api-keys/client` meldet, ob ein fertig gebautes MCP-Client-Paket
bereitliegt; `GET /api/api-keys/client/download` liefert es aus. Beide hängen
am api-keys-Router und damit hinter `denyApiKey` — den Client bekommt nur, wer
sich wirklich angemeldet hat. Ein Schlüssel soll sich nicht selbst den Client
herunterladen können.

Das Backend baut nichts: es liefert aus, was in `backend/downloads/` liegt
(überschreibbar per `CLIENT_DOWNLOAD_DIR`). Erzeugt wird das Paket mit
`npm run package:windows` im Ordner `mcp-server`; das Skript legt es dort ab.
Liegen mehrere Versionen, gewinnt die zuletzt gebaute. Fehlt das Paket, meldet
die Info-Route `{ "available": false }` und die Oberfläche blendet den Knopf aus.

Siehe [`../mcp-server/README.md`](../mcp-server/README.md).

## Datenmodell

`ApiKey` in `backend/prisma/schema.prisma`, Tabelle `api_keys`. Beim Löschen
eines Benutzers verschwinden seine Schlüssel mit (`onDelete: Cascade`); der
Ersteller (`createdById`) wird nur genullt, damit ein ausgeschiedener Admin
nicht die Schlüssel anderer mitreißt.

Die Tabelle ist in beiden Backup-Maps eingetragen (`backup.controller.ts` und
`backupScheduler.service.ts`) und wird in Phase 4 der Wiederherstellung
zurückgespielt — nach den Benutzern, weil sie auf sie verweist.
