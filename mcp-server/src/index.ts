#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CfluxClient, CfluxError, configFromEnv } from './cflux.js';
import { VERSION } from './version.js';

/**
 * MCP-Server fuer cflux.
 *
 * Laeuft lokal bei jedem Kollegen und spricht ueber dessen eigenen
 * API-Schluessel mit cflux. Was der Server sehen kann, entscheidet allein der
 * Schluessel — dieser Prozess hat keine Sonderrechte und kann sie sich auch
 * nicht verschaffen.
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

/** Wohin PDF-Exporte geschrieben werden. */
const downloadDir = resolve(process.env.CFLUX_DOWNLOAD_DIR ?? join(tmpdir(), 'cflux'));

const server = new McpServer({ name: 'cflux', version: VERSION });

/** Reicht Fehler als lesbaren Text zurueck, statt den Aufruf hart scheitern zu lassen. */
const guard = async (fn: () => Promise<string>) => {
  try {
    return { content: [{ type: 'text' as const, text: await fn() }] };
  } catch (error: any) {
    const text =
      error instanceof CfluxError
        ? error.message
        : `Unerwarteter Fehler: ${error?.message ?? error}`;
    return { content: [{ type: 'text' as const, text }], isError: true };
  }
};

const asJson = (value: unknown): string => JSON.stringify(value, null, 2);

// ── Rundgangsberichte ────────────────────────────────────────────────────────

server.registerTool(
  'cflux_list_berichte',
  {
    title: 'Rundgangsberichte auflisten',
    description:
      'Listet die Rundgangsberichte (Toolbox-Rundgang / Tagesprotokoll) auf, auf die der ' +
      'konfigurierte Schlüssel Zugriff hat. Liefert je Bericht Projekt, Datum, Wochentag, ' +
      'Status sowie die Anzahl der Feststellungen und Fotos. Braucht den Scope berichte:read.',
    inputSchema: {
      projekt: z
        .string()
        .optional()
        .describe('Optional: nur Berichte, deren Projektname diesen Text enthält (ohne Groß-/Kleinschreibung).'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ projekt }) =>
    guard(async () => {
      const berichte = await client.getJson<any[]>('/berichte');

      const gefiltert = projekt
        ? berichte.filter((b) =>
            (b.project?.name ?? '').toLowerCase().includes(projekt.toLowerCase())
          )
        : berichte;

      if (!gefiltert.length) {
        return projekt
          ? `Keine Rundgangsberichte gefunden, deren Projekt "${projekt}" enthält (${berichte.length} insgesamt sichtbar).`
          : 'Keine Rundgangsberichte sichtbar.';
      }

      return asJson(
        gefiltert.map((b) => ({
          id: b.id,
          projekt: b.project?.name ?? null,
          datum: typeof b.date === 'string' ? b.date.slice(0, 10) : null,
          wochentag: b.weekday,
          status: b.status,
          feststellungen: b._count?.findings ?? null,
          fotos: b._count?.photos ?? null,
          erstelltVon: b.createdBy
            ? `${b.createdBy.firstName} ${b.createdBy.lastName}`
            : null,
        }))
      );
    })
);

server.registerTool(
  'cflux_get_bericht',
  {
    title: 'Rundgangsbericht im Detail',
    description:
      'Lädt einen einzelnen Rundgangsbericht vollständig: Kopfdaten, kontrollierte Bereiche ' +
      'mit Status, Feststellungen samt Massnahmen und die Foto-Metadaten. Die Bericht-ID ' +
      'stammt aus cflux_list_berichte. Braucht den Scope berichte:read.',
    inputSchema: {
      id: z.string().describe('Die ID des Berichts, wie von cflux_list_berichte geliefert.'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ id }) =>
    guard(async () => {
      const b = await client.getJson<any>(`/berichte/${encodeURIComponent(id)}`);

      return asJson({
        id: b.id,
        projekt: b.project?.name ?? null,
        datum: typeof b.date === 'string' ? b.date.slice(0, 10) : null,
        wochentag: b.weekday,
        status: b.status,
        referent: b.referent,
        rundgangDurchgefuehrt: b.rundgangDurchgefuehrt,
        weitereTeilnehmer: b.weitereTeilnehmer,
        bereiche: (b.areas ?? []).map((a: any) => ({
          bereich: a.areaKey ?? a.name ?? a.key,
          status: a.status,
          bemerkung: a.note ?? a.bemerkung ?? null,
        })),
        feststellungen: (b.findings ?? []).map((f: any) => ({
          position: f.position ?? f.pos,
          feststellung: f.text ?? f.finding ?? f.description,
          bereich: f.area,
          klassifizierung: f.classification,
          ampel: f.ampel ?? f.trafficLight,
          massnahme: f.measure ?? f.massnahme,
          verantwortlich: f.responsible,
          termin: f.dueDate ?? f.termin,
          status: f.status,
        })),
        fotoAnzahl: (b.photos ?? []).length,
      });
    })
);

server.registerTool(
  'cflux_list_bericht_projekte',
  {
    title: 'Projekte mit Rundgangsberichten',
    description:
      'Listet die Projekte auf, für die der konfigurierte Schlüssel Rundgangsberichte sehen ' +
      'oder anlegen darf. Nützlich, um vor einer Suche die richtigen Projektnamen zu kennen. ' +
      'Braucht den Scope berichte:read.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () =>
    guard(async () => {
      const projekte = await client.getJson<any[]>('/berichte/projects');

      if (!projekte.length) {
        return 'Keine Projekte mit Rundgangsberichten sichtbar.';
      }

      return asJson(projekte.map((p) => ({ id: p.id, name: p.name })));
    })
);

server.registerTool(
  'cflux_export_bericht_pdf',
  {
    title: 'Rundgangsbericht als PDF speichern',
    description:
      'Lädt einen Rundgangsbericht als fertiges PDF herunter und legt es lokal ab. Gibt den ' +
      'Dateipfad zurück — die Datei selbst wird nicht in den Chat geladen, weil ein Bericht ' +
      'mehrere hundert Kilobyte gross sein kann. Braucht den Scope berichte:read.',
    inputSchema: {
      id: z.string().describe('Die ID des Berichts, wie von cflux_list_berichte geliefert.'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ id }) =>
    guard(async () => {
      const { bytes, filename } = await client.getFile(
        `/berichte/${encodeURIComponent(id)}/export.pdf`
      );

      if (!existsSync(downloadDir)) {
        mkdirSync(downloadDir, { recursive: true });
      }

      // Der Dateiname kommt aus cflux; Pfadtrenner werden entfernt, damit er
      // nicht aus dem Zielverzeichnis herausfuehren kann.
      const safeName = (filename ?? `bericht_${id}.pdf`).replace(/[/\\]/g, '_');
      const target = join(downloadDir, safeName);
      writeFileSync(target, bytes);

      const kb = Math.round(bytes.length / 1024);
      return `PDF gespeichert: ${target} (${kb} KB)`;
    })
);

/**
 * Selbsttest fuer den Aufruf ausserhalb von Claude.
 *
 * Ein Kollege, bei dem etwas nicht geht, soll nicht in MCP-Logs suchen muessen:
 * einmal test.cmd doppelklicken sagt, ob Verbindung, Schluessel und Scope
 * stimmen — und was zu tun ist, wenn nicht.
 */
const selftest = async (): Promise<number> => {
  const out = (s: string) => process.stdout.write(s + '\n');

  out('');
  out(`cflux-mcp ${VERSION} — Selbsttest`);
  out('═══════════════════════════════');
  out(`Server:    ${process.env.CFLUX_BASE_URL}`);
  out(`Schlüssel: ${(process.env.CFLUX_API_KEY ?? '').slice(0, 14)}…`);
  out('');

  try {
    const projekte = await client.getJson<any[]>('/berichte/projects');
    const berichte = await client.getJson<any[]>('/berichte');

    out('✓ Verbindung steht');
    out('✓ Schlüssel wird akzeptiert');
    out(`✓ Zugriff auf Rundgangsberichte: ${projekte.length} Projekte, ${berichte.length} Berichte`);
    out('');
    out('Alles in Ordnung. Der Eintrag in Claude Desktop kann so bleiben.');
    out('');
    return 0;
  } catch (error: any) {
    out('✗ Fehlgeschlagen');
    out('');
    out(`  ${error?.message ?? error}`);
    out('');
    out('Bitte die beiden Werte in claude_desktop_config.json prüfen und');
    out('im Zweifel in cflux unter System → API-Schlüssel nachsehen.');
    out('');
    return 1;
  }
};

if (process.argv.includes('--selftest')) {
  process.exit(await selftest());
}

const transport = new StdioServerTransport();
await server.connect(transport);
