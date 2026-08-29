import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CfluxClient } from '../cflux.js';
import { asJson, guard, readLocalFile, saveFile } from './shared.js';

/**
 * Intranet-Dokumente.
 *
 * Lesen braucht intranet:read, alles Veraendernde intranet:write UND einen
 * Schluessel ohne Nur-Lesen.
 *
 * Der Freigabelauf eines Dokuments:
 *
 *   Entwurf --einreichen--> zur Prüfung --freigeben--> freigegeben --veröffentlichen--> sichtbar
 *      ▲                          |
 *      |                          +--ablehnen--> abgelehnt
 *      |                                              |
 *      +---------- zurück in den Entwurf -------------+
 *
 * Aus "abgelehnt" fuehrt kein Weg direkt zurueck ins Einreichen — erst
 * cflux_reopen_document macht wieder einen Entwurf daraus.
 *
 * Einreichen und Zurueckholen brauchen WRITE auf dem Dokument, Freigeben,
 * Ablehnen und Veroeffentlichen die Stufe ADMIN. Solange auf keinem Ordner
 * Rechte gesetzt sind, hat jeder mit dem Modul auch ADMIN — der Freigabelauf
 * wird also erst dann zur echten Kontrolle, wenn Gruppenrechte vergeben sind.
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

/** Die Bezeichnungen, die auch die Oberflaeche benutzt. */
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Entwurf',
  PENDING_REVIEW: 'Zur Prüfung eingereicht',
  APPROVED: 'Freigegeben',
  REJECTED: 'Abgelehnt',
  PUBLISHED: 'Veröffentlicht',
};

const statusLabel = (value: string | null | undefined) =>
  value ? (STATUS_LABEL[value] ?? value) : null;

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
          status: statusLabel(doc.approvalStatus),
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
            status: statusLabel(angelegt.approvalStatus),
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
    'cflux_upload_attachment',
    {
      title: 'Datei an ein Dokument hängen',
      description:
        'Lädt eine Datei vom eigenen Rechner hoch und hängt sie an ein Intranet-Dokument. ' +
        'Der Pfad muss auf diesem Rechner liegen und vollständig angegeben sein. ' +
        'Höchstens 100 MB. cflux erzeugt aus Office-Dateien und Bildern automatisch eine ' +
        'PDF-Vorschau.\n\n' +
        'Der Benutzer muss auf dem Dokument schreiben dürfen — bei einem geschützten Ordner ' +
        'entscheidet dessen Gruppenrecht. Braucht den Scope intranet:write und einen ' +
        'Schlüssel ohne Nur-Lesen.',
      inputSchema: {
        dokumentId: z.string().describe('ID des Dokuments, an das die Datei soll.'),
        dateipfad: z
          .string()
          .describe('Vollständiger Pfad der Datei auf diesem Rechner, z.B. C:\\Berichte\\Messung.pdf'),
        beschreibung: z.string().optional().describe('Optionale Erläuterung zum Anhang.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ dokumentId, dateipfad, beschreibung }) =>
      guard(async () => {
        const datei = readLocalFile(dateipfad);

        const angehaengt = await client.postFile<any>(
          `/intranet/${encodeURIComponent(dokumentId)}/attachments`,
          datei,
          beschreibung ? { description: beschreibung } : {}
        );

        const kb = Math.round(datei.bytes.length / 1024);
        return (
          `Anhang hochgeladen: ${datei.filename} (${kb} KB)\n\n` +
          asJson({
            id: angehaengt.id,
            name: angehaengt.originalFilename ?? datei.filename,
            typ: datei.contentType,
            version: angehaengt.version ?? null,
            dokumentId: angehaengt.documentNodeId ?? dokumentId,
          })
        );
      })
  );

  server.registerTool(
    'cflux_submit_document',
    {
      title: 'Dokument zur Freigabe einreichen',
      description:
        'Reicht einen Entwurf zur Prüfung ein und weist ihn einer Person zur Freigabe zu. ' +
        'Nur Entwürfe lassen sich einreichen. Danach steht das Dokument auf "Zur Prüfung ' +
        'eingereicht" und kann nur noch von einem Freigebenden weiterbewegt werden.\n\n' +
        'Braucht Schreibrecht auf dem Dokument, den Scope intranet:write und einen Schlüssel ' +
        'ohne Nur-Lesen.',
      inputSchema: {
        id: z.string().describe('ID des Dokuments.'),
        freigebenderBenutzerId: z
          .string()
          .optional()
          .describe('Wem die Freigabe zugewiesen wird. Ohne Angabe bleibt sie unzugewiesen.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ id, freigebenderBenutzerId }) =>
      guard(async () => {
        const doc = await client.postJson<any>(
          `/intranet/${encodeURIComponent(id)}/submit`,
          freigebenderBenutzerId ? { approverUserId: freigebenderBenutzerId } : {}
        );

        return `"${doc.title}" ist eingereicht — Status: ${statusLabel(doc.approvalStatus)}.`;
      })
  );

  server.registerTool(
    'cflux_review_document',
    {
      title: 'Dokument freigeben oder ablehnen',
      description:
        'Entscheidet über ein eingereichtes Dokument. Freigeben setzt es auf "Freigegeben" — ' +
        'sichtbar wird es erst mit cflux_publish_document. Ablehnen setzt es auf "Abgelehnt"; ' +
        'die Begründung sieht, wer es eingereicht hat.\n\n' +
        'Beides geht nur bei Dokumenten, die zur Prüfung eingereicht sind, und verlangt die ' +
        'Rechtestufe ADMIN auf dem Dokument. Braucht den Scope intranet:write und einen ' +
        'Schlüssel ohne Nur-Lesen.',
      inputSchema: {
        id: z.string().describe('ID des Dokuments.'),
        entscheidung: z
          .enum(['freigeben', 'ablehnen'])
          .describe('Was mit dem Dokument geschehen soll.'),
        begruendung: z
          .string()
          .optional()
          .describe('Grund der Ablehnung. Beim Ablehnen erwartet, beim Freigeben ohne Wirkung.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ id, entscheidung, begruendung }) =>
      guard(async () => {
        if (entscheidung === 'ablehnen' && !begruendung?.trim()) {
          // Eine Ablehnung ohne Grund hilft niemandem weiter.
          return 'Zum Ablehnen bitte eine Begründung angeben — sie ist das Einzige, woran sich der Verfasser orientieren kann.';
        }

        const pfad = entscheidung === 'freigeben' ? 'approve' : 'reject';
        const doc = await client.postJson<any>(
          `/intranet/${encodeURIComponent(id)}/${pfad}`,
          entscheidung === 'ablehnen' ? { reason: begruendung } : {}
        );

        return entscheidung === 'freigeben'
          ? `"${doc.title}" ist freigegeben. Zum Sichtbarmachen noch cflux_publish_document aufrufen.`
          : `"${doc.title}" wurde abgelehnt.`;
      })
  );

  server.registerTool(
    'cflux_reopen_document',
    {
      title: 'Dokument zurück in den Entwurf',
      description:
        'Holt ein abgelehntes oder eingereichtes Dokument zurück in den Entwurf, damit es ' +
        'überarbeitet werden kann. Ohne diesen Schritt lässt sich ein abgelehntes Dokument ' +
        'nicht erneut einreichen.\n\n' +
        'Braucht Schreibrecht auf dem Dokument, den Scope intranet:write und einen Schlüssel ' +
        'ohne Nur-Lesen.',
      inputSchema: {
        id: z.string().describe('ID des Dokuments.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ id }) =>
      guard(async () => {
        const doc = await client.postJson<any>(
          `/intranet/${encodeURIComponent(id)}/return-to-draft`,
          {}
        );
        return `"${doc.title}" ist wieder ein Entwurf und kann überarbeitet werden.`;
      })
  );

  server.registerTool(
    'cflux_publish_document',
    {
      title: 'Dokument veröffentlichen',
      description:
        'Veröffentlicht ein freigegebenes Dokument — erst damit ist es im Intranet sichtbar. ' +
        'Geht nur bei Dokumenten im Status "Freigegeben" und verlangt die Rechtestufe ADMIN. ' +
        'Braucht den Scope intranet:write und einen Schlüssel ohne Nur-Lesen.',
      inputSchema: {
        id: z.string().describe('ID des Dokuments.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ id }) =>
      guard(async () => {
        const doc = await client.postJson<any>(`/intranet/${encodeURIComponent(id)}/publish`, {});
        return `"${doc.title}" ist veröffentlicht.`;
      })
  );

  server.registerTool(
    'cflux_list_pending_approvals',
    {
      title: 'Eigene offene Freigaben',
      description:
        'Listet die Dokumente, die dem Benutzer des Schlüssels zur Freigabe zugewiesen sind ' +
        'und noch auf eine Entscheidung warten — älteste zuerst. Dokumente, die jemand ' +
        'anderem zugewiesen sind, erscheinen nicht. Braucht den Scope intranet:read.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      guard(async () => {
        const offen = await client.getJson<any[]>('/intranet/pending-approvals');

        if (!offen.length) {
          return 'Dir ist gerade nichts zur Freigabe zugewiesen.';
        }

        return asJson(
          offen.map((e: any) => ({
            id: e.document?.id ?? e.id,
            titel: e.document?.title ?? e.title,
            status: statusLabel(e.document?.approvalStatus),
            eingereichtVon: person(e.document?.createdBy ?? e.createdBy),
            // Der Zeitpunkt steckt im workflowInstance-Teil der Antwort.
            eingereichtAm: day(e.workflowInstance?.createdAt),
          }))
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
