# Flowchart: Zeiterfassung – Einstempeln

## Übersicht

Dieses Flowchart beschreibt den Prozess, der beim Einstempeln eines Users in der Zeiterfassung durchlaufen wird. Es behandelt drei Szenarien: erstmaliges Einstempeln am Tag, Wiedereinstempeln nach einer Pause (mit Pausenzeit-Validierung), und den Sonderfall, dass der User sich am Vortag nicht ausgestempelt hat.

## Ablauf

### 1. Start: User stempelt ein
Der Prozess beginnt, wenn ein User die Einstempel-Aktion auslöst.

### 2. Entscheidung: Bereits eingestempelt gewesen (Pause)?
Es wird geprüft, ob der User heute bereits eingestempelt war (d.h. ob es sich um eine Rückkehr aus einer Pause handelt).

#### 2a. Nein → Entscheidung: Ausgestempelt am Vortag?
Wenn der User heute noch nicht eingestempelt war, wird geprüft, ob er sich am Vortag korrekt ausgestempelt hat.

- **Ja** → Der User wird direkt eingestempelt. → **Ende: User eingestempelt.**
- **Nein** → Es wird ein Hinweis-Dialog angezeigt, der den User darüber informiert, dass die Ausstempelung vom Vortag fehlt. Anschließend wird der Zeitpunkt der Stempelung vom Vortag nachträglich erfasst. → **Ende: User eingestempelt.**

#### 2b. Ja → Entscheidung: Gesetzliche Pausenzeit eingehalten?
Wenn der User bereits eingestempelt war (Rückkehr aus Pause), wird geprüft, ob die gesetzlich vorgeschriebene Pausenzeit eingehalten wurde.

- **Ja** → Weiter zu "Ausgestempelt am Vortag?" (gleicher Pfad wie oben, Schritt 2a).
- **Nein** → Es wird ein Hinweis-Dialog angezeigt, der den User über die nicht eingehaltene Pausenzeit informiert. Danach wird eine Pause erzwungen. Im Anschluss wird der User automatisch ausgestempelt. Der Prozess springt zurück zum Start ("User stempelt ein"), sodass der User sich nach Ablauf der erzwungenen Pause erneut einstempeln kann.

## Knoten-Referenz

| Typ | Name | Beschreibung |
|-----|------|-------------|
| Start | User stempelt ein | Auslöser des Prozesses |
| Entscheidung | Bereits eingestempelt gewesen (Pause)? | Prüft ob heute schon eine Stempelung vorlag |
| Entscheidung | Ausgestempelt am Vortag? | Prüft ob Vortag korrekt abgeschlossen wurde |
| Entscheidung | Gesetzl. Pausenzeit eingehalten? | Validiert Einhaltung der gesetzlichen Pausenzeit |
| Aktion | User einstempeln | Führt die Einstempelung durch |
| Aktion | Hinweis-Dialog anzeigen (Pause) | Informiert über nicht eingehaltene Pausenzeit |
| Aktion | Pause erzwingen | Erzwingt die gesetzliche Pausenzeit |
| Aktion | User Ausstempeln | Stempelt den User aus (nach erzwungener Pause) |
| Aktion | Hinweis-Dialog anzeigen (Vortag) | Informiert über fehlende Ausstempelung vom Vortag |
| Aktion | Zeitpunkt der Stempelung vom Vortag erfassen | Nachträgliche Erfassung der Vortags-Stempelzeit |
| Ende | User eingestempelt | Erfolgreicher Abschluss des Prozesses |

## Geschäftsregeln

1. **Pausenzeit-Validierung**: Wenn ein User aus einer Pause zurückkehrt und die gesetzliche Pausenzeit nicht eingehalten wurde, wird die Pause erzwungen. Der User wird ausgestempelt und muss sich nach Ablauf der Pausenzeit erneut einstempeln.
2. **Vortags-Korrektur**: Wenn der User sich am Vortag nicht ausgestempelt hat, muss der fehlende Ausstempel-Zeitpunkt nachträglich erfasst werden, bevor die neue Einstempelung abgeschlossen wird.
3. **Zyklischer Ablauf**: Nach einer erzwungenen Pause kehrt der Prozess zum Start zurück – der User muss den Einstempel-Vorgang erneut durchlaufen.