# Lohnperiode Neu-Berechnen

## Überblick

Das System bietet die Möglichkeit, eine bereits berechnete Lohnperiode neu zu berechnen. Dabei werden alle bestehenden Lohnabrechnungseinträge gelöscht und basierend auf den aktuellen Daten neu erstellt.

## Wann ist eine Neu-Berechnung nötig?

Eine Neu-Berechnung einer Lohnperiode ist in folgenden Fällen erforderlich:

1. **Nachträgliche Zeiteinträge**: Ein Mitarbeiter hat vergessen, Zeiten zu erfassen, und diese werden nachträglich hinzugefügt
2. **Korrektur von Zeiteinträgen**: Fehlerhafte Clock-In/Clock-Out Zeiten wurden korrigiert
3. **Änderung der Gehaltskonfiguration**: Die Lohnkonfiguration eines Mitarbeiters wurde rückwirkend angepasst
4. **Genehmigung von Abwesenheiten**: Urlaubsanträge oder Krankheitstage wurden nachträglich genehmigt
5. **Korrektur von Berechnungsfehlern**: Ein Fehler in der Berechnungslogik wurde behoben

## Funktionsweise

### Backend-Endpoint

**Route**: `POST /api/payroll/periods/:id/recalculate`

**Berechtigungen**: Nur Administratoren

**Prozess**:
1. Prüft, ob die Lohnperiode existiert
2. Löscht alle bestehenden `PayrollEntry` der Periode
3. Setzt den Status der Periode auf `DRAFT`
4. Berechnet alle Einträge neu basierend auf:
   - Aktiven Benutzern mit gültiger Gehaltskonfiguration
   - Zeiteinträgen im Periodenzeitraum
   - Genehmigten Abwesenheiten im Periodenzeitraum
5. Erstellt neue `PayrollEntry` für jeden berechtigten Mitarbeiter
6. Setzt den Status zurück auf `CALCULATED`

**Response**:
```json
{
  "message": "Payroll period recalculated successfully",
  "entries": [...],
  "deletedCount": 15
}
```

### Frontend

#### Hauptübersicht (PayrollManagement)

Der "Neu berechnen" Button erscheint:
- **Bei Status `CALCULATED`**: Nach der ersten Berechnung
- **Bei Status `APPROVED`**: Auch nach der Genehmigung kann neu berechnet werden

**Sicherheitsabfrage**: 
```
"Möchten Sie diese Lohnperiode neu berechnen? Alle bestehenden Einträge werden gelöscht."
```

#### Detail-Dialog

Im Detail-Dialog einer Lohnperiode ist ebenfalls ein "Neu berechnen" Button verfügbar für Perioden mit Status `CALCULATED` oder `APPROVED`.

Nach erfolgreicher Neu-Berechnung wird der Dialog automatisch aktualisiert.

## Einschränkungen

### Status-Einschränkungen

- **DRAFT**: Verwende den normalen "Berechnen" Button
- **PAID**: Keine Neu-Berechnung möglich (Lohnperiode wurde bereits ausgezahlt)
- **CANCELLED**: Keine Neu-Berechnung möglich (Lohnperiode wurde storniert)

### Daten-Integrität

⚠️ **Wichtig**: Bei der Neu-Berechnung gehen folgende manuell eingetragene Daten verloren:
- Individuelle Anpassungen an Lohneinträgen
- Manuell hinzugefügte Boni oder Abzüge
- Kommentare zu einzelnen Einträgen

Wenn solche manuellen Anpassungen existieren, sollten diese nach der Neu-Berechnung erneut vorgenommen werden.

## Best Practices

### Vor der Neu-Berechnung

1. **Überprüfen Sie die Datengrundlage**: Stellen Sie sicher, dass alle Zeiteinträge und Abwesenheiten korrekt erfasst sind
2. **Dokumentieren Sie manuelle Anpassungen**: Notieren Sie sich alle manuellen Änderungen, die Sie nach der Neu-Berechnung erneut vornehmen müssen
3. **Informieren Sie betroffene Mitarbeiter**: Bei wesentlichen Änderungen sollten Mitarbeiter informiert werden

### Nach der Neu-Berechnung

1. **Prüfen Sie die Ergebnisse**: Kontrollieren Sie die neu berechneten Werte auf Plausibilität
2. **Vergleichen Sie mit der Vorversion**: Falls möglich, vergleichen Sie die neuen mit den alten Werten
3. **Nehmen Sie manuelle Anpassungen vor**: Falls nötig, passen Sie einzelne Einträge manuell an
4. **Genehmigen Sie die Periode erneut**: Setzen Sie den Status zurück auf `APPROVED`

## Workflow-Beispiel

```
1. Lohnperiode "Januar 2026" hat Status APPROVED
2. Ein Mitarbeiter meldet fehlende Zeiteinträge
3. Admin trägt die Zeiten nach
4. Admin klickt "Neu berechnen" → Bestätigt Sicherheitsabfrage
5. System löscht alle Einträge und berechnet neu
6. Admin prüft die aktualisierten Werte
7. Admin genehmigt die Periode erneut
```

## API-Integration

### Beispiel: Neu-Berechnung über API

```typescript
const recalculatePayroll = async (periodId: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/payroll/periods/${periodId}/recalculate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log(`${response.data.entries.length} Einträge neu berechnet`);
    return response.data;
  } catch (error) {
    console.error('Fehler bei Neu-Berechnung:', error);
    throw error;
  }
};
```

## Datenbank-Schema

Die Funktion nutzt die Cascade-Delete-Regel:

```prisma
model PayrollEntry {
  payrollPeriod PayrollPeriod @relation(fields: [payrollPeriodId], references: [id], onDelete: Cascade)
}
```

Dies bedeutet: Wenn eine Periode gelöscht wird, werden automatisch alle zugehörigen Einträge gelöscht. Bei der Neu-Berechnung wird nur der manuelle Delete verwendet, nicht die Cascade-Regel.

## Fehlerbehandlung

Mögliche Fehler:

- **404 Not Found**: Lohnperiode existiert nicht
- **500 Internal Server Error**: Fehler bei der Berechnung (z.B. fehlende Gehaltskonfiguration)
- **403 Forbidden**: Keine Berechtigung (nur Admins)

Bei Fehlern wird eine entsprechende Fehlermeldung im Frontend angezeigt, und die bestehenden Daten bleiben unverändert.

## Siehe auch

- [Payroll Module Documentation](./PAYROLL_MODULE.md)
- [Admin Manual](./ADMIN-MANUAL.md)
- [Swiss Compliance Documentation](./SWISS_COMPLIANCE.md)
