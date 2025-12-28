# Schnellstart: Node-basierter Workflow-Editor

## In 5 Minuten zum ersten Workflow

### 1. Editor öffnen
1. Melden Sie sich als Administrator an
2. Navigieren Sie zu **Admin Dashboard** → **Workflows**
3. Klicken Sie auf **➕ Neuer Workflow**

### 2. Grundeinstellungen
1. Geben Sie einen **Workflow-Namen** ein (z.B. "Rechnungsgenehmigung")
2. Aktivieren Sie den Workflow mit dem Toggle **"Aktiv"**
3. Optional: Fügen Sie eine **Beschreibung** hinzu

### 3. Ersten Node hinzufügen
1. Sie sehen bereits einen **🚀 Start-Node** im Canvas - dieser ist der Einstiegspunkt
2. Schauen Sie in die **linke Sidebar** - dort sehen Sie alle verfügbaren Nodes
3. **Klicken und halten** Sie einen Node (z.B. "✅ Genehmigung")
4. **Ziehen** Sie ihn in den mittleren Canvas (unter den Start-Node)
5. **Loslassen** - der Node wird platziert

### 4. Node konfigurieren
1. **Klicken** Sie auf den neu erstellten Node
2. Das **Eigenschaften-Panel** öffnet sich rechts
3. Ändern Sie den **Namen** (z.B. "Manager-Genehmigung")
4. Wählen Sie **Genehmiger** aus der Liste aus
5. Die Änderungen werden automatisch übernommen

### 5. Weitere Nodes hinzufügen
1. Ziehen Sie einen **E-Mail-Node** in den Canvas
2. Konfigurieren Sie:
   - Name: "Bestätigung senden"
   - Empfänger: Wählen Sie Benutzer aus
   - Betreff: "Rechnung wurde genehmigt"
   - Nachricht: "Die Rechnung wurde erfolgreich genehmigt."

### 6. Nodes verbinden**Start-Nodes** (🚀)
2. **Klicken und halten** Sie den Punkt
3. **Ziehen** Sie eine Linie zum oberen Punkt des Genehmigungsnodes
4. **Loslassen** - die Verbindung ist erstellt
5. Verbinden Sie nun den Genehmigungsnode mit dem E-Mail-Node
6. Optional: Fügen Sie einen **🏁 Ende-Node** hinzu und verbinden Sie ihn als letzten Schrit des zweiten Nodes (E-Mail)
4. **Loslassen** - die Verbindung ist erstellt

### 7. Workflow speichern
1. Klicken Sie oben rechts auf **"Speichern"**
2. Der Workflow wird gespeichert und ist nun aktiv

## Häufige Anwendungsfälle

### Betragsabhängige Genehmigung

**Szenario**: Rechnungen unter CHF 5'000 benötigen nur eine Genehmigung, darüber zwei.

**Nodes**:
1. 💰 **Wertbedingung**
   - Feld: Gesamtbetrag
   - Operator: größer als
   - Wert: 5000

2. ✅ **Genehmigung 1** (an "true"-Ausgang)
   - Name: "Manager-Genehmigung"
   - Genehmiger: Manager

3. ✅ **Genehmigung 2** (an "true"-Ausgang, nach Genehmigung 1)
   - Name: "CFO-Genehmigung"
   - Genehmiger: CFO

4. ✅ **Genehmigung 3** (an "false"-Ausgang)
   - Name: "Team Lead-Genehmigung"
   - Genehmiger: Team Lead

🚀 Start → [Betrag > CHF 5'000?]
         ├─ JA → Manager → CFO → 🏁 Ende
         └─ NEIN → Team Lead → 🏁
         ├─ JA → Manager → CFO → Ende
         └─ NEIN → Team Lead → Ende
```

### Erinnerungs-Workflow

**Szenario**: Sende eine Erinnerung 24 Stunden nach Rechnungserstellung.

**Nodes**:
1. ⏱️ **Verzögerung**
   - Einheit: Stunden
   - Dauer: 24

2. 📧 **E-Mail**
   - Name: "Erinnerung"
   - Empfänger: Kunde
   - Betreff: "Erinnerung: Offene Rechnung"
   - Nachricht: "..."

🚀 Start → [Warte 24h] → [E-Mail senden] → 🏁
```
Start → [Warte 24h] → [E-Mail senden] → Ende
```

### Überfällige Rechnungen

**Szenario**: Wenn eine Rechnung älter als 30 Tage ist, sende eine Mahnung.

**Nodes**:
1. 📅 **Datumsbedingung**
   - Feld: Rechnungsdatum
   - Operator: größer als
   - Vergleichstyp: Relativ
   - Tage: 30

2. 📧 **E-Mail** (an "true"-Ausgang)
   - Name: "Mahnung senden"
   - Empfänger: Kunde
   - Betreff: "Zahlungserinnerung"

**Ablauf**:
```
🚀 Start → [Datum > 30 Tage?]
         ├─ JA → [Mahnung] → 🏁 Ende
         └─ NEIN → 🏁 Ende
```

## Tipps & Tricks

### 🎯 Navigation
- **Zoom**: Mausrad scrollen
- **Verschieben**: Canvas mit Maus ziehen
- **Fit View**: Alle Nodes anzeigen (Button rechts unten)

### 🎨 Organisation
- Platzieren Sie Nodes **von oben nach unten**
- Halten Sie **verwandte Nodes nahe beieinander**
- Nutzen Sie die **Mini-Map** für große Workflows

### ⚡ Shortcuts
- **Entf/Delete**: Selektierten Node löschen (nach Bestätigung im Panel)
- **Klick auf Canvas**: Deselektieren
- **Strg + Mausrad**: Zoom

### 🔍 Bedingungen
- **Bedingungsnodes** haben zwei Ausgänge: **true** (links) und **false** (rechts)
- Verbinden Sie beide Ausgänge für vollständige Logik
- Kombinieren Sie Bedingungen mit **Logik-Nodes** (UND/ODER)

### 📧 E-Mails
- Verwenden Sie **klare Betreffzeilen**
- Nutzen Sie **Platzhalter** in der Nachricht (später implementiert)
- Testen Sie E-Mail-Workflows zuerst im Inaktiv-Modus

## Häufige Fehler

### ❌ "Workflow lässt sich nicht speichern"
**Ursache**: Kein Name, kein Start-Node oder keine weiteren Nodes
**Lösung**: Name eingeben, Start-Node wird automatisch erstellt, mindestens einen weiteren Node hinzufügen

### ❌ "Node wird nicht verbunden"
**Ursache**: Falsche Handle-Richtung
**Lösung**: Immer vom Start-Node aus beginnen, von unten (Output) nach oben (Input) verbinden

### ❌ "Eigenschaften-Panel zeigt nichts an"
**Ursache**: Kein Node selektiert
**Lösung**: Klicken Sie auf einen Node im Canvas

## Nächste Schritte

1. **Testen Sie Ihren Workflow**: Erstellen Sie eine Rechnung mit dem zugeordneten Template
2. **Überwachen Sie die Ausführung**: Prüfen Sie den Status in "Meine Genehmigungen"
3. **Optimieren Sie**: Passen Sie Bedingungen und Pfade nach Bedarf an
4. **Erweitern Sie**: Fügen Sie weitere Nodes und Logik hinzu

## Weitere Ressourcen

- **Vollständige Dokumentation**: [NODE_WORKFLOW_EDITOR.md](NODE_WORKFLOW_EDITOR.md)
- **Workflow-System**: [WORKFLOW_SYSTEM.md](WORKFLOW_SYSTEM.md)
- **Support**: Bei Fragen kontaktieren Sie das Development Team

---

Viel Erfolg mit Ihrem ersten Node-basierten Workflow! 🚀
