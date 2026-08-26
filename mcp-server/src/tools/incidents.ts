import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CfluxClient } from '../cflux.js';
import { asJson, guard, savePdf } from './shared.js';

/**
 * Vorfaelle (Incidents), inklusive der EHS-Felder.
 *
 * Alles lesend — schreibende Werkzeuge waeren ein eigener Schritt und wuerden
 * einen Schluessel ohne Nur-Lesen voraussetzen.
 *
 * Braucht den Scope incidents:read.
 */

const STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
const PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

/** Die Bezeichnungen, die auch die Oberflaeche benutzt. */
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

const EHS_CATEGORY_LABEL: Record<string, string> = {
  UNSAFE_CONDITION: 'Unsicherer Zustand',
  UNSAFE_BEHAVIOR: 'Unsicheres Verhalten',
  NEAR_MISS: 'Beinahe-Unfall',
  FIRST_AID: 'Erste Hilfe',
  RECORDABLE: 'Meldepflichtiger Unfall',
  LTI: 'Lost Time Injury',
  FATALITY: 'Todesfall',
  PROPERTY_DAMAGE: 'Sachschaden',
  ENVIRONMENT: 'Umweltvorfall',
  SAFETY_OBSERVATION: 'Sicherheitsbeobachtung',
};

const label = (map: Record<string, string>, value: string | null | undefined) =>
  value ? (map[value] ?? value) : null;

const day = (iso: string | null | undefined) =>
  typeof iso === 'string' ? iso.slice(0, 10) : null;

const person = (p: any) => (p ? `${p.firstName} ${p.lastName}` : null);

/** `tags` liegt als JSON-Zeichenkette in der Datenbank. */
const parseTags = (tags: unknown): string[] => {
  if (typeof tags !== 'string' || !tags.trim()) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

/** Kurzform fuer Listen — die Langfassung holt cflux_get_incident. */
const summarize = (i: any) => ({
  id: i.id,
  nummer: i.incidentNumber ?? null,
  titel: i.title,
  status: label(STATUS_LABEL, i.status),
  prioritaet: label(PRIORITY_LABEL, i.priority),
  gemeldetAm: day(i.reportedAt),
  vorfallDatum: day(i.incidentDate),
  faellig: day(i.dueDate),
  zugewiesenAn: person(i.assignedTo),
  projekt: i.project?.name ?? null,
  kategorie: i.category ?? null,
  ehsRelevant: Boolean(i.isEHSRelevant),
  ehsKategorie: label(EHS_CATEGORY_LABEL, i.ehsCategory),
});

export const registerIncidentTools = (server: McpServer, client: CfluxClient) => {
  server.registerTool(
    'cflux_list_incidents',
    {
      title: 'Vorfälle auflisten',
      description:
        'Listet Vorfälle (Incidents) auf — Störungen, Sicherheitsvorfälle, EHS-Meldungen. ' +
        'Ohne Filter kommen alle sichtbaren. Die Filter lassen sich kombinieren. ' +
        'Für die Langfassung eines einzelnen Vorfalls cflux_get_incident benutzen. ' +
        'Braucht den Scope incidents:read.',
      inputSchema: {
        status: z.enum(STATUS).optional().describe('Nur Vorfälle in diesem Status.'),
        prioritaet: z.enum(PRIORITY).optional().describe('Nur Vorfälle mit dieser Priorität.'),
        jahr: z
          .number()
          .int()
          .optional()
          .describe('Nur Vorfälle aus diesem Jahr (nach Vorfalldatum, ersatzweise Meldedatum).'),
        projekt: z
          .string()
          .optional()
          .describe('Nur Vorfälle, deren Projektname diesen Text enthält (ohne Groß-/Kleinschreibung).'),
        nurEhs: z
          .boolean()
          .optional()
          .describe('Nur als EHS-relevant markierte Vorfälle (Arbeitssicherheit, Umwelt, Gesundheit).'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ status, prioritaet, jahr, projekt, nurEhs }) =>
      guard(async () => {
        // Status, Prioritaet und Jahr filtert das Backend; Projekt und EHS
        // danach hier, weil die API dafuer keine Parameter anbietet.
        const query = new URLSearchParams();
        if (status) query.set('status', status);
        if (prioritaet) query.set('priority', prioritaet);
        if (jahr) query.set('year', String(jahr));

        const suffix = query.toString() ? `?${query}` : '';
        let incidents = await client.getJson<any[]>(`/incidents${suffix}`);

        const gesamt = incidents.length;

        if (projekt) {
          const needle = projekt.toLowerCase();
          incidents = incidents.filter((i) =>
            (i.project?.name ?? '').toLowerCase().includes(needle)
          );
        }
        if (nurEhs) {
          incidents = incidents.filter((i) => i.isEHSRelevant);
        }

        if (!incidents.length) {
          return gesamt
            ? `Kein Vorfall passt zu diesen Filtern (${gesamt} vor der Filterung nach Projekt/EHS).`
            : 'Keine Vorfälle gefunden.';
        }

        return asJson(incidents.map(summarize));
      })
  );

  server.registerTool(
    'cflux_get_incident',
    {
      title: 'Vorfall im Detail',
      description:
        'Lädt einen Vorfall vollständig: Beschreibung, Lösung, Notizen, Korrektur- und ' +
        'Präventivmaßnahmen, Kommentare und — falls EHS-relevant — Schweregrad, Ausfalltage, ' +
        'medizinische Behandlung und Arbeitskontext. Die ID stammt aus cflux_list_incidents. ' +
        'Braucht den Scope incidents:read.',
      inputSchema: {
        id: z.string().describe('Die ID des Vorfalls, wie von cflux_list_incidents geliefert.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      guard(async () => {
        const i = await client.getJson<any>(`/incidents/${encodeURIComponent(id)}`);

        return asJson({
          ...summarize(i),
          gemeldetVon: person(i.reportedBy),
          beschreibung: i.description,
          betroffenesSystem: i.affectedSystem ?? null,
          ort: i.location ?? null,
          geloestAm: day(i.resolvedAt),
          geschlossenAm: day(i.closedAt),
          loesung: i.solution ?? null,
          notizen: i.notes ?? null,
          korrekturmassnahmen: i.correctiveActions ?? null,
          praeventivmassnahmen: i.preventiveActions ?? null,
          schlagworte: parseTags(i.tags),
          // Nur ausgeben, wenn es fachlich etwas heisst — sonst suggerieren
          // Nullwerte, es sei geprueft und verneint worden.
          ...(i.isEHSRelevant
            ? {
                ehs: {
                  schweregrad: i.ehsSeverity ?? null,
                  ausfalltage: i.lostWorkDays ?? null,
                  medizinischeBehandlung: Boolean(i.medicalTreatment),
                  krankenhaus: Boolean(i.hospitalRequired),
                  arbeiterAmTag: i.workersOnDay ?? null,
                  stundenAmTag: i.hoursWorkedDay ?? null,
                },
              }
            : {}),
          kommentare: (i.comments ?? []).map((c: any) => ({
            von: person(c.user),
            am: c.createdAt ?? null,
            text: c.comment,
          })),
          anhaenge: (i.attachments ?? []).map((a: any) => ({
            name: a.originalFilename ?? a.filename,
            groesse: a.fileSize ?? null,
          })),
        });
      })
  );

  server.registerTool(
    'cflux_incident_statistics',
    {
      title: 'Kennzahlen zu Vorfällen',
      description:
        'Liefert die Zählwerte über alle Vorfälle: gesamt, offen, in Bearbeitung, gelöst, ' +
        'sowie die Anzahl kritischer und hoch priorisierter. Gut für einen schnellen ' +
        'Überblick, ohne die ganze Liste zu laden. Braucht den Scope incidents:read.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      guard(async () => {
        const s = await client.getJson<any>('/incidents/statistics');

        return asJson({
          gesamt: s.total,
          offen: s.open,
          inBearbeitung: s.inProgress,
          geloest: s.resolved,
          kritisch: s.critical,
          hoch: s.high,
        });
      })
  );

  server.registerTool(
    'cflux_export_incident_pdf',
    {
      title: 'Vorfall als PDF speichern',
      description:
        'Lädt einen einzelnen Vorfall als PDF herunter und legt ihn lokal ab. Gibt den ' +
        'Dateipfad zurück, nicht die Datei selbst. Braucht den Scope incidents:read.',
      inputSchema: {
        id: z.string().describe('Die ID des Vorfalls, wie von cflux_list_incidents geliefert.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      guard(() =>
        savePdf(client, `/incidents/${encodeURIComponent(id)}/pdf`, `vorfall_${id}.pdf`)
      )
  );
};
