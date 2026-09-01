#!/usr/bin/env python3
"""
Erzeugt docs/PUBLIC_API_ENDPUNKTE.md aus dem Quelltext.

Von Hand gepflegt veraltet so eine Liste beim ersten Merge. Deshalb wird sie
gelesen, nicht geschrieben: aus index.ts kommen die Mount-Praefixe, aus den
Dateien unter routes/ die Endpunkte samt Waechtern, aus apiScope.ts die
Freigabeliste.

    python3 scripts/api-inventar.py          # schreibt docs/PUBLIC_API_ENDPUNKTE.md
    python3 scripts/api-inventar.py --pruef  # nur pruefen, ob das Dokument aktuell ist

Der Pruefmodus taugt fuer einen Pre-Commit-Hook oder CI: er meldet mit
Exitcode 1, wenn sich am Bestand etwas geaendert hat, ohne dass jemand das
Dokument neu erzeugt hat.
"""

from __future__ import annotations

import re
import sys
from collections import OrderedDict
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
SRC = WURZEL / "backend" / "src"
ZIEL = WURZEL / "docs" / "PUBLIC_API_ENDPUNKTE.md"

# Sprechende Namen. Fehlt einer, faellt der Bericht auf den Schluessel zurueck
# und nennt ihn unten unter "ohne Bezeichnung" — dann gehoert er hier ergaenzt.
MODULNAMEN = {
    "absences": "Abwesenheiten",
    "articles": "Artikel & Artikelgruppen",
    "berichte": "Rundgangsberichte",
    "checklists": "Checklisten",
    "contacts": "Kontakte",
    "cost_centers": "Kostenstellen",
    "customers": "Kunden",
    "departments": "Abteilungen",
    "devices": "Geräte",
    "incidents": "Vorfälle",
    "intranet": "Intranet-Dokumente",
    "inventory": "Lager",
    "invoices": "Rechnungen & Vorlagen",
    "locations": "Standorte",
    "news": "News",
    "orders": "Aufträge",
    "project_budget": "Projektbudgets",
    "project_reports": "Projektberichte",
    "projects": "Projekte & Aufgaben",
    "reminders": "Mahnwesen",
    "reports": "Auswertungen",
    "suppliers": "Lieferanten",
    "time_tracking": "Zeiterfassung",
    "travel_expenses": "Reisekosten",
    "zeitmodelle": "Zeitmodelle",
}

GESPERRTNAMEN = {
    "/api/actions": "Massnahmen",
    "/api/api-keys": "API-Schlüssel",
    "/api/applicants": "Bewerber",
    "/api/auth": "Anmeldung",
    "/api/backup": "Datensicherung",
    "/api/calendar": "Kalender",
    "/api/compliance": "Compliance",
    "/api/dashboard-layout": "Dashboard-Layout",
    "/api/ehs": "EHS",
    "/api/ehs-todos": "EHS-Aufgaben",
    "/api/elearning": "E-Learning",
    "/api/equipment-training": "Geräteunterweisung",
    "/api/job-functions": "Funktionen",
    "/api/media": "Medien",
    "/api/messages": "Nachrichten",
    "/api/modules": "Module",
    "/api/onboarding": "Onboarding",
    "/api/payroll": "Lohnbuchhaltung",
    "/api/stories": "Stories",
    "/api/system-settings": "Systemeinstellungen",
    "/api/uploads": "Uploads",
    "/api/user-groups": "Benutzergruppen",
    "/api/users": "Benutzer",
    "/api/werkzeuge": "Werkzeuge",
    "/api/workflows": "Workflows",
}

# Bereiche, die gesperrt bleiben sollen. Alles andere ist nur noch nicht
# freigegeben — der Unterschied ist im Dokument wichtig.
DAUERHAFT_GESPERRT = {
    "/api/auth",
    "/api/users",
    "/api/user-groups",
    "/api/payroll",
    "/api/backup",
    "/api/api-keys",
    "/api/system-settings",
    "/api/modules",
}

# Welche Endpunkte die MCP-Werkzeuge tatsaechlich aufrufen. Diese Liste ist von
# Hand gepflegt, wird aber gegen die echten Routen geprueft: verschwindet eine,
# bricht der Lauf ab, statt still eine falsche Abdeckung zu melden.
MCP_ENDPUNKTE = {
    "GET /api/berichte",
    "GET /api/berichte/:id",
    "GET /api/berichte/projects",
    "GET /api/berichte/:id/export.pdf",
    "GET /api/incidents",
    "GET /api/incidents/:id",
    "POST /api/incidents",
    "GET /api/incidents/statistics",
    "GET /api/incidents/:id/pdf",
    "GET /api/intranet/tree",
    "GET /api/intranet/:id",
    "POST /api/intranet",
    "GET /api/intranet/search",
    "POST /api/intranet/:nodeId/attachments",
    "GET /api/intranet/attachments/:attachmentId/download",
    "POST /api/intranet/:id/submit",
    "POST /api/intranet/:id/approve",
    "POST /api/intranet/:id/reject",
    "POST /api/intranet/:id/publish",
    "POST /api/intranet/:id/return-to-draft",
    "GET /api/intranet/pending-approvals",
    "GET /api/devices",
    "GET /api/devices/:id",
    "GET /api/devices/:id/software",
    "GET /api/devices/:id/vulnerabilities",
    "GET /api/devices/software/report",
    "GET /api/devices/user/:userId",
}


def klammerblock(text: str, start: int) -> str:
    """Der Aufruf ab der oeffnenden Klammer bei start, klammerbalanciert.

    Ein zeilenweiser Regex reicht nicht: viele Routen verteilen ihre Waechter
    ueber mehrere Zeilen, und genau die wuerden sonst als ungeschuetzt gelten.
    """
    tiefe = 0
    for i in range(start, len(text)):
        if text[i] == "(":
            tiefe += 1
        elif text[i] == ")":
            tiefe -= 1
            if tiefe == 0:
                return text[start : i + 1]
    return text[start:]


def einlesen() -> list[dict]:
    index = (SRC / "index.ts").read_text(encoding="utf-8")
    scope = (SRC / "middleware" / "apiScope.ts").read_text(encoding="utf-8")

    mounts = re.findall(r"app\.use\('(/api/[a-z-]+)',\s*([A-Za-z0-9_]+)\)", index)
    importe = dict(
        re.findall(r"import\s+([A-Za-z0-9_]+)\s+from\s+'\./routes/([A-Za-z0-9_.\-]+)'", index)
    )
    freigabe = dict(re.findall(r"'(/api/[a-z-]+)':\s*'([a-z_]+)'", scope))

    endpunkte = []
    for praefix, variable in mounts:
        datei = SRC / "routes" / f"{importe[variable]}.ts"
        if not datei.exists():
            raise SystemExit(f"Routendatei nicht gefunden: {datei}")
        quelle = datei.read_text(encoding="utf-8")

        # Middleware, die per router.use() fuer die ganze Datei gilt.
        weit_modul = bool(re.search(r"router\.use\(\s*requireModuleAccess", quelle))
        weit_admin = bool(re.search(r"router\.use\(\s*(authorize\('ADMIN'\)|requireAdmin)", quelle))

        for treffer in re.finditer(r"router\.(get|post|put|patch|delete)\s*\(", quelle):
            block = klammerblock(quelle, treffer.end() - 1)
            pfad = re.match(r"\(\s*'([^']*)'", block)
            if not pfad:
                continue
            voll = (praefix + pfad.group(1)).replace("//", "/").rstrip("/") or praefix
            endpunkte.append(
                {
                    "praefix": praefix,
                    "scope": freigabe.get(praefix),
                    "methode": treffer.group(1).upper(),
                    "pfad": voll,
                    "admin": weit_admin
                    or bool(re.search(r"authorize\(\s*'ADMIN'|requireAdmin", block)),
                    "modul": weit_modul or ("requireModuleAccess" in block),
                }
            )
    return endpunkte


def gruppieren(endpunkte: list[dict]) -> list[dict]:
    gruppen: OrderedDict = OrderedDict()
    for e in endpunkte:
        if e["scope"]:
            key = ("frei", e["scope"], MODULNAMEN.get(e["scope"], e["scope"]))
        else:
            key = ("zu", e["praefix"], GESPERRTNAMEN.get(e["praefix"], e["praefix"]))
        gruppen.setdefault(key, []).append(e)

    heraus = []
    for (art, key, titel), eps in gruppen.items():
        eps.sort(key=lambda e: (e["pfad"], e["methode"]))
        heraus.append(
            {
                "art": art,
                "key": key,
                "titel": titel,
                "hart": key in DAUERHAFT_GESPERRT,
                "eps": eps,
            }
        )
    heraus.sort(key=lambda g: (g["art"] != "frei", g["titel"]))
    return heraus


def marken(e: dict, mcp: set[str]) -> str:
    m = []
    if f"{e['methode']} {e['pfad']}" in mcp:
        m.append("MCP")
    if e["admin"]:
        m.append("ADMIN")
    if e["modul"]:
        m.append("Modulrecht")
    return ", ".join(m) or "—"


def schreiben(gruppen: list[dict]) -> str:
    alle = [e for g in gruppen for e in g["eps"]]
    frei = [e for g in gruppen if g["art"] == "frei" for e in g["eps"]]
    zu = [e for g in gruppen if g["art"] == "zu" for e in g["eps"]]
    hart = sum(len(g["eps"]) for g in gruppen if g["hart"])
    admin = sum(1 for e in frei if e["admin"])
    modul = sum(1 for e in frei if e["modul"])
    mcp = sum(1 for e in frei if f"{e['methode']} {e['pfad']}" in MCP_ENDPUNKTE)

    z = []
    a = z.append
    a("# Endpunktverzeichnis der Public API")
    a("")
    a("> Erzeugt von `scripts/api-inventar.py`. Nicht von Hand bearbeiten —")
    a("> Änderungen gehen beim nächsten Lauf verloren. Nach einer neuen Route:")
    a("> `python3 scripts/api-inventar.py`")
    a("")
    a("Aufstellung aller Endpunkte des Backends danach, was ein API-Schlüssel")
    a("erreicht und was einen echten Login verlangt. Die Architektur dahinter")
    a("steht in [`PUBLIC_API.md`](PUBLIC_API.md), die offenen Punkte in")
    a("[`PUBLIC_API_LUECKEN.md`](PUBLIC_API_LUECKEN.md).")
    a("")
    a("| | Anzahl |")
    a("|---|---:|")
    a(f"| Endpunkte insgesamt | {len(alle)} |")
    a(f"| über die Public API erreichbar | {len(frei)} |")
    a(f"| nur mit echtem Login | {len(zu)} |")
    a(f"| davon Bereiche, die gesperrt bleiben sollen | {hart} |")
    a(f"| freigegeben, aber zusätzlich nur für Administratoren | {admin} |")
    a(f"| freigegeben und mit einer Modulrechtsprüfung | {modul} |")
    a(f"| freigegeben und von einem MCP-Werkzeug benutzt | {mcp} |")
    a("")
    a("**Marken:** `MCP` — ein Werkzeug des MCP-Servers ruft diesen Endpunkt auf.")
    a("`ADMIN` — verlangt zusätzlich zur Modulfreigabe die Rolle `ADMIN`.")
    a("`Modulrecht` — prüft, ob der Benutzer hinter dem Schlüssel das Modul haben darf.")
    a("")
    a("---")
    a("")
    a("## Freigegeben")
    a("")
    a(f"{len(frei)} Endpunkte in {sum(1 for g in gruppen if g['art'] == 'frei')} Modulen.")
    a("Ein Schlüssel mit dem genannten Scope kommt hier durch — sofern die Marken")
    a("in der letzten Spalte nichts Weiteres verlangen.")
    a("")

    for g in [g for g in gruppen if g["art"] == "frei"]:
        a(f"### {g['titel']}")
        a("")
        a(f"Scope `{g['key']}:read` bzw. `{g['key']}:write` · {len(g['eps'])} Endpunkte")
        a("")
        a("| Methode | Pfad | |")
        a("|---|---|---|")
        for e in g["eps"]:
            a(f"| `{e['methode']}` | `{e['pfad']}` | {marken(e, MCP_ENDPUNKTE)} |")
        a("")

    a("---")
    a("")
    a("## Nicht freigegeben")
    a("")
    a(f"{len(zu)} Endpunkte in {sum(1 for g in gruppen if g['art'] == 'zu')} Bereichen.")
    a("Mit **gesperrt halten** sind die Bereiche gekennzeichnet, die auch künftig")
    a("nicht in die Freigabeliste gehören. Der Rest ist schlicht noch nicht")
    a("freigegeben; dafür genügt jeweils ein Eintrag in `apiScope.ts`.")
    a("")

    for g in [g for g in gruppen if g["art"] == "zu"]:
        hinweis = " — **gesperrt halten**" if g["hart"] else ""
        a(f"### {g['titel']}{hinweis}")
        a("")
        a(f"`{g['key']}` · {len(g['eps'])} Endpunkte")
        a("")
        a("| Methode | Pfad |")
        a("|---|---|")
        for e in g["eps"]:
            a(f"| `{e['methode']}` | `{e['pfad']}` |")
        a("")

    ohne = sorted({g["key"] for g in gruppen if g["titel"] == g["key"]})
    if ohne:
        a("---")
        a("")
        a("## Ohne Bezeichnung")
        a("")
        a("Für diese Schlüssel fehlt in `scripts/api-inventar.py` ein sprechender")
        a("Name — bitte dort ergänzen:")
        a("")
        for k in ohne:
            a(f"- `{k}`")
        a("")

    return "\n".join(z) + "\n"


def main() -> int:
    endpunkte = einlesen()
    echt = {f"{e['methode']} {e['pfad']}" for e in endpunkte}

    # Selbstkontrolle: eine MCP-Zuordnung, die ins Leere zeigt, wuerde die
    # Abdeckung zu niedrig ausweisen, ohne dass es jemandem auffiele.
    verwaist = MCP_ENDPUNKTE - echt
    if verwaist:
        print("Diese MCP-Zuordnungen zeigen auf Routen, die es nicht gibt:", file=sys.stderr)
        for p in sorted(verwaist):
            print(f"  {p}", file=sys.stderr)
        print(
            "\nEntweder wurde die Route umbenannt oder entfernt. "
            "MCP_ENDPUNKTE in diesem Skript anpassen.",
            file=sys.stderr,
        )
        return 1

    text = schreiben(gruppieren(endpunkte))

    if "--pruef" in sys.argv:
        if not ZIEL.exists():
            print(f"{ZIEL.relative_to(WURZEL)} fehlt.", file=sys.stderr)
            return 1
        if ZIEL.read_text(encoding="utf-8") != text:
            print(
                f"{ZIEL.relative_to(WURZEL)} ist nicht mehr aktuell.\n"
                "Bitte 'python3 scripts/api-inventar.py' laufen lassen und mit einchecken.",
                file=sys.stderr,
            )
            return 1
        print(f"{ZIEL.relative_to(WURZEL)} ist aktuell ({len(endpunkte)} Endpunkte).")
        return 0

    ZIEL.write_text(text, encoding="utf-8")
    frei = sum(1 for e in endpunkte if e["scope"])
    print(
        f"{ZIEL.relative_to(WURZEL)} geschrieben: "
        f"{len(endpunkte)} Endpunkte, {frei} freigegeben, {len(endpunkte) - frei} gesperrt."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
