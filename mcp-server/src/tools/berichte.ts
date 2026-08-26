import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CfluxClient } from '../cflux.js';
import { asJson, guard, savePdf } from './shared.js';

/**
 * Rundgangsberichte (Toolbox-Rundgang / Tagesprotokoll).
 *
 * Alles lesend. Braucht den Scope berichte:read.
 */

export const registerBerichtTools = (server: McpServer, client: CfluxClient) => {
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
      guard(() =>
        savePdf(client, `/berichte/${encodeURIComponent(id)}/export.pdf`, `bericht_${id}.pdf`)
      )
  );
};
