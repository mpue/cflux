# cflux-mcp

MCP-Server für die cflux Public API. Läuft lokal auf dem Rechner und macht die
Rundgangsberichte in Claude Desktop und Claude Code verfügbar.

Jeder benutzt **seinen eigenen** API-Schlüssel. Der Server hat keine eigenen
Rechte — er kann genau das, was der Schlüssel erlaubt, und nicht mehr.

## Einrichtung

### 1. Schlüssel holen

In cflux unter **System → 🔌 API-Schlüssel** einen neuen Schlüssel anlegen:

- **Name**: etwas Sprechendes, z.B. „Claude Desktop – Laptop Meier"
- **Nur-Lesen**: angehakt lassen
- **Module**: bei *Rundgangsberichte* auf **Lesen** stellen

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

| Werkzeug | Zweck |
|---|---|
| `cflux_list_berichte` | Berichte auflisten, optional nach Projektname gefiltert |
| `cflux_get_bericht` | Ein Bericht vollständig: Bereiche, Feststellungen, Massnahmen |
| `cflux_list_bericht_projekte` | Projekte, für die Berichte sichtbar sind |
| `cflux_export_bericht_pdf` | Fertiges PDF herunterladen und lokal ablegen |

Alle vier sind lesend und brauchen den Scope `berichte:read`.

Der PDF-Export gibt einen **Dateipfad** zurück, nicht die Datei selbst — ein
Bericht wiegt schnell mehrere hundert Kilobyte, und die gehören nicht ins
Kontextfenster.

## Beispiele

> Welche Rundgangsberichte gibt es für Novartis?

> Zeig mir die Feststellungen aus dem Bericht vom 25. August.

> Lade mir den Novartis-Bericht als PDF herunter.

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

## Sicherheit

Der Schlüssel steht im Klartext in der Konfigurationsdatei. Das ist derselbe
Vertrauensbereich wie ein gespeichertes Passwort im Browser — aber:

- Ein Nur-Lesen-Schlüssel mit einem einzigen Modul richtet wenig Schaden an.
- Geht ein Gerät verloren, wird **dieser eine** Schlüssel widerrufen. Alle
  anderen laufen weiter.
- Ein Ablaufdatum zwingt zur regelmässigen Erneuerung.
- Unter **System → API-Schlüssel** ist ablesbar, wann ein Schlüssel zuletzt
  benutzt wurde — ein liegengebliebener fällt so auf.

Schlüssel niemals teilen. Wer einen braucht, legt sich einen eigenen an: nur so
bleibt nachvollziehbar, wer was abgerufen hat.

Details zur API selbst: [`../docs/PUBLIC_API.md`](../docs/PUBLIC_API.md).
