#!/usr/bin/env bash
##############################################################################
# update-screenshots-and-docs.sh
#
# Automatisierungsskript für cflux:
#   1. Playwright Screenshot-Tests ausführen (kickstart-screenshots.spec.ts)
#   2. Screenshots in web/kickstart kopieren (passiert bereits im Test)
#   3. Website (presentation.html) mit aktuellen Screenshots aktualisieren
#   4. Handbuch (CFLUX-HANDBUCH.md) und Executive Summary aktualisieren
#
# Verwendung:
#   chmod +x scripts/update-screenshots-and-docs.sh
#   ./scripts/update-screenshots-and-docs.sh
#
# Voraussetzungen:
#   - Docker-Container laufen (docker-compose up -d)
#   - Node.js / pnpm installiert
#   - Playwright installiert (npx playwright install)
##############################################################################

set -euo pipefail

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verzeichnisse
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KICKSTART_DIR="$PROJECT_ROOT/web/kickstart"
DOCS_DIR="$PROJECT_ROOT/docs"
WEB_DIR="$PROJECT_ROOT/web"

# Datum
TODAY=$(date +"%d. %B %Y" | sed 's/January/Januar/;s/February/Februar/;s/March/März/;s/April/April/;s/May/Mai/;s/June/Juni/;s/July/Juli/;s/August/August/;s/September/September/;s/October/Oktober/;s/November/November/;s/December/Dezember/')
TODAY_ISO=$(date +"%Y-%m-%d")

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     cflux Screenshot & Dokumentation Update                 ║${NC}"
echo -e "${CYAN}║     $(date '+%d.%m.%Y %H:%M:%S')                                       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_ROOT"

##############################################################################
# Phase 1: Playwright Screenshot-Tests ausführen
##############################################################################
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 1: Playwright Screenshot-Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Sicherstellen, dass das Zielverzeichnis existiert
mkdir -p "$KICKSTART_DIR"

echo -e "${YELLOW}▶ Starte Playwright kickstart-screenshots Tests (Chromium)...${NC}"
if npx playwright test e2e/tests/kickstart-screenshots.spec.ts --project=chromium --reporter=list 2>&1 | tee /tmp/playwright-output.log; then
    PASSED=$(grep -c "passed" /tmp/playwright-output.log || echo "0")
    echo -e "${GREEN}✓ Screenshot-Tests erfolgreich abgeschlossen${NC}"
else
    echo -e "${YELLOW}⚠ Einige Tests fehlgeschlagen – fahre mit vorhandenen Screenshots fort${NC}"
fi

# Zähle die Screenshots
SCREENSHOT_COUNT=$(find "$KICKSTART_DIR" -name "*.png" -type f | wc -l | tr -d ' ')
echo -e "${GREEN}✓ $SCREENSHOT_COUNT Screenshots in web/kickstart/ vorhanden${NC}"
echo ""

##############################################################################
# Phase 2: Website (presentation.html) aktualisieren
##############################################################################
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 2: Website aktualisieren${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Sammle alle existierenden Screenshots
EXISTING_SCREENSHOTS=()
while IFS= read -r f; do
    EXISTING_SCREENSHOTS+=("$(basename "$f")")
done < <(find "$KICKSTART_DIR" -name "*.png" -type f | sort)

# Sammle alle Screenshots die bereits in der presentation.html referenziert werden
REFERENCED_IN_PRESENTATION=()
if [[ -f "$KICKSTART_DIR/presentation.html" ]]; then
    while IFS= read -r img; do
        REFERENCED_IN_PRESENTATION+=("$img")
    done < <(grep -oP "(?<=src=\")[^\"]+\.png" "$KICKSTART_DIR/presentation.html" | grep -v "logo" | sort -u)
fi

# Mapping von Screenshot-Dateinamen zu deutschen Beschreibungen
declare -A SCREENSHOT_DESCRIPTIONS=(
    # Admin Tabs
    ["admin_benutzer.png"]="Benutzerverwaltung|Verwaltung aller Benutzer im System"
    ["admin_benutzergruppen.png"]="Benutzergruppen|Verwaltung von Benutzergruppen und Rollen"
    ["admin_standorte.png"]="Standortverwaltung|Verwaltung der Unternehmensstandorte"
    ["admin_organigramm.png"]="Organigramm|Interaktive Organisationsstruktur"
    ["admin_zeiteintraege.png"]="Zeiteinträge|Zentrale Übersicht aller Zeiteinträge"
    ["admin_abwesenheiten.png"]="Abwesenheiten|Verwaltung von Abwesenheiten"
    ["admin_urlaubsplaner.png"]="Urlaubsplaner|Kalenderansicht der Urlaubsplanung"
    ["admin_feiertage.png"]="Feiertage|Verwaltung kantonaler Feiertage"
    ["admin_rechnungen.png"]="Rechnungsverwaltung|Übersicht aller Rechnungen"
    ["admin_rechnungsvorlagen.png"]="Rechnungsvorlagen|Verwaltung von Vorlagen"
    ["admin_mahnwesen.png"]="Mahnwesen|Mahnungen verwalten und versenden"
    ["admin_reisekosten.png"]="Reisekosten|Reisekostenabrechnung"
    ["admin_lohnabrechnung.png"]="Lohnabrechnung|Integrierte Lohnberechnung"
    ["admin_zeitmodelle.png"]="Zeitmodelle|Arbeitszeitmodelle konfigurieren"
    ["admin_kunden.png"]="Kundenverwaltung|Verwaltung der Kundenstammdaten"
    ["admin_lieferanten.png"]="Lieferantenverwaltung|Verwaltung der Lieferantenstammdaten"
    ["admin_abteilungen.png"]="Abteilungsverwaltung|Abteilungen und Teamstruktur"
    ["admin_bestellungen.png"]="Bestellwesen|Bestellungen mit 8-stufigem Workflow"
    ["admin_artikelgruppen.png"]="Artikelgruppen|Kategorisierung von Artikeln"
    ["admin_artikel.png"]="Artikelverwaltung|Verwaltung von Artikeln und Produkten"
    ["admin_geraete.png"]="Geräteverwaltung|IT-Inventar und Geräte"
    ["admin_kostenstellen.png"]="Kostenstellen|Kostenstellenverwaltung"
    ["admin_lagerbestand.png"]="Lagerbestand|Inventar- und Bestandsverwaltung"
    ["admin_projekte.png"]="Projektmanagement|Verwaltung aller Projekte"
    ["admin_projektbudget.png"]="Projektbudget|Budget-Übersicht und -Planung"
    ["admin_projektberichte.png"]="Projektberichte|Projekt-Auswertungen und Reports"
    ["admin_projektplanung.png"]="Projektplanung|Gantt-Chart und Meilensteine"
    ["admin_analytics.png"]="Analytics|Erweiterte Auswertungen und Statistiken"
    ["admin_stunden_alle.png"]="Stunden (Alle)|Team-Stundenübersicht"
    ["admin_stunden_user.png"]="Stunden (Mitarbeiter)|Einzelne Mitarbeiter-Auswertung"
    ["admin_geschaeftsbericht.png"]="Geschäftsbericht|Management-Report und KPIs"
    ["admin_compliance.png"]="Compliance|ArG-Compliance-Überwachung"
    ["admin_workflows.png"]="Workflows|Workflow-Verwaltung"
    ["admin_workflow_actions.png"]="Workflow-Actions|Workflow-Regeln und Trigger"
    ["admin_system_logs.png"]="System-Logs|Protokollierung und Audit-Trail"
    ["admin_module.png"]="Modul-Verwaltung|Aktivierung und Konfiguration von Modulen"
    ["admin_berechtigungen.png"]="Berechtigungen|Detaillierte Rechteverwaltung"
    ["admin_einstellungen.png"]="System-Einstellungen|Zentrale Systemkonfiguration"
    ["admin_elearning.png"]="E-Learning Admin|Verwaltung von Kursen und Schulungen"
    ["admin_onboarding.png"]="Onboarding|Onboarding-Verwaltung für neue Mitarbeiter"
    ["admin_funktionen.png"]="Job-Funktionen|Stellenprofile und Funktionsbeschreibungen"
    ["admin_checklisten.png"]="Checklisten|Vorlagen und Zuweisungen"
    ["admin_news.png"]="Unternehmensnews|Nachrichten und Ankündigungen"
    ["admin_backup.png"]="Backup & Restore|Datensicherung und Wiederherstellung"
    # Standalone-Seiten
    ["dashboard.png"]="Dashboard|Übersichtliches Dashboard mit allen wichtigen Informationen"
    ["profil.png"]="Benutzerprofil|Persönliches Profil mit Einstellungen"
    ["incidents.png"]="Incident Management|Verwaltung von Vorfällen und Meldungen"
    ["ehs_dashboard.png"]="EHS-Dashboard|Sicherheits- und Umweltmanagement"
    ["nachrichten.png"]="Nachrichtensystem|Interne Kommunikation zwischen Mitarbeitern"
    ["intranet.png"]="Intranet|Internes Informationsportal und Wiki"
    ["medien.png"]="Medienbibliothek|Verwaltung von Dokumenten und Medien"
    ["bestellungen.png"]="Bestellungen|Bestellübersicht für Mitarbeiter"
    ["elearning.png"]="E-Learning|Kurs-Übersicht und Schulungszugang"
    ["checklisten.png"]="Checklisten|Persönliche Aufgaben und Checklisten"
    ["login.png"]="Login|Sichere Anmeldung am System"
    ["landing_page.png"]="Landing Page|Startseite des Systems"
    # Weitere existierende Screenshots
    ["timemanagement.png"]="Zeiterfassung|Einfaches Ein-/Ausstempeln mit Projektzuordnung"
    ["projekte.png"]="Projektmanagement|Verwaltung und Übersicht aller Projekte"
    ["project_budget_planning.png"]="Projekt-Budgetplanung|Detaillierte Budget-Planung und Kostenüberwachung"
    ["project_reports_overview.png"]="Projekt-Reports|Umfassende Projekt-Auswertungen mit Diagrammen"
    ["project_time_reports.png"]="Projekt-Zeitberichte|Detaillierte Zeitauswertungen pro Projekt"
    ["urlaubsplaner.png"]="Urlaubsplaner|Kalenderansicht für Urlaubsplanung"
    ["abwesenheit.png"]="Abwesenheitsverwaltung|Verwaltung von Abwesenheiten und Anträgen"
    ["genehmigungen.png"]="Genehmigungen|Workflow-basierte Genehmigungsprozesse"
    ["reporting.png"]="Reporting|Umfassende Reports und Statistiken"
    ["reporting_stunden.png"]="Stunden-Reporting|Detaillierte Auswertung der Arbeitsstunden"
    ["reoorting_mitarbeiter.png"]="Mitarbeiter-Reporting|Auswertungen pro Mitarbeiter"
    ["benutzerverwaltung.png"]="Benutzerverwaltung|Verwaltung von Benutzern (Tabellenansicht)"
    ["benutzergruppen.png"]="Benutzergruppen|Verwaltung von Benutzergruppen"
    ["berechtigungen.png"]="Berechtigungen|Detaillierte Rechteverwaltung"
    ["module.png"]="Modul-Verwaltung|Aktivierung und Konfiguration von Modulen"
    ["rechnungen.png"]="Rechnungsverwaltung|Erstellung und Verwaltung von Rechnungen"
    ["rechnung_bearbeiten.png"]="Rechnung bearbeiten|Editor für Rechnungserstellung"
    ["rechnung_vorschau.png"]="Rechnungsvorschau|Live-Vorschau der Rechnungen mit QR-Code"
    ["rechnungsvorlage.png"]="Rechnungsvorlagen|Verwaltung von Rechnungsvorlagen"
    ["workflow_editot.png"]="Workflow Editor|Visueller Editor für Workflows"
    ["workflow_triggers.png"]="Workflow Triggers|Automatische Workflow-Auslöser und Actions"
    ["stammdaten_kunden.png"]="Kundenverwaltung|Verwaltung der Kundenstammdaten"
    ["stammdaten_lieferanten.png"]="Lieferantenverwaltung|Verwaltung der Lieferantenstammdaten"
    ["stammdaten_artikel.png"]="Artikelverwaltung|Verwaltung von Artikeln und Produkten"
    ["stammdaten_artikelgruppen.png"]="Artikelgruppen|Kategorisierung von Artikeln"
    ["standorte.png"]="Standortverwaltung|Verwaltung von Unternehmensstandorten"
    ["locations.png"]="Standorte Karte|Standort-Kartenansicht mit Details"
    ["feiertage.png"]="Feiertage|Verwaltung kantonaler Feiertage"
    ["compliance.png"]="Compliance|Schweizer Compliance-Management (ArG/ArGV)"
    ["backup_restore.png"]="Backup & Restore|Datensicherung und Wiederherstellung"
    ["system_einstellungen.png"]="System-Einstellungen|Zentrale Systemkonfiguration"
    ["lohnabrechnung.png"]="Lohnabrechnung|Integrierte Lohnberechnung und Export"
    ["reisekosten.png"]="Reisekostenverwaltung|Erfassung und Abrechnung von Reisekosten"
    ["user_cards.png"]="Benutzer-Karten|Benutzerübersicht in Kartenansicht"
    ["timemodels.png"]="Zeitmodelle|Arbeitszeitmodell-Verwaltung"
    ["timemodel_assign.png"]="Zeitmodell-Zuweisung|Mitarbeitern Zeitmodelle zuweisen"
    ["zeitmodell_anlegen.png"]="Zeitmodell anlegen|Neues Arbeitszeitmodell erstellen"
    ["zeitmodell_zuweisen.png"]="Zeitmodell zuweisen|Zeitmodelle an Mitarbeiter zuweisen"
    ["onboarding.png"]="Onboarding|Mitarbeiter-Onboarding-Portal"
    ["courcde_list.png"]="Kursliste|Verfügbare Kurse mit Kategorien"
    ["course_dashboard.png"]="Kurs-Dashboard|Kurs-Fortschritt und Statistiken"
    ["course_editor.png"]="Kurs-Editor|Content-Erstellung und -Verwaltung"
    ["user_course.png"]="Meine Kurse|Persönliche Kurs-Übersicht"
)

# Finde Screenshots die NICHT in der presentation.html referenziert sind
MISSING_IN_PRESENTATION=()
for screenshot in "${EXISTING_SCREENSHOTS[@]}"; do
    found=false
    for ref in "${REFERENCED_IN_PRESENTATION[@]}"; do
        if [[ "$screenshot" == "$ref" ]]; then
            found=true
            break
        fi
    done
    if [[ "$found" == "false" && "$screenshot" != "logo.png" ]]; then
        MISSING_IN_PRESENTATION+=("$screenshot")
    fi
done

if [[ ${#MISSING_IN_PRESENTATION[@]} -gt 0 ]]; then
    echo -e "${YELLOW}▶ ${#MISSING_IN_PRESENTATION[@]} neue Screenshots gefunden, die noch nicht in presentation.html sind:${NC}"
    for s in "${MISSING_IN_PRESENTATION[@]}"; do
        echo -e "  ${CYAN}+ $s${NC}"
    done

    # Neue Screenshot-Karten generieren und in presentation.html einfügen
    NEW_CARDS=""
    for screenshot in "${MISSING_IN_PRESENTATION[@]}"; do
        # Beschreibung aus dem Mapping holen oder generieren
        if [[ -n "${SCREENSHOT_DESCRIPTIONS[$screenshot]:-}" ]]; then
            IFS='|' read -r title desc <<< "${SCREENSHOT_DESCRIPTIONS[$screenshot]}"
        else
            # Fallback: Dateiname als Titel verwenden
            title=$(echo "$screenshot" | sed 's/\.png//;s/_/ /g;s/admin //;s/\b\(.\)/\u\1/g')
            desc="Screenshot: $title"
        fi

        NEW_CARDS+="                <div class=\"screenshot-card\" onclick=\"openLightbox('${screenshot}')\">"$'\n'
        NEW_CARDS+="                    <div class=\"image-container\">"$'\n'
        NEW_CARDS+="                        <img src=\"${screenshot}\" alt=\"${title}\">"$'\n'
        NEW_CARDS+="                    </div>"$'\n'
        NEW_CARDS+="                    <div class=\"caption\">"$'\n'
        NEW_CARDS+="                        <h3>${title}</h3>"$'\n'
        NEW_CARDS+="                        <p>${desc}</p>"$'\n'
        NEW_CARDS+="                    </div>"$'\n'
        NEW_CARDS+="                </div>"$'\n'
    done

    if [[ -n "$NEW_CARDS" ]]; then
        # Füge die neuen Karten vor dem schließenden </div> der screenshots-grid ein
        # Verwende Python für sicheren mehrzeiligen Ersatz
        python3 << PYEOF
import re

with open("$KICKSTART_DIR/presentation.html", "r", encoding="utf-8") as f:
    content = f.read()

new_cards = """$NEW_CARDS"""

# Finde die letzte screenshot-card und füge danach ein
# Suche das Ende des screenshots-grid div
marker = "</div>\n        </div>\n    </section>\n\n    <!-- Tech Stack Section -->"
if marker in content:
    content = content.replace(marker, new_cards.rstrip() + "\n            </div>\n        </div>\n    </section>\n\n    <!-- Tech Stack Section -->")
    with open("$KICKSTART_DIR/presentation.html", "w", encoding="utf-8") as f:
        f.write(content)
    print("presentation.html aktualisiert")
else:
    print("WARNUNG: Marker nicht gefunden in presentation.html")
PYEOF
    fi

    echo -e "${GREEN}✓ presentation.html aktualisiert mit ${#MISSING_IN_PRESENTATION[@]} neuen Screenshots${NC}"
else
    echo -e "${GREEN}✓ presentation.html ist bereits aktuell${NC}"
fi
echo ""

##############################################################################
# Phase 3: Handbuch (CFLUX-HANDBUCH.md) aktualisieren
##############################################################################
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 3: Handbuch aktualisieren${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HANDBUCH="$DOCS_DIR/CFLUX-HANDBUCH.md"

if [[ -f "$HANDBUCH" ]]; then
    # Screenshots die im Handbuch referenziert werden
    REFERENCED_IN_HANDBUCH=$(grep -oP '(?<=\.\./web/kickstart/)[^)]+\.png' "$HANDBUCH" | sort -u)

    # Finde fehlende Screenshots im Handbuch
    MISSING_IN_HANDBUCH=()
    for screenshot in "${EXISTING_SCREENSHOTS[@]}"; do
        if ! echo "$REFERENCED_IN_HANDBUCH" | grep -qF "$screenshot"; then
            if [[ "$screenshot" != "logo.png" ]]; then
                MISSING_IN_HANDBUCH+=("$screenshot")
            fi
        fi
    done

    if [[ ${#MISSING_IN_HANDBUCH[@]} -gt 0 ]]; then
        echo -e "${YELLOW}▶ ${#MISSING_IN_HANDBUCH[@]} Screenshots fehlen im Handbuch:${NC}"
        for s in "${MISSING_IN_HANDBUCH[@]}"; do
            echo -e "  ${CYAN}+ $s${NC}"
        done

        # Neue Screenshot-Abschnitte am Ende des Handbuchs vor dem letzten Abschnitt einfügen
        APPENDIX=""
        APPENDIX+=$'\n'"### Weitere Screenshots (automatisch hinzugefügt)"$'\n\n'

        for screenshot in "${MISSING_IN_HANDBUCH[@]}"; do
            if [[ -n "${SCREENSHOT_DESCRIPTIONS[$screenshot]:-}" ]]; then
                IFS='|' read -r title desc <<< "${SCREENSHOT_DESCRIPTIONS[$screenshot]}"
            else
                title=$(echo "$screenshot" | sed 's/\.png//;s/_/ /g;s/admin //;s/\b\(.\)/\u\1/g')
                desc="$title"
            fi
            APPENDIX+="![${title}](../web/kickstart/${screenshot})"$'\n\n'
        done

        # Finde eine geeignete Stelle im Handbuch (vor dem letzten Abschnitt)
        python3 << PYEOF
with open("$HANDBUCH", "r", encoding="utf-8") as f:
    content = f.read()

appendix = """$APPENDIX"""

# Füge vor dem letzten großen Abschnitt ein (oder am Ende)
# Suche nach "---" am Ende des Dokuments
lines = content.rstrip().split('\n')

# Füge den Anhang vor der letzten "---" Linie ein, falls vorhanden
last_separator = -1
for i in range(len(lines) - 1, max(len(lines) - 50, 0), -1):
    if lines[i].strip() == '---':
        last_separator = i
        break

if last_separator > 0:
    lines.insert(last_separator, appendix)
else:
    lines.append(appendix)

with open("$HANDBUCH", "w", encoding="utf-8") as f:
    f.write('\n'.join(lines) + '\n')

print(f"Handbuch aktualisiert")
PYEOF

        echo -e "${GREEN}✓ Handbuch um ${#MISSING_IN_HANDBUCH[@]} Screenshots ergänzt${NC}"
    else
        echo -e "${GREEN}✓ Handbuch enthält bereits alle Screenshots${NC}"
    fi

    # Datum im Handbuch aktualisieren
    python3 << PYEOF
import re

with open("$HANDBUCH", "r", encoding="utf-8") as f:
    content = f.read()

# Aktualisiere das Datum im Deckblatt
content = re.sub(
    r'\| \*\*Datum\*\* \| .+? \|',
    '| **Datum** | $TODAY |',
    content
)

with open("$HANDBUCH", "w", encoding="utf-8") as f:
    f.write(content)

print("Datum im Handbuch aktualisiert auf: $TODAY")
PYEOF

else
    echo -e "${RED}✗ Handbuch nicht gefunden: $HANDBUCH${NC}"
fi
echo ""

##############################################################################
# Phase 4: Executive Summary aktualisieren
##############################################################################
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Phase 4: Executive Summary aktualisieren${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

EXEC_SUMMARY="$DOCS_DIR/EXECUTIVE_SUMMARY.md"

if [[ -f "$EXEC_SUMMARY" ]]; then
    # Screenshots die in der Executive Summary referenziert werden
    REFERENCED_IN_ES=$(grep -oP '(?<=\.\./web/kickstart/)[^)]+\.png' "$EXEC_SUMMARY" | sort -u)

    # Finde fehlende Screenshots
    MISSING_IN_ES=()
    for screenshot in "${EXISTING_SCREENSHOTS[@]}"; do
        if ! echo "$REFERENCED_IN_ES" | grep -qF "$screenshot"; then
            if [[ "$screenshot" != "logo.png" ]]; then
                MISSING_IN_ES+=("$screenshot")
            fi
        fi
    done

    if [[ ${#MISSING_IN_ES[@]} -gt 0 ]]; then
        echo -e "${YELLOW}▶ ${#MISSING_IN_ES[@]} Screenshots fehlen in Executive Summary:${NC}"
        for s in "${MISSING_IN_ES[@]}"; do
            echo -e "  ${CYAN}+ $s${NC}"
        done

        # Neue Screenshot-Einträge generieren
        ES_APPENDIX=""
        for screenshot in "${MISSING_IN_ES[@]}"; do
            if [[ -n "${SCREENSHOT_DESCRIPTIONS[$screenshot]:-}" ]]; then
                IFS='|' read -r title desc <<< "${SCREENSHOT_DESCRIPTIONS[$screenshot]}"
            else
                title=$(echo "$screenshot" | sed 's/\.png//;s/_/ /g;s/admin //;s/\b\(.\)/\u\1/g')
                desc="$title"
            fi
            ES_APPENDIX+="![${title}](../web/kickstart/${screenshot})  "$'\n'
            ES_APPENDIX+="**${title}** - ${desc}"$'\n\n'
        done

        # Am Ende der Screenshot-Sektion einfügen
        python3 << PYEOF
with open("$EXEC_SUMMARY", "r", encoding="utf-8") as f:
    content = f.read()

appendix = """$ES_APPENDIX"""

# Suche nach dem Abschnitt "### Login & Landing" und füge danach ein
# oder vor "### Interaktive Präsentation"
marker = "### Interaktive Präsentation"
if marker in content:
    content = content.replace(marker, appendix + "\n" + marker)
else:
    # Fallback: Vor "---" am Ende einfügen
    lines = content.rstrip().split('\n')
    last_sep = -1
    for i in range(len(lines) - 1, max(len(lines) - 20, 0), -1):
        if lines[i].strip() == '---':
            last_sep = i
            break
    if last_sep > 0:
        lines.insert(last_sep, appendix)
    else:
        lines.append(appendix)
    content = '\n'.join(lines) + '\n'

with open("$EXEC_SUMMARY", "w", encoding="utf-8") as f:
    f.write(content)

print("Executive Summary aktualisiert")
PYEOF

        echo -e "${GREEN}✓ Executive Summary um ${#MISSING_IN_ES[@]} Screenshots ergänzt${NC}"
    else
        echo -e "${GREEN}✓ Executive Summary enthält bereits alle Screenshots${NC}"
    fi

    # Datum aktualisieren
    python3 << PYEOF
import re

with open("$EXEC_SUMMARY", "r", encoding="utf-8") as f:
    content = f.read()

# Berichtsdatum aktualisieren
content = re.sub(
    r'\*\*Berichtsdatum:\*\* .+',
    '**Berichtsdatum:** $TODAY',
    content
)

# Erstellt am Datum aktualisieren
content = re.sub(
    r'\*\*Erstellt am:\*\* .+',
    '**Erstellt am:** $TODAY',
    content
)

with open("$EXEC_SUMMARY", "w", encoding="utf-8") as f:
    f.write(content)

print("Datum in Executive Summary aktualisiert auf: $TODAY")
PYEOF

else
    echo -e "${RED}✗ Executive Summary nicht gefunden: $EXEC_SUMMARY${NC}"
fi

# Auch deckblatt_es.md aktualisieren
DECKBLATT="$DOCS_DIR/deckblatt_es.md"
if [[ -f "$DECKBLATT" ]]; then
    python3 << PYEOF
import re

with open("$DECKBLATT", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'\*\*Berichtsdatum:\*\* .+',
    '**Berichtsdatum:** $TODAY',
    content
)

with open("$DECKBLATT", "w", encoding="utf-8") as f:
    f.write(content)

print("Deckblatt aktualisiert")
PYEOF
fi

echo ""

##############################################################################
# Phase 5: Zusammenfassung
##############################################################################
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Zusammenfassung${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${GREEN}✓ Screenshots:            $SCREENSHOT_COUNT Dateien in web/kickstart/${NC}"

# Zähle Referenzen in allen Dokumenten
REFS_PRESENTATION=$(grep -coP "\.png" "$KICKSTART_DIR/presentation.html" 2>/dev/null || echo "0")
REFS_HANDBUCH=$(grep -c "web/kickstart/.*\.png" "$HANDBUCH" 2>/dev/null || echo "0")
REFS_EXEC=$(grep -c "web/kickstart/.*\.png" "$EXEC_SUMMARY" 2>/dev/null || echo "0")

echo -e "${GREEN}✓ presentation.html:      $REFS_PRESENTATION Bild-Referenzen${NC}"
echo -e "${GREEN}✓ CFLUX-HANDBUCH.md:      $REFS_HANDBUCH Bild-Referenzen${NC}"
echo -e "${GREEN}✓ EXECUTIVE_SUMMARY.md:   $REFS_EXEC Bild-Referenzen${NC}"
echo -e "${GREEN}✓ Datum aktualisiert:      $TODAY${NC}"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Fertig! Alle Screenshots und Dokumente sind aktualisiert.  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Tipp: PDF-Export von Handbuch und Executive Summary:${NC}"
echo -e "  pandoc docs/CFLUX-HANDBUCH.md -o docs/CFLUX-HANDBUCH.pdf"
echo -e "  pandoc docs/EXECUTIVE_SUMMARY.md -o docs/EXECUTIVE_SUMMARY.pdf"
echo -e "  pandoc docs/deckblatt_es.md -o docs/deckblatt_es.pdf"
