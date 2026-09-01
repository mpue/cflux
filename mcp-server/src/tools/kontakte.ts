import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CfluxClient } from '../cflux.js';
import { CfluxError } from '../cflux.js';
import { asJson, guard } from './shared.js';

/**
 * Kontakte und Kontaktgruppen (Adressbuch).
 *
 * Lesen braucht contacts:read, Anlegen contacts:write und einen Schluessel
 * ohne das Kennzeichen Nur-Lesen.
 *
 * Was ein Schluessel sieht, entscheidet cflux ueber die Kontaktgruppen: ein
 * Kontakt ist sichtbar, wenn seine Gruppe fuer eine Benutzergruppe des
 * Schluesselinhabers freigegeben ist — oder wenn er gar keiner Gruppe angehoert.
 * Gefiltert wird serverseitig; hier kommt nur an, was ohnehin erlaubt ist.
 *
 * Im Adressbuch stehen nicht nur Geschaeftskontakte: ueber die
 * Mitarbeiter-Synchronisation landen auch Personalien samt Privatanschrift
 * darin, erkennbar an der Kategorie "Intern" und an herkunft="Mitarbeiterstamm".
 * Deshalb bleibt die Anschrift der Kurzfassung fern und steht erst im Detail.
 */

const name = (k: any) => `${k.firstName} ${k.lastName}`.trim();

/** Kurzfassung fuer Listen: genug, um jemanden zu erreichen. */
const kurz = (k: any) => ({
  id: k.id,
  name: name(k),
  firma: k.company ?? null,
  funktion: k.position ?? null,
  email: k.email ?? null,
  telefon: k.phone ?? null,
  mobil: k.mobile ?? null,
  ort: k.city ?? null,
  kategorie: k.category ?? null,
  gruppe: k.contactGroup?.name ?? null,
  ...(k.isActive === false ? { aktiv: false } : {}),
});

const felder = (k: any) =>
  [k.firstName, k.lastName, k.company, k.position, k.email, k.phone, k.mobile, k.city, k.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const registerKontaktTools = (server: McpServer, client: CfluxClient) => {
  server.registerTool(
    'cflux_search_contacts',
    {
      title: 'Kontakte suchen',
      description:
        'Durchsucht das Adressbuch nach Name, Firma, Funktion, E-Mail, Telefon, Ort oder ' +
        'Kategorie und liefert die Treffer mit ihren Erreichbarkeiten. Ohne Suchbegriff kommt ' +
        'das ganze sichtbare Adressbuch.\n\n' +
        'Sichtbar ist, was die Kontaktgruppen für den Benutzer hinter dem Schlüssel freigeben. ' +
        'Braucht den Scope contacts:read.',
      inputSchema: {
        suchbegriff: z
          .string()
          .optional()
          .describe('Text, der in Name, Firma, Funktion, E-Mail, Telefon, Ort oder Kategorie vorkommen soll.'),
        kategorie: z
          .string()
          .optional()
          .describe('Nur diese Kategorie, z.B. "Kunde", "Lieferant", "Partner", "Intern".'),
        gruppe: z
          .string()
          .optional()
          .describe('Nur Kontakte dieser Kontaktgruppe (Teil des Gruppennamens genügt).'),
        auchInaktive: z
          .boolean()
          .optional()
          .describe('Auch stillgelegte Kontakte zeigen. Vorgabe ist nur aktive.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ suchbegriff, kategorie, gruppe, auchInaktive }) =>
      guard(async () => {
        // Die API kennt keine Filterparameter — geladen wird alles Sichtbare,
        // gefiltert wird hier. Fuer ein Adressbuch ist das unproblematisch.
        const alle = await client.getJson<any[]>('/contacts');
        let treffer = alle;

        if (!auchInaktive) {
          treffer = treffer.filter((k) => k.isActive !== false);
        }
        if (kategorie) {
          const n = kategorie.toLowerCase();
          treffer = treffer.filter((k) => (k.category ?? '').toLowerCase().includes(n));
        }
        if (gruppe) {
          const n = gruppe.toLowerCase();
          treffer = treffer.filter((k) => (k.contactGroup?.name ?? '').toLowerCase().includes(n));
        }
        if (suchbegriff) {
          const n = suchbegriff.toLowerCase();
          treffer = treffer.filter((k) => felder(k).includes(n));
        }

        if (!treffer.length) {
          return (
            `Kein Kontakt passt zu diesen Angaben (${alle.length} im sichtbaren Adressbuch). ` +
            'Möglicherweise gehört der Gesuchte zu einer Kontaktgruppe, die für diesen ' +
            'Benutzer nicht freigegeben ist — dann taucht er hier gar nicht erst auf.'
          );
        }

        return asJson({
          gefunden: treffer.length,
          vonSichtbaren: alle.length,
          kontakte: treffer
            .sort((a, b) => name(a).localeCompare(name(b), 'de'))
            .map(kurz),
        });
      })
  );

  server.registerTool(
    'cflux_get_contact',
    {
      title: 'Kontakt im Detail',
      description:
        'Lädt einen Kontakt vollständig: Erreichbarkeiten, Anschrift, Kategorie, Notizen und ' +
        'die Kontaktgruppe samt der Benutzergruppen, für die sie freigegeben ist.\n\n' +
        'Braucht den Scope contacts:read. Ist der Kontakt für diesen Benutzer nicht sichtbar, ' +
        'antwortet cflux wie bei einem unbekannten Kontakt.',
      inputSchema: {
        id: z.string().describe('Die ID des Kontakts, wie von cflux_search_contacts geliefert.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) =>
      guard(async () => {
        const k = await client.getJson<any>(`/contacts/${encodeURIComponent(id)}`);

        return asJson({
          ...kurz(k),
          anschrift: {
            strasse: k.street ?? null,
            plz: k.zipCode ?? null,
            ort: k.city ?? null,
            land: k.country ?? null,
          },
          notizen: k.notes ?? null,
          aktiv: k.isActive !== false,
          // Aus dem Mitarbeiterstamm synchronisierte Kontakte tragen
          // Personalien — beim Weiterreichen ein Unterschied ums Ganze.
          herkunft: k.employeeId ? 'Mitarbeiterstamm' : 'manuell erfasst',
          gruppeSichtbarFuer:
            k.contactGroup?.visibleToGroups?.map((g: any) => g.name) ??
            (k.contactGroup ? [] : null),
        });
      })
  );

  server.registerTool(
    'cflux_list_contact_groups',
    {
      title: 'Kontaktgruppen auflisten',
      description:
        'Listet die Kontaktgruppen des Adressbuchs mit den Benutzergruppen, für die sie ' +
        'freigegeben sind. Nützlich, um vor dem Anlegen die richtige Gruppe zu wählen, und ' +
        'um zu verstehen, warum ein Kontakt nicht auffindbar ist.\n\n' +
        'Braucht den Scope contacts:read.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () =>
      guard(async () => {
        const gruppen = await client.getJson<any[]>('/contacts/groups');

        if (!gruppen.length) {
          return 'Es gibt keine Kontaktgruppen. Kontakte ohne Gruppe sind für alle sichtbar.';
        }

        return asJson(
          gruppen.map((g) => ({
            id: g.id,
            name: g.name,
            beschreibung: g.description ?? null,
            aktiv: g.isActive !== false,
            sichtbarFuer: (g.visibleToGroups ?? []).map((u: any) => u.name),
          }))
        );
      })
  );

  server.registerTool(
    'cflux_create_contact',
    {
      title: 'Kontakt anlegen',
      description:
        'Legt einen neuen Kontakt im Adressbuch an. Vor- und Nachname sind Pflicht, alles ' +
        'Weitere ist freiwillig.\n\n' +
        'Braucht den Scope contacts:write, einen Schlüssel **ohne** das Kennzeichen Nur-Lesen ' +
        'und das Recht "Anlegen" am Modul Kontakte. Fehlt eines davon, sagt die Antwort welches.\n\n' +
        'Ohne Gruppe ist der Kontakt für alle sichtbar — wer ihn einschränken will, gibt eine ' +
        'Gruppe an; cflux_list_contact_groups zeigt die vorhandenen.',
      inputSchema: {
        vorname: z.string().describe('Vorname. Pflichtangabe.'),
        nachname: z.string().describe('Nachname. Pflichtangabe.'),
        firma: z.string().optional().describe('Firma oder Organisation.'),
        funktion: z.string().optional().describe('Position oder Rolle, z.B. "Einkauf".'),
        email: z.string().optional().describe('E-Mail-Adresse.'),
        telefon: z.string().optional().describe('Festnetznummer.'),
        mobil: z.string().optional().describe('Mobilnummer.'),
        strasse: z.string().optional().describe('Strasse und Hausnummer.'),
        plz: z.string().optional().describe('Postleitzahl.'),
        ort: z.string().optional().describe('Ort.'),
        land: z.string().optional().describe('Land.'),
        kategorie: z
          .string()
          .optional()
          .describe('Einordnung, z.B. "Kunde", "Lieferant", "Partner".'),
        notizen: z.string().optional().describe('Freitext zum Kontakt.'),
        gruppe: z
          .string()
          .optional()
          .describe('Name der Kontaktgruppe. Ohne Angabe ist der Kontakt für alle sichtbar.'),
      },
      annotations: { readOnlyHint: false },
    },
    async (eingabe) =>
      guard(async () => {
        let contactGroupId: string | undefined;

        // Im Chat nennt niemand eine UUID. Der Gruppenname wird deshalb hier
        // aufgeloest — und bei Mehrdeutigkeit lieber nachgefragt als geraten,
        // denn die Gruppe entscheidet, wer den Kontakt spaeter sieht.
        if (eingabe.gruppe) {
          const gruppen = await client.getJson<any[]>('/contacts/groups');
          const n = eingabe.gruppe.toLowerCase();
          const genau = gruppen.filter((g) => g.name.toLowerCase() === n);
          const teil = gruppen.filter((g) => g.name.toLowerCase().includes(n));
          const passend = genau.length ? genau : teil;

          if (!passend.length) {
            throw new CfluxError(
              `Es gibt keine Kontaktgruppe "${eingabe.gruppe}". Vorhanden sind: ` +
                (gruppen.map((g) => g.name).join(', ') || '(keine)') +
                '. Ohne Gruppe angelegt wäre der Kontakt für alle sichtbar.'
            );
          }
          if (passend.length > 1) {
            throw new CfluxError(
              `"${eingabe.gruppe}" passt auf mehrere Kontaktgruppen: ` +
                passend.map((g) => g.name).join(', ') +
                '. Bitte den vollständigen Namen angeben — die Gruppe entscheidet, ' +
                'wer den Kontakt später sehen darf.'
            );
          }
          contactGroupId = passend[0].id;
        }

        const angelegt = await client.postJson<any>('/contacts', {
          firstName: eingabe.vorname,
          lastName: eingabe.nachname,
          company: eingabe.firma,
          position: eingabe.funktion,
          email: eingabe.email,
          phone: eingabe.telefon,
          mobile: eingabe.mobil,
          street: eingabe.strasse,
          zipCode: eingabe.plz,
          city: eingabe.ort,
          country: eingabe.land,
          category: eingabe.kategorie,
          notes: eingabe.notizen,
          contactGroupId,
        });

        const sichtbar = angelegt.contactGroup
          ? `Sichtbar für: ${
              (angelegt.contactGroup.visibleToGroups ?? [])
                .map((g: any) => g.name)
                .join(', ') || 'niemanden — der Gruppe ist keine Benutzergruppe zugeordnet'
            }.`
          : 'Ohne Kontaktgruppe angelegt und damit für alle sichtbar.';

        return `Kontakt angelegt: ${name(angelegt)} (ID ${angelegt.id}). ${sichtbar}`;
      })
  );
};
