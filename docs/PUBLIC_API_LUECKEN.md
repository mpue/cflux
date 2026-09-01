# Offene Punkte der Public API

Stand 1. September 2026, erhoben auf `main`. Zahlen nach der Freigabe der
Kontakte (317 freigegebene Endpunkte). Die Architektur steht
in [`PUBLIC_API.md`](PUBLIC_API.md), das vollständige Endpunktverzeichnis in
[`PUBLIC_API_ENDPUNKTE.md`](PUBLIC_API_ENDPUNKTE.md).

Zwölf Punkte, nach Gewicht sortiert. Die ersten drei sind Sicherheitsthemen,
die nächsten fünf Inkonsistenzen und Reichweite, die letzten vier Betrieb und
Qualität.

---

## 1. Die Modulrechte werden fast nirgends geprüft

`requireModuleAccess` steht in 10 der 55 Routen-Dateien, davon sind nur **fünf
überhaupt freigegeben**: `berichte`, `checklists`, `contacts`,
`project-reports` und `project-tasks`. Auf Endpunktebene sind das 45 von 317
freigegebenen — bei den übrigen 272 entscheiden allein Freigabeliste, Scope
und, wo vorhanden, die Rolle `ADMIN`.

Konkret hängen `POST /api/orders` und `POST /api/inventory` nur an
`authenticate`. Ein Schlüssel mit `orders:write` schreibt dort, unabhängig
davon, welche Modulrechte sein Benutzer hat.

Das ist app-weit so und gilt genauso im Browser — die Public API erbt es nur.
`PUBLIC_API.md` beschreibt aber eine Schranke, die in 86 % der Fälle nicht
greift. Entweder wird die Middleware flächendeckend nachgezogen, oder die
Beschreibung wird ehrlich.

## 2. Keine Ratenbegrenzung

Ein Schlüssel darf beliebig oft anfragen; weder pro Schlüssel noch pro IP gibt
es eine Drosselung. Ein Client in einer Schleife oder ein abhandengekommener
Schlüssel kann die Instanz ungebremst belasten.

## 3. Keine Zugriffsprotokollierung

Festgehalten wird nur `lastUsedAt`, und das gedrosselt auf höchstens einen
Schreibvorgang pro 60 Sekunden (`services/apiKey.service.ts`). Welche Pfade ein
Schlüssel abgerufen hat, steht nirgends.

Nach einem Vorfall lässt sich damit nicht rekonstruieren, was abgeflossen ist —
für eine Meldung nach Art. 33 DSGVO genau die fehlende Angabe.

## 4. Die Intranet-Gruppenrechte sind noch nirgends gesetzt

Bei der letzten Prüfung der Produktivdaten war auf keinem der 122 Dokumente und
18 Ordner ein Gruppenrecht vergeben. Solange das so ist, läuft die Prüfung in
`services/documentAccess.service.ts` bis zur Wurzel, findet nichts und lässt
durch: **jeder mit dem Intranet-Modul erfüllt damit auch die Stufe `ADMIN`.**

Damit ist auch der Freigabelauf zurzeit kein Kontrollmechanismus, sondern nur
ein Ablauf. Zusätzlich hat die Gruppe *Standard Benutzer* (9 Mitglieder)
`canEdit` auf dem Intranet-Modul.

Die Mechanik ist gebaut und getestet — sie wartet nur darauf, dass jemand die
Rechte tatsächlich vergibt.

## 5. Zwei Module verlangen die Rolle statt des Rechts

`/api/devices` schützt 22 von 23 Endpunkten mit `authorize('ADMIN')`,
`/api/reports` 12 von 14. Der Scope `devices:read` verspricht also Zugang, den
ein Nicht-Administrator nicht bekommt.

Bei den Geräten ist das inzwischen abgefangen: der MCP-Client erklärt den Fall
im Klartext, und `--selftest` wertet ihn als Hinweis statt als Defekt. Bei
`reports` steht das noch aus. Die eigentliche Frage bleibt offen — soll das
Geräteregister Adminsache sein, oder gehört es an ein Modulrecht?

## 6. Die Kontaktgruppen verraten mehr, als sie sollten

`GET /api/contacts/groups` liefert **alle** Kontaktgruppen samt der Liste, für
welche Benutzergruppen sie sichtbar sind — ungefiltert, für jeden
authentifizierten Benutzer. Die Kontakte darin sind sauber gefiltert
(`buildVisibilityWhere` in `controllers/contact.controller.ts`), die
Gruppennamen und ihre Zuordnung aber nicht.

Praktisch heisst das: wer nur `contacts:read` hat, erfährt, dass es eine Gruppe
*Interne Personalien* gibt und dass sie der Geschäftsleitung vorbehalten ist —
ohne einen einzigen Kontakt daraus sehen zu können.

Das ist bestehendes Verhalten und im Browser genauso; die Freigabe hat es nicht
verursacht, nur sichtbarer gemacht. Ob es sich filtern lässt, hängt daran, ob
die Oberfläche die vollständige Liste für die Gruppenauswahl beim Anlegen
braucht.

## 7. 20 von 25 freigegebenen Modulen haben keine MCP-Werkzeuge

Über HTTP erreichbar, in Claude aber unsichtbar: Aufträge, Kunden,
Lieferanten, Rechnungen, Zeiterfassung, Abwesenheiten, Checklisten, Projekte,
Lager, Reisekosten und weitere.

Auf Endpunktebene: 31 von 317 freigegebenen Endpunkten haben ein Werkzeug,
286 nicht. Auch in den fünf angebundenen Modulen ist die Abdeckung dünn —
bei den Geräten 6 von 23, beim Intranet 12 von 44, bei den Kontakten 4 von 10.

Jedes weitere Modul ist eine Datei unter `mcp-server/src/tools/` plus ein
Eintrag in `index.ts`; der Aufwand liegt im Entwerfen der Werkzeuge, nicht in
der Anbindung.

## 8. Schreiben ist die Ausnahme

Über MCP schreiben lässt sich nur zweierlei: einen Vorfall melden und
Intranet-Dokumente anlegen, anhängen und durch die Freigabe führen. Geräte
zuweisen, Aufträge anlegen, Zeiten buchen — alles nur lesend.

## 9. Keine Paginierung

Die API bietet für die angebundenen Module keine Filter- oder Seitenparameter.
Die MCP-Werkzeuge laden deshalb jeweils den ganzen Bestand und filtern lokal.

Bei der heutigen Größenordnung unproblematisch. Ab einigen tausend Datensätzen
pro Modul wird es das nicht bleiben.

## 10. Keine maschinenlesbare Beschreibung

Es gibt kein OpenAPI-Dokument. Wer etwas anderes als den MCP-Client anbinden
will, muss die Routen im Quelltext nachlesen —
[`PUBLIC_API_ENDPUNKTE.md`](PUBLIC_API_ENDPUNKTE.md) hilft beim Suchen, ersetzt
aber kein Schema.

## 11. Der MCP-Server hat keine Tests

Das Backend deckt die Zugangslogik mit 45 Testfällen ab (`apiScope.test.ts` und
`auth.middleware.test.ts`). Für die 28 MCP-Werkzeuge gibt es keinen einzigen
automatisierten Test; geprüft wird von Hand gegen eine Wegwerf-Instanz.

Genau die Feldzuordnungen, die dabei wiederholt falsch waren — `reason` statt
`rejectionReason`, der Zeitstempel aus `workflowInstance` statt aus dem
Dokument — würde ein Test sofort fangen.

## 12. Kein Ablauf, keine Rotation

`expiresAt` ist optional und wird in der Praxis nicht gesetzt. Es gibt keine
Erinnerung vor Ablauf, keinen Rotationsablauf und keine Übersicht über
Schlüssel, die seit Monaten unbenutzt sind — obwohl `lastUsedAt` die Angabe
dafür hätte.
