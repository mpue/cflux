# Modul „Rundgangsberichte“ (Toolbox-Rundgang / Tagesprotokoll)

> Anzeigename ist **Rundgangsberichte**, der Modul-Key ist **`berichte`**.
> „Berichte“ war als `Module.name` bereits vom Auswertungs-Modul (`key: 'reports'`)
> belegt — und `Module.name` ist unique.

Übernahme des eigenständigen Wochenbericht-Tools in cflux. Fachlich unverändert
(Kopfdaten → Bereichs-Check → Fotos → Feststellungen → Export), technisch aber
an Projekte, Modulrechte und die cflux-Datenbank angebunden.

## Zugriffsregeln

Zwei voneinander unabhängige Prüfungen greifen bei jedem Endpunkt:

| Prüfung | Middleware | Frage |
|---|---|---|
| Modulrecht | `requireModuleAccess('berichte', …)` | Darf der Benutzer Berichte überhaupt sehen / anlegen / ändern / löschen? |
| Projektzuordnung | `requireProjectAccess` bzw. `hasProjectAccess` | Auf *welche* Berichte darf er zugreifen? |

Ein Bericht gehört zu genau einem Projekt (`Report.projectId`). Ein Benutzer
sieht einen Bericht nur, wenn ihm dieses Projekt über eine `ProjectAssignment`
zugeordnet ist. Admins (`UserRole.ADMIN`) sind — wie überall im System — von der
Projekteinschränkung ausgenommen.

Listen-Endpunkte filtern über `getAccessibleProjectIds()`; Einzelendpunkte laden
den Bericht und prüfen dessen `projectId`. Der Foto-Upload prüft den Zugriff
*vor* Multer, damit keine Datei eines Fremdprojekts auf der Platte landet.

## Projekt-Branding

Logo und Farben liegen am Projekt und sind in der Projektverwaltung
(Admin → Projekte → Projekt bearbeiten → „Branding“) editierbar:

- `Project.logoUrl` — Upload über `/api/uploads/logo`
- `Project.primaryColor` — Kopfzeilen und Trennlinien
- `Project.secondaryColor` — Beschriftungsfelder
- `Project.accentColor` — Wertefelder

Der Export übernimmt diese Werte. Fehlt ein Wert, greift die Palette des
Original-Layouts (`#634329` / `#EFE0D3` / `#FFF7E0`). Farbwerte werden vor dem
Einsetzen ins CSS gegen ein Hex-Muster geprüft.

## Datenmodell

| Modell | Tabelle | Zweck |
|---|---|---|
| `Report` | `reports` | Kopfdaten des Rundgangs, Verweis auf Projekt |
| `ReportArea` | `report_areas` | Kontrollierter Bereich mit Status (i.O. / Abweichung / nicht geprüft) |
| `ReportFinding` | `report_findings` | Feststellung inkl. Massnahme, Termin, Ampel, Beweisfoto |
| `ReportPhoto` | `report_photos` | Hochgeladenes Foto, Datei unter `uploads/report-photos/<reportId>/` |

Beim Anlegen eines Berichts werden die 14 Standard-Bereiche aus
`BEREICHE_TEMPLATE` (`services/bericht.service.ts`) vorbelegt.

`PUT /api/berichte/:id` ersetzt `areas` und `findings` vollständig, wenn sie
mitgeschickt werden — die Oberfläche sendet beim Autosave immer den gesamten
Stand.

## API

Alle Endpunkte unter `/api/berichte`, Authentifizierung per JWT.

| Methode | Pfad | Recht |
|---|---|---|
| `GET` | `/projects` | `canView` — Projekte, denen der Benutzer zugeordnet ist |
| `GET` | `/` (optional `?projectId=`) | `canView` |
| `POST` | `/` | `canCreate` + Projektzugriff (Body) |
| `GET` | `/:id` | `canView` |
| `PUT` | `/:id` | `canEdit` |
| `DELETE` | `/:id` | `canDelete` |
| `POST` | `/:id/photos` (multipart `photos`) | `canEdit` |
| `GET` | `/:id/photos/:photoId` | `canView` |
| `DELETE` | `/:id/photos/:photoId` | `canEdit` |
| `GET` | `/:id/export.html` | `canView` |
| `GET` | `/:id/export.pdf` | `canView` |

Das PDF entsteht über Gotenberg (`/forms/chromium/convert/html`, A4 quer) — das
Original-Tool nutzte dafür ein eigenes puppeteer-core.

## Inbetriebnahme

```bash
# Migration einspielen
cd backend && npx prisma migrate deploy

# Modul anlegen und für bestehende Benutzergruppen freischalten
npm run seed:berichte
```

Anschliessend unter Admin → Module die Gruppenrechte prüfen und den Benutzern
die passenden Projekte zuordnen.

## Frontend

- Route `/berichte`, abgesichert durch `ProtectedModuleRoute moduleKey="berichte"`
- Seite: `frontend/src/pages/BerichtePage.tsx` (5-Schritt-Assistent mit Autosave)
- Service: `frontend/src/services/bericht.service.ts`
- Eintrag „Rundgangsberichte“ im „Mehr“-Menü der Navigationsleiste
