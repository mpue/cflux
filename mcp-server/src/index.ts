#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CfluxClient, configFromEnv } from './cflux.js';
import { VERSION } from './version.js';
import { registerBerichtTools } from './tools/berichte.js';
import { registerIncidentTools } from './tools/incidents.js';
import { registerIntranetTools } from './tools/intranet.js';
import { registerDeviceTools } from './tools/devices.js';
import { registerKontaktTools } from './tools/kontakte.js';

/**
 * MCP-Server fuer cflux.
 *
 * Laeuft lokal bei jedem Kollegen und spricht ueber dessen eigenen
 * API-Schluessel mit cflux. Was der Server sehen kann, entscheidet allein der
 * Schluessel — dieser Prozess hat keine Sonderrechte und kann sie sich auch
 * nicht verschaffen.
 *
 * Ein neues Modul kommt als Datei unter tools/ dazu und wird hier eingetragen;
 * MODULES nimmt es zusaetzlich in den Selbsttest auf.
 */

/**
 * Konfigurationsfehler landen in den Logs des MCP-Clients. Dort hilft ein Satz
 * mit dem naechsten Schritt mehr als ein Stacktrace.
 */
const loadClient = (): CfluxClient => {
  try {
    return new CfluxClient(configFromEnv());
  } catch (error: any) {
    process.stderr.write(
      `\ncflux-mcp lässt sich nicht starten.\n${error?.message ?? error}\n\n` +
        'Beide Werte gehören in den env-Block des MCP-Eintrags:\n' +
        '  CFLUX_BASE_URL  z.B. https://cflux.example\n' +
        '  CFLUX_API_KEY   cflux_… aus cflux unter System → API-Schlüssel\n\n'
    );
    process.exit(1);
  }
};

// Vor dem Aufbau des Clients: --version muss auch ohne Konfiguration
// antworten, sonst kann ein Kollege nicht melden, welchen Stand er hat.
if (process.argv.includes('--version')) {
  process.stdout.write(`cflux-mcp ${VERSION}\n`);
  process.exit(0);
}

const client = loadClient();

const server = new McpServer({ name: 'cflux', version: VERSION });

registerBerichtTools(server, client);
registerIncidentTools(server, client);
registerIntranetTools(server, client);
registerDeviceTools(server, client);
registerKontaktTools(server, client);

/**
 * Was der Selbsttest prueft — je Modul ein Endpunkt und der noetige Scope.
 *
 * "adminOnly" heisst: der Scope allein genuegt nicht, der Benutzer hinter dem
 * Schluessel braucht zusaetzlich die Rolle ADMIN. Beim Geraeteregister ist das
 * so; ein Kollege ohne Adminrolle sieht dort nur seine eigenen Geraete.
 */
const MODULES = [
  { name: 'Rundgangsberichte', scope: 'berichte:read', probe: '/berichte' },
  { name: 'Vorfälle', scope: 'incidents:read', probe: '/incidents' },
  { name: 'Intranet-Dokumente', scope: 'intranet:read', probe: '/intranet/tree' },
  { name: 'Geräte', scope: 'devices:read', probe: '/devices', adminOnly: true },
  { name: 'Kontakte', scope: 'contacts:read', probe: '/contacts' },
];

/**
 * Selbsttest fuer den Aufruf ausserhalb von Claude.
 *
 * Ein Kollege, bei dem etwas nicht geht, soll nicht in MCP-Logs suchen muessen:
 * einmal test.cmd doppelklicken sagt, ob Verbindung, Schluessel und Zugriff
 * stimmen — und was zu tun ist, wenn nicht.
 *
 * Jedes Modul wird einzeln geprueft. Ein Schluessel, der nur eines abdeckt, ist
 * voellig in Ordnung — deshalb sind ein fehlender Scope und eine fehlende
 * Adminrolle hier Hinweise und keine Fehlschlaege. Fehlgeschlagen ist der Test
 * nur, wenn etwas kaputt ist, das keiner dieser beiden Gruende erklaert.
 */
const selftest = async (): Promise<number> => {
  const out = (s: string) => process.stdout.write(s + '\n');

  out('');
  out(`cflux-mcp ${VERSION} — Selbsttest`);
  out('═══════════════════════════════');
  out(`Server:    ${process.env.CFLUX_BASE_URL}`);
  out(`Schlüssel: ${(process.env.CFLUX_API_KEY ?? '').slice(0, 14)}…`);
  out('');

  let erreichbar = 0;
  let erklaert = 0;
  let kaputt = 0;

  for (const modul of MODULES) {
    try {
      const eintraege = await client.getJson<any[]>(modul.probe);
      out(`✓ ${modul.name}: Zugriff vorhanden (${eintraege.length} Einträge sichtbar)`);
      erreichbar++;
    } catch (error: any) {
      if (error?.reason === 'missing-scope') {
        out(`· ${modul.name}: nicht freigegeben — dem Schlüssel fehlt ${modul.scope}`);
        erklaert++;
      } else if (error?.reason === 'needs-admin') {
        out(
          `· ${modul.name}: nur mit Adminrolle vollständig — ohne sie bleiben ` +
            'die eigenen Geräte abrufbar.'
        );
        erklaert++;
      } else {
        out(`✗ ${modul.name}: ${error?.message ?? error}`);
        kaputt++;
      }
    }
  }

  out('');

  if (erreichbar === 0 && kaputt > 0) {
    out('Kein einziges Modul erreichbar.');
    out('');
    out('Bitte die beiden Werte in claude_desktop_config.json prüfen und');
    out('im Zweifel in cflux unter System → API-Schlüssel nachsehen.');
    out('');
    return 1;
  }

  // Nichts erreichbar, aber jede Absage erklaert: Verbindung und Schluessel
  // stimmen, der Schluessel ist nur eng geschnitten. Das ist kein Fehler.
  if (erreichbar === 0) {
    out('Verbindung und Schlüssel sind in Ordnung — dieser Schlüssel ist nur für');
    out('keines der geprüften Module freigegeben. Was gebraucht wird, lässt sich in');
    out('cflux unter System → API-Schlüssel bei "Bearbeiten" nachtragen.');
    out('');
    return 0;
  }

  out(`Verbindung und Schlüssel sind in Ordnung (${erreichbar} von ${MODULES.length} Modulen).`);
  if (kaputt > 0) {
    out(`${kaputt} Modul(e) mit den Zeilen oben stimmen nicht — dort steht, woran es liegt.`);
  } else if (erklaert > 0) {
    out('Wird ein nicht freigegebenes Modul gebraucht, lässt sich der Scope in');
    out('cflux beim Schlüssel unter "Bearbeiten" nachtragen.');
  }
  out('Der Eintrag in Claude Desktop kann so bleiben.');
  out('');
  return 0;
};

if (process.argv.includes('--selftest')) {
  process.exit(await selftest());
}

const transport = new StdioServerTransport();
await server.connect(transport);
