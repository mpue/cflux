import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CfluxClient } from '../cflux.js';
import { asJson, guard, saveFile } from './shared.js';

/**
 * Intranet-Dokumente.
 *
 * Lesen braucht intranet:read, Anlegen intranet:write UND einen Schluessel
 * ohne Nur-Lesen.
 *
 * Was ein Schluessel hier sieht, entscheidet cflux — die Gruppenrechte werden
 * serverseitig ausgewertet und zwar fuer den Benutzer, zu dem der Schluessel
 * gehoert. Ein Ordnerrecht wirkt dabei fuer alles darin. Dieser Server filtert
 * nichts nach und koennte es auch nicht: er bekommt Gesperrtes gar nicht erst
 * zu Gesicht.
 */

/**
 * Benannte HTML-Entitaeten, die in deutschen Texten wirklich vorkommen.
 * Alles Numerische deckt der Aufloeser darunter ab.
 */
const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
  szlig: 'ß', euro: '€', deg: '°', sect: '§', copy: '©', reg: '®',
  ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»',
  bdquo: '„', ldquo: '“', rdquo: '”', sbquo: '‚', lsquo: '‘', rsquo: '’',
  times: '×', middot: '·', bull: '•',
};

const decodeEntities = (text: string): string =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    // &amp; zuletzt, sonst wuerde ein doppelt kodiertes &amp;ouml; falsch aufgehen.
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name] ?? whole);

/** HTML aus dem Editor in etwas verwandeln, das sich im Chat lesen laesst. */
const htmlToText = (html: string): string =>
  decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const day = (iso: string | null | undefined) =>
  typeof iso === 'string' ? iso.slice(0, 10) : null;

const person = (p: any) => (p ? `${p.firstName} ${p.lastName}` : null);

/**
 * Der Baum kommt verschachtelt; fuer die Ausgabe wird er zu einer Liste mit
 * Pfadangabe verflacht. Das liest sich im Chat besser als eingerueckter JSON
 * und macht die Zugehoerigkeit trotzdem sichtbar.
 */
interface FlatNode {
  id: string;
  titel: string;
  typ: string;
  pfad: string;
  geaendert: string | null;
}

const flatten = (nodes: any[], prefix: string[] = [], out: FlatNode[] = []): FlatNode[] => {
  for (const node of nodes) {
    out.push({
      id: node.id,
      titel: node.title,
      typ: node.type === 'FOLDER' ? 'Ordner' : 'Dokument',
      pfad: prefix.length ? prefix.join(' / ') : '(Wurzel)',
      geaendert: day(node.updatedAt),
    });
    if (node.children?.length) {
      flatten(node.children, [...prefix, node.title], out);
    }
  }
  return out;
};

export const registerIntranetTools = (server: McpServer, client: CfluxClient) => {
  server.registerTool(
    'cflux_list_documents',
    {
      title: 'Intranet-Dokumente auflisten',
      description:
        'Listet den Dokumentenbaum des Intranets — Ordner und Dokumente mit ihrem Pfad. ' +
        'Es erscheint nur, was der Benutzer sehen darf, zu dem der Schlüssel gehört. ' +
        'Für den Inhalt eines Dokuments cflux_get_document benutzen, für eine Volltextsuche ' +
        'cflux_search_intranet. Braucht den Scope intranet:read.',
      inputSchema: {
        suchbegriff: z
          .string()
          .optional()
          .describe('Optional: nur Einträge, deren Titel oder Pfad diesen Text enthält.'),
        nurOrdner: z.boolean().optional().describe('Nur Ordner zeigen, keine Dokumente.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ suchbegriff, nurOrdner }) =>
      guard(async () => {
        const tree = await client.getJson<any[]>('/intranet/tree');
        let flat = flatten(tree);
        const gesamt = flat.length;

        if (nurOrdner) {
          flat = flat.filter((n) => n.typ === 'Ordner');
        }
        if (suchbegriff) {
          const needle = suchbegriff.toLowerCase();
          flat = flat.filter(
            (n) =>
              n.titel.toLowerCase().includes(needle) || n.pfad.toLowerCase().includes(needle)
          );
        }

        if (!flat.length) {
          return gesamt
            ? `Kein Eintrag passt (${gesamt} sichtbar insgesamt).`
            : 'Keine Dokumente sichtbar. Entweder ist das Intranet leer, oder die Gruppenrechte geben nichts frei.';
        }

        return asJson(flat);
      })
  );

  server.registerTool(
    'cflux_get_document',
    {
      title: 'Intranet-Dokument lesen',
      description:
        'Lädt ein Intranet-Dokument mit seinem Inhalt. Der HTML-Inhalt wird zu lesbarem Text ' +
        'umgewandelt. Liefert ausserdem die Anhänge des Dokuments. Die ID stammt aus ' +
        'cflux_list_documents oder cflux_search_intranet. Braucht den Scope intranet:read.',
      inputSchema: {
        id: z.string().describe('Die ID des Dokuments.'),
        alsHtml: z
          .boolean()
          .optional()
          .describe('Den Inhalt als rohes HTML liefern statt als Text. Vorgabe ist Text.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id, alsHtml }) =>
      guard(async () => {
        const doc = await client.getJson<any>(`/intranet/${encodeURIComponent(id)}`);

        // Anhaenge liegen an einem eigenen Endpunkt; fehlt das Recht dafuer,
        // soll das Dokument trotzdem lesbar bleiben.
        let anhaenge: any[] = [];
        try {
          anhaenge = await client.getJson<any[]>(
            `/intranet/${encodeURIComponent(id)}/attachments`
          );
        } catch {
          anhaenge = [];
        }

        const inhalt = doc.content ?? '';

        return asJson({
          id: doc.id,
          titel: doc.title,
          typ: doc.type === 'FOLDER' ? 'Ordner' : 'Dokument',
          status: doc.approvalStatus ?? null,
          angelegtVon: person(doc.createdBy),
          geaendertVon: person(doc.updatedBy),
          geaendert: day(doc.updatedAt),
          veroeffentlicht: day(doc.publishedAt),
          inhalt: alsHtml ? inhalt : htmlToText(inhalt),
          externerLink: doc.externalUrl ?? null,
          anhaenge: anhaenge.map((a: any) => ({
            id: a.id,
            name: a.originalFilename ?? a.filename,
            groesse: a.fileSize ?? null,
            version: a.version ?? null,
          })),
          unterordner: (doc.children ?? []).map((c: any) => ({
            id: c.id,
            titel: c.title,
            typ: c.type === 'FOLDER' ? 'Ordner' : 'Dokument',
          })),
        });
      })
  );

  server.registerTool(
    'cflux_search_intranet',
    {
      title: 'Intranet durchsuchen',
      description:
        'Volltextsuche über Dokumente, Anhänge und frühere Versionen. Liefert Treffer mit ' +
        'Textausschnitt und Pfad, nach Relevanz sortiert. Gesperrte Dokumente tauchen nicht ' +
        'auf. Braucht den Scope intranet:read.',
      inputSchema: {
        suchbegriff: z.string().min(2).describe('Wonach gesucht wird, mindestens zwei Zeichen.'),
        art: z
          .enum(['node', 'attachment', 'version'])
          .optional()
          .describe('Auf eine Trefferart einschränken: Dokument, Anhang oder Version.'),
        anzahl: z.number().int().min(1).max(100).optional().describe('Höchstens so viele Treffer. Vorgabe 20.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ suchbegriff, art, anzahl }) =>
      guard(async () => {
        const query = new URLSearchParams({ q: suchbegriff, limit: String(anzahl ?? 20) });
        if (art) query.set('type', art);

        const antwort = await client.getJson<any>(`/intranet/search?${query}`);
        const treffer = antwort.results ?? [];

        if (!treffer.length) {
          return `Keine Treffer für "${suchbegriff}".`;
        }

        const ART: Record<string, string> = {
          node: 'Dokument',
          attachment: 'Anhang',
          version: 'Version',
        };

        return asJson({
          gesucht: antwort.query,
          treffer: antwort.total,
          gezeigt: treffer.length,
          ergebnisse: treffer.map((r: any) => ({
            art: ART[r.type] ?? r.type,
            id: r.type === 'attachment' ? r.metadata?.attachmentId : r.nodeId,
            dokumentId: r.nodeId,
            titel: r.title,
            pfad: Array.isArray(r.path) ? r.path.join(' / ') : null,
            ausschnitt: typeof r.snippet === 'string' ? htmlToText(r.snippet) : null,
          })),
        });
      })
  );

  server.registerTool(
    'cflux_create_document',
    {
      title: 'Intranet-Dokument anlegen',
      description:
        'Legt ein neues Dokument oder einen Ordner im Intranet an. Neue Dokumente starten ' +
        'immer als Entwurf und müssen in cflux freigegeben werden, bevor sie veröffentlicht ' +
        'sind — dieses Werkzeug veröffentlicht nichts.\n\n' +
        'Ohne Angabe eines Ordners landet der Eintrag auf der obersten Ebene. Wird ein Ordner ' +
        'angegeben, muss der Benutzer dort schreiben dürfen; die Gruppenrechte des Ordners ' +
        'gelten anschliessend auch für das neue Dokument.\n\n' +
        'Braucht den Scope intranet:write und einen Schlüssel, der nicht auf Nur-Lesen steht.',
      inputSchema: {
        titel: z.string().min(1).describe('Titel des Dokuments oder Ordners.'),
        inhalt: z
          .string()
          .optional()
          .describe(
            'Der Text des Dokuments. Einfaches HTML ist erlaubt (<p>, <h2>, <ul>, <strong>). ' +
              'Wird nichts angegeben, entsteht ein leeres Dokument. Bei einem Ordner ohne Bedeutung.'
          ),
        ordnerId: z
          .string()
          .optional()
          .describe(
            'ID des Ordners, in den es soll — aus cflux_list_documents mit nurOrdner. ' +
              'Ohne Angabe auf oberster Ebene.'
          ),
        alsOrdner: z
          .boolean()
          .optional()
          .describe('true legt einen Ordner an statt eines Dokuments. Vorgabe ist Dokument.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ titel, inhalt, ordnerId, alsOrdner }) =>
      guard(async () => {
        const angelegt = await client.postJson<any>('/intranet', {
          title: titel,
          type: alsOrdner ? 'FOLDER' : 'DOCUMENT',
          parentId: ordnerId,
          content: alsOrdner ? '' : (inhalt ?? ''),
        });

        const was = alsOrdner ? 'Ordner' : 'Dokument';

        return (
          `${was} angelegt: ${angelegt.title}\n\n` +
          asJson({
            id: angelegt.id,
            titel: angelegt.title,
            typ: was,
            status: angelegt.approvalStatus ?? null,
            ordnerId: angelegt.parentId ?? null,
          }) +
          (alsOrdner
            ? ''
            : '\n\nDer Eintrag ist ein Entwurf. Zum Veröffentlichen in cflux unter ' +
              'Intranet freigeben.')
        );
      })
  );

  server.registerTool(
    'cflux_download_attachment',
    {
      title: 'Intranet-Anhang speichern',
      description:
        'Lädt einen Anhang eines Intranet-Dokuments herunter und legt ihn lokal ab. Gibt den ' +
        'Dateipfad zurück, nicht die Datei selbst. Die Anhang-ID stammt aus cflux_get_document ' +
        'oder aus einem Suchtreffer der Art "Anhang". Braucht den Scope intranet:read.',
      inputSchema: {
        anhangId: z.string().describe('Die ID des Anhangs.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ anhangId }) =>
      guard(() =>
        saveFile(
          client,
          `/intranet/attachments/${encodeURIComponent(anhangId)}/download`,
          `anhang_${anhangId}`
        )
      )
  );
};
