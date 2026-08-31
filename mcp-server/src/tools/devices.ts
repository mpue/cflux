import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CfluxClient } from '../cflux.js';
import { asJson, guard } from './shared.js';

/**
 * Geraete, Software und Schwachstellen (Asset-Register).
 *
 * Alles lesend, Scope devices:read.
 *
 * Anders als bei Berichten, Vorfaellen und Intranet verlangen diese Endpunkte
 * zusaetzlich die Rolle ADMIN — nicht nur ein Modulrecht. Ein Schluessel, dessen
 * Benutzer kein Admin ist, bekommt hier ueberall 403; einzig die Geraete eines
 * bestimmten Benutzers sind auch ohne Adminrolle abrufbar.
 *
 * Lizenzschluessel bleiben bewusst aussen vor. Sie stehen im Register, gehoeren
 * aber nicht in einen Chatverlauf — wer sie braucht, sieht sie in cflux.
 */

const day = (iso: string | null | undefined) =>
  typeof iso === 'string' ? iso.slice(0, 10) : null;

const person = (p: any) => (p ? `${p.firstName} ${p.lastName}` : null);

/** Kurzform fuer Listen; die Langfassung holt cflux_get_device. */
const summarize = (d: any) => ({
  id: d.id,
  name: d.name,
  kategorie: d.category ?? null,
  hersteller: d.manufacturer ?? null,
  modell: d.model ?? null,
  seriennummer: d.serialNumber ?? null,
  zugewiesenAn: person(d.user),
  aktiv: d.isActive !== false,
  garantieBis: day(d.warrantyUntil),
  // Nur ausgeben, wenn das Geraet ueberhaupt an Action1 haengt — sonst
  // sieht ein nie verbundenes Geraet aus wie ein ausgefallenes.
  ...(d.action1EndpointId
    ? {
        action1: {
          status: d.action1Status ?? null,
          zuletztGesehen: day(d.action1LastSeen),
          ip: d.action1IpAddress ?? null,
        },
      }
    : {}),
});

export const registerDeviceTools = (server: McpServer, client: CfluxClient) => {
  server.registerTool(
    'cflux_list_devices',
    {
      title: 'Geräte auflisten',
      description:
        'Listet das Geräteregister — Laptops, Handys, Tablets, PSA, Werkzeuge. Liefert je ' +
        'Gerät Kategorie, Hersteller, Seriennummer, den zugewiesenen Mitarbeiter und, falls ' +
        'über Action1 verbunden, dessen Status.\\n\\n' +
        'Braucht den Scope devices:read und einen Schlüssel, dessen Benutzer die Rolle ADMIN hat.',
      inputSchema: {
        suchbegriff: z
          .string()
          .optional()
          .describe('Nur Geräte, bei denen Name, Modell, Hersteller oder Seriennummer diesen Text enthält.'),
        kategorie: z
          .string()
          .optional()
          .describe('Nur diese Kategorie, z.B. "Laptop", "Handy", "Tablet", "PSA", "Werkzeug".'),
        mitarbeiter: z
          .string()
          .optional()
          .describe('Nur Geräte, deren zugewiesener Mitarbeiter so heisst (Teil des Namens genügt).'),
        nurNichtZugewiesen: z
          .boolean()
          .optional()
          .describe('Nur Geräte ohne Besitzer — nützlich, um freie Geräte für ein Onboarding zu finden.'),
        auchInaktive: z
          .boolean()
          .optional()
          .describe('Auch ausgemusterte Geräte zeigen. Vorgabe ist nur aktive.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ suchbegriff, kategorie, mitarbeiter, nurNichtZugewiesen, auchInaktive }) =>
      guard(async () => {
        // Die API bietet keine Filterparameter — es wird alles geladen und
        // hier gefiltert. Bei der Groessenordnung eines Geraeteregisters ist
        // das unproblematisch.
        const alle = await client.getJson<any[]>('/devices');
        let geraete = alle;

        if (!auchInaktive) {
          geraete = geraete.filter((d) => d.isActive !== false);
        }
        if (kategorie) {
          const needle = kategorie.toLowerCase();
          geraete = geraete.filter((d) => (d.category ?? '').toLowerCase().includes(needle));
        }
        if (mitarbeiter) {
          const needle = mitarbeiter.toLowerCase();
          geraete = geraete.filter((d) =>
            (person(d.user) ?? '').toLowerCase().includes(needle)
          );
        }
        if (nurNichtZugewiesen) {
          geraete = geraete.filter((d) => !d.userId);
        }
        if (suchbegriff) {
          const needle = suchbegriff.toLowerCase();
          geraete = geraete.filter((d) =>
            [d.name, d.model, d.manufacturer, d.serialNumber]
              .some((feld) => (feld ?? '').toLowerCase().includes(needle))
          );
        }

        if (!geraete.length) {
          return `Kein Gerät passt zu diesen Filtern (${alle.length} insgesamt im Register).`;
        }

        return asJson({
          gefunden: geraete.length,
          vonInsgesamt: alle.length,
          geraete: geraete.map(summarize),
        });
      })
  );

  server.registerTool(
    'cflux_get_device',
    {
      title: 'Gerät im Detail',
      description:
        'Lädt ein Gerät vollständig: Stammdaten, Zuweisung, installierte Software mit ' +
        'Lizenzangaben und Ablaufdaten, sowie die bekannten Schwachstellen aus Action1. ' +
        'Lizenzschlüssel werden nicht ausgegeben.\\n\\n' +
        'Braucht den Scope devices:read und die Rolle ADMIN.',
      inputSchema: {
        id: z.string().describe('Die ID des Geräts, wie von cflux_list_devices geliefert.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      guard(async () => {
        const pfad = `/devices/${encodeURIComponent(id)}`;
        const d = await client.getJson<any>(pfad);

        // Software und Schwachstellen haengen an eigenen Endpunkten. Fehlt dort
        // etwas, soll das Geraet trotzdem lesbar bleiben.
        const holen = async (unterpfad: string) => {
          try {
            return await client.getJson<any[]>(`${pfad}${unterpfad}`);
          } catch {
            return [];
          }
        };

        const [software, luecken] = await Promise.all([
          holen('/software'),
          holen('/vulnerabilities'),
        ]);

        return asJson({
          ...summarize(d),
          gekauft: day(d.purchaseDate),
          notizen: d.notes ?? null,
          software: software.map((s: any) => ({
            name: s.name,
            hersteller: s.vendor ?? null,
            art: s.type ?? null,
            version: s.version ?? null,
            lizenzart: s.licenseType ?? null,
            plaetze: s.seats ?? null,
            laeuftAb: day(s.expiryDate),
            herkunft: s.source ?? null,
          })),
          schwachstellen: luecken.map((v: any) => ({
            cve: v.cveId,
            bezeichnung: v.name ?? null,
            schweregrad: v.score ?? null,
            behebung: v.remediationStatus ?? null,
          })),
        });
      })
  );

  server.registerTool(
    'cflux_software_report',
    {
      title: 'Software über alle Geräte',
      description:
        'Aggregiert die installierte Software über das ganze Register: welche Software auf ' +
        'wie vielen Geräten läuft, mit Hersteller und den vorgefundenen Versionen. Gut für ' +
        'Lizenzabgleich und um Wildwuchs zu finden.\\n\\n' +
        'Braucht den Scope devices:read und die Rolle ADMIN.',
      inputSchema: {
        suchbegriff: z
          .string()
          .optional()
          .describe('Nur Einträge, deren Name oder Hersteller diesen Text enthält.'),
        mindestensAufGeraeten: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Nur Software, die auf mindestens so vielen Geräten läuft.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ suchbegriff, mindestensAufGeraeten }) =>
      guard(async () => {
        const alle = await client.getJson<any[]>('/devices/software/report');
        let zeilen = alle;

        if (suchbegriff) {
          const needle = suchbegriff.toLowerCase();
          zeilen = zeilen.filter((z: any) =>
            [z.name, z.vendor].some((feld) => (feld ?? '').toLowerCase().includes(needle))
          );
        }
        if (mindestensAufGeraeten) {
          zeilen = zeilen.filter((z: any) => Number(z.deviceCount) >= mindestensAufGeraeten);
        }

        if (!zeilen.length) {
          return `Keine Software passt (${alle.length} Einträge im Report).`;
        }

        return asJson(
          zeilen.map((z: any) => ({
            name: z.name,
            hersteller: z.vendor ?? null,
            art: z.type ?? null,
            aufGeraeten: Number(z.deviceCount),
            versionen: z.versions ?? [],
          }))
        );
      })
  );

  server.registerTool(
    'cflux_list_user_devices',
    {
      title: 'Geräte eines Mitarbeiters',
      description:
        'Listet die Geräte, die einem bestimmten Benutzer zugewiesen sind. Anders als die ' +
        'übrigen Werkzeuge dieses Moduls verlangt dieses **keine** Adminrolle — es genügt der ' +
        'Scope devices:read. Nützlich beim Ein- und Austritt eines Mitarbeiters.',
      inputSchema: {
        benutzerId: z.string().describe('Die Benutzer-ID, nicht der Name.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ benutzerId }) =>
      guard(async () => {
        const geraete = await client.getJson<any[]>(
          `/devices/user/${encodeURIComponent(benutzerId)}`
        );

        if (!geraete.length) {
          return 'Diesem Benutzer ist kein Gerät zugewiesen.';
        }

        // "zugewiesenAn" bliebe hier immer leer: dieser Endpunkt liefert die
        // Benutzer-Relation nicht mit. Ein null-Wert saehe aus wie "niemandem
        // zugewiesen" — dabei sind es per Definition die Geraete dieses Users.
        return asJson(
          geraete.map((d) => {
            const { zugewiesenAn, ...rest } = summarize(d);
            return rest;
          })
        );
      })
  );
};
