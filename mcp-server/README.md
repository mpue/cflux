# cflux-mcp

MCP-Server für die cflux Public API. Läuft lokal auf dem Rechner und macht
Rundgangsberichte, Vorfälle, Intranet-Dokumente und das Geräteregister in
Claude Desktop und Claude Code verfügbar.

Jeder benutzt **seinen eigenen** API-Schlüssel. Der Server hat keine eigenen
Rechte — er kann genau das, was der Schlüssel erlaubt, und nicht mehr.

## Verteilung an Kollegen (Windows)

Für Kollegen ohne Node ist das fertige ZIP gedacht. Es enthält `node.exe`,
den gebündelten Server, eine `LIESMICH.txt` in ganzen Sätzen, eine
Beispiel-Konfiguration und `test.cmd` für den Selbsttest.

```bash
npm run package:windows
```

Ergebnis: `dist-win/cflux-mcp-<version>-windows.zip`. Das Skript legt es
zusätzlich in `backend/downloads/` ab — von dort bietet cflux es im Admin-Panel
unter **System → API-Schlüssel** direkt zum Herunterladen an, gleich neben dem
frisch erzeugten Schlüssel. Damit muss niemand ein Netzlaufwerk suchen.

Alternativ aufs Netzlaufwerk legen. Die Kollegen entpacken nach `C:\cflux-mcp`
und folgen der `LIESMICH.txt`. Kein Node, kein npm, keine Adminrechte.

Das `node.exe` wird einmal von nodejs.org geholt und unter `.node-cache/`
abgelegt; weitere Bauläufe benutzen es von dort. Andere Version:
`NODE_VERSION=v22.20.0 ./scripts/build-windows.sh`.

**Jeder Kollege legt sich einen eigenen Schlüssel an.** Ein geteilter
Schlüssel macht unmöglich, nachzuvollziehen wer was abgerufen hat, und
lässt sich bei einem verlorenen Gerät nicht sperren, ohne alle zu treffen.

## Einrichtung aus dem Quelltext (Entwickler)

### 1. Schlüssel holen

In cflux unter **System → 🔌 API-Schlüssel** einen neuen Schlüssel anlegen:

- **Name**: etwas Sprechendes, z.B. „Claude Desktop – Laptop Meier"
- **Nur-Lesen**: angehakt lassen
- **Module**: die benötigten auf **Lesen** stellen, z.B. *Rundgangsberichte*
  und *Vorfälle*

Wer Vorfälle **melden** oder Dokumente **anlegen** soll, braucht zusätzlich den
Haken bei Nur-Lesen **entfernt** und das betreffende Modul auf **Schreiben**.
Beides ist nötig.

Der Schlüssel wird **genau einmal** angezeigt. Wer ihn nicht sofort sichert,
braucht einen neuen — nachschlagen geht nicht.

### 2. Server bauen

```bash
git clone <cflux-repo>
cd cflux/mcp-server
npm install
npm run build
```

### 3. In Claude eintragen

**Claude Code:**

```bash
claude mcp add cflux \
  --env CFLUX_BASE_URL=https://cflux.example \
  --env CFLUX_API_KEY=cflux_… \
  -- node /pfad/zu/cflux/mcp-server/dist/index.js
```

**Claude Desktop** — in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cflux": {
      "command": "node",
      "args": ["/pfad/zu/cflux/mcp-server/dist/index.js"],
      "env": {
        "CFLUX_BASE_URL": "https://cflux.example",
        "CFLUX_API_KEY": "cflux_…"
      }
    }
  }
}
```

Die Datei liegt unter `~/Library/Application Support/Claude/` (macOS)
bzw. `%APPDATA%\Claude\` (Windows). Danach Claude Desktop neu starten.

## Konfiguration

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `CFLUX_BASE_URL` | ja | Basis-URL ohne `/api`, z.B. `https://cflux.example` |
| `CFLUX_API_KEY` | ja | Der eigene Schlüssel, beginnt mit `cflux_` |
| `CFLUX_DOWNLOAD_DIR` | nein | Wohin PDF-Exporte geschrieben werden. Vorgabe: Unterordner `cflux` im temporären Verzeichnis |

## Werkzeuge

**Rundgangsberichte** — Scope `berichte:read`

| Werkzeug | Zweck |
|---|---|
| `cflux_list_berichte` | Berichte auflisten, optional nach Projektname gefiltert |
| `cflux_get_bericht` | Ein Bericht vollständig: Bereiche, Feststellungen, Massnahmen |
| `cflux_list_bericht_projekte` | Projekte, für die Berichte sichtbar sind |
| `cflux_export_bericht_pdf` | Fertiges PDF herunterladen und lokal ablegen |

**Vorfälle** — Scope `incidents:read`

| Werkzeug | Zweck |
|---|---|
| `cflux_list_incidents` | Vorfälle auflisten; Filter nach Status, Priorität, Jahr, Projekt, EHS |
| `cflux_get_incident` | Ein Vorfall vollständig, inkl. Kommentaren und EHS-Feldern |
| `cflux_incident_statistics` | Zählwerte: gesamt, offen, in Bearbeitung, gelöst, kritisch, hoch |
| `cflux_export_incident_pdf` | Vorfallbericht als PDF |

**Intranet-Dokumente** — Scope `intranet:read`

| Werkzeug | Zweck |
|---|---|
| `cflux_list_documents` | Dokumentenbaum mit Pfaden; Filter nach Text, nur Ordner |
| `cflux_get_document` | Ein Dokument mit Inhalt als lesbarem Text, plus Anhänge |
| `cflux_search_intranet` | Volltextsuche über Dokumente, Anhänge und Versionen |
| `cflux_download_attachment` | Anhang herunterladen und lokal ablegen |

Was hier sichtbar ist, entscheidet cflux anhand der **Benutzergruppen** — und
zwar für den Benutzer, zu dem der Schlüssel gehört. Ein Recht auf einem Ordner
gilt für alles darin. Der MCP-Server filtert nichts nach; Gesperrtes bekommt er
gar nicht erst zu sehen, auch nicht über die Suche.

**Geräte** — Scope `devices:read`

| Werkzeug | Zweck |
|---|---|
| `cflux_list_devices` | Geräteregister auflisten; Filter nach Text, Kategorie, Mitarbeiter, unzugewiesen, ausgemustert |
| `cflux_get_device` | Ein Gerät vollständig, mit installierter Software und den Schwachstellen aus Action1 |
| `cflux_software_report` | Software über alle Geräte aggregiert — wie oft installiert, welche Versionen |
| `cflux_list_user_devices` | Die Geräte eines bestimmten Mitarbeiters |

Dieses Modul hat eine Besonderheit: cflux schützt die Geräte-Endpunkte mit der
**Rolle ADMIN**, nicht bloss mit einem Modulrecht. Der Scope `devices:read`
allein genügt also nicht — wer in cflux kein Administrator ist, bekommt bei den
ersten drei Werkzeugen eine Absage und kann nur `cflux_list_user_devices`
benutzen. Das ist kein Fehler im Schlüssel; der Selbsttest weist es
entsprechend als Hinweis und nicht als Defekt aus.

**Lizenzschlüssel gibt dieser Server nicht heraus.** Sie stehen im Register,
gehören aber nicht in einen Chatverlauf — wer sie braucht, sieht sie in cflux.

**Schreibend** — Scope `<modul>:write`, Schlüssel **ohne** Nur-Lesen

| Werkzeug | Zweck | Nötige Stufe |
|---|---|---|
| `cflux_create_incident` | Vorfall anlegen, inkl. aller EHS-Felder und Massnahmen | — |
| `cflux_create_document` | Intranet-Dokument oder Ordner anlegen | WRITE auf dem Zielordner |
| `cflux_upload_attachment` | Datei vom eigenen Rechner anhängen, max. 100 MB | WRITE |
| `cflux_submit_document` | Entwurf zur Freigabe einreichen | WRITE |
| `cflux_reopen_document` | Abgelehntes zurück in den Entwurf | WRITE |
| `cflux_review_document` | freigeben oder ablehnen | **ADMIN** |
| `cflux_publish_document` | veröffentlichen, erst dann sichtbar | **ADMIN** |

Alles entsteht im Namen des Benutzers, zu dem der Schlüssel gehört: ein
Vorfall startet im Status „Offen", ein Dokument als **Entwurf**.

### Der Freigabelauf

```
Entwurf ──einreichen──▶ Zur Prüfung ──freigeben──▶ Freigegeben ──veröffentlichen──▶ Sichtbar
   ▲                         │
   │                         └──ablehnen──▶ Abgelehnt
   └──── zurück in den Entwurf ─────────────────┘
```

Aus „Abgelehnt" führt kein Weg direkt zurück ins Einreichen — erst
`cflux_reopen_document` macht wieder einen Entwurf daraus. Eine Ablehnung ohne
Begründung wird abgewiesen; sie ist das Einzige, woran sich der Verfasser
orientieren kann.

**Solange nirgends Gruppenrechte gesetzt sind, hat jeder mit dem Intranet-Modul
auch die Stufe ADMIN.** Der Freigabelauf wird erst dann zur echten Kontrolle,
wenn mindestens eine Gruppe mit `ADMIN` auf den relevanten Ordnern steht.

Das Nur-Lesen-Kennzeichen blockt das Anlegen unabhängig von den Scopes; beides
muss stimmen. Wer in einen geschützten Ordner schreiben will, braucht dort
zusätzlich das Schreibrecht. Danach gelten dessen Gruppenrechte auch für das
neue Dokument, ohne dass etwas gesetzt werden müsste.

Ein Schlüssel braucht nur die Scopes der Module, die tatsächlich gebraucht
werden. Fehlt einer, melden die betroffenen Werkzeuge das im Klartext und
sagen, was einzustellen ist; der Rest funktioniert weiter.

**Vorgabe bleibt Nur-Lesen.** Ein Schreibrecht bekommt nur, wer es wirklich
braucht, und nur für das Modul, um das es geht — für alle anderen ändert sich
nichts.

Die PDF-Exporte und Anhang-Downloads geben einen **Dateipfad** zurück, nicht die
Datei selbst — beides wiegt schnell mehrere hundert Kilobyte, und die gehören
nicht ins Kontextfenster. Umgekehrt liest `cflux_upload_attachment` eine Datei
vom Rechner des Kollegen; der Pfad muss vollständig angegeben werden.

## Beispiele

> Welche Rundgangsberichte gibt es für Novartis?

> Zeig mir die Feststellungen aus dem Bericht vom 25. August.

> Welche Vorfälle sind noch offen und hoch priorisiert?

> Gib mir alle EHS-relevanten Vorfälle aus diesem Jahr mit den Massnahmen.

> Wie viele Vorfälle sind aktuell in Bearbeitung?

> Melde einen Beinahe-Unfall: Mitarbeiter ist heute in Halle 3 auf einer nassen
> Gerüststufe abgerutscht, konnte sich festhalten, kein Ausfall. Antirutschbelag
> ist schon angebracht.

> Was steht im Intranet zur PSA gegen Absturz?

> Zeig mir alle Ordner im Intranet.

> Fasse das Dokument "Arbeitssicherheit" zusammen.

> Leg im Handbuch ein Dokument zum Lärmschutz an und häng
> C:\Messungen\Halle3.pdf dran.

> Was liegt mir zur Freigabe vor?

> Gib das Lärmschutz-Dokument frei und veröffentliche es.

> Leg im Intranet eine Checkliste für den Aussendienst an: Fahrzeug prüfen,
> Muster einpacken, Termine bestätigen.

> Welche Laptops sind gerade niemandem zugewiesen?

> Welche Geräte hat Nina Normal, und laufen die noch in der Garantie?

> Auf wie vielen Geräten läuft Microsoft 365, und in welchen Versionen?

> Welche Schwachstellen sind auf dem ThinkPad offen?

## Wenn etwas nicht geht

| Meldung | Ursache |
|---|---|
| „Der API-Schlüssel wurde abgelehnt" | Schlüssel unbekannt, widerrufen, abgelaufen — oder der Benutzer ist deaktiviert |
| „… ist nicht Teil der Public API" | Der Endpunkt ist bewusst nur mit echtem Login erreichbar |
| „Zugriff verweigert: API key is missing scope: …" | Dem Schlüssel fehlt das genannte Modul — in cflux nachtragen |
| „Der Schlüssel ist als Nur-Lesen angelegt" | Schreibender Aufruf auf einem Nur-Lesen-Schlüssel |
| „cflux ist unter … nicht erreichbar" | `CFLUX_BASE_URL` falsch, oder kein Netz/VPN |

Startet der Server gar nicht, steht der Grund im MCP-Log des Clients — bei
fehlender Konfiguration nennt er die beiden erwarteten Variablen beim Namen.

## Ein Modul ergänzen

1. Eine Datei unter `src/tools/` anlegen, die eine `register…Tools(server, client)`
   exportiert. `src/tools/shared.ts` bringt `guard`, `asJson` und `savePdf` mit.
2. In `src/index.ts` registrieren und in `MODULES` eintragen — Letzteres nimmt
   das Modul in den Selbsttest auf.
3. Der Modul-Scope muss serverseitig freigegeben sein, siehe
   `PUBLIC_API_ROUTES` in [`../docs/PUBLIC_API.md`](../docs/PUBLIC_API.md).

## Sicherheit

Der Schlüssel steht im Klartext in der Konfigurationsdatei. Das ist derselbe
Vertrauensbereich wie ein gespeichertes Passwort im Browser — aber:

- Ein Nur-Lesen-Schlüssel mit einem einzigen Modul richtet wenig Schaden an.
  Deshalb bleibt Nur-Lesen die Vorgabe; Schreibrechte bekommt nur, wer sie
  wirklich braucht, und nur für das Modul, um das es geht.
- Geht ein Gerät verloren, wird **dieser eine** Schlüssel widerrufen. Alle
  anderen laufen weiter.
- Ein Ablaufdatum zwingt zur regelmässigen Erneuerung.
- Unter **System → API-Schlüssel** ist ablesbar, wann ein Schlüssel zuletzt
  benutzt wurde — ein liegengebliebener fällt so auf.

Schlüssel niemals teilen. Wer einen braucht, legt sich einen eigenen an: nur so
bleibt nachvollziehbar, wer was abgerufen hat.

Details zur API selbst: [`../docs/PUBLIC_API.md`](../docs/PUBLIC_API.md).
