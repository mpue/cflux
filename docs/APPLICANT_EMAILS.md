# Bewerber-E-Mail-Benachrichtigungen

## Übersicht

Das Bewerbermanagementsystem verschickt automatisch E-Mails an Bewerber bei verschiedenen Events im Bewerbungsprozess.

## E-Mail-Typen

### 1. Registrierungs-Bestätigung (Verification Email)

**Wann:** Direkt nach der Registrierung eines neuen Bewerbers

**Inhalt:**
- Begrüßung
- Link zur E-Mail-Verifizierung
- Hinweis auf Bewerberportal

**Trigger:** `registerApplicant()` Service-Funktion

**Code-Beispiel:**
```typescript
const applicant = await registerApplicant({
  email: 'bewerber@example.com',
  firstName: 'Max',
  lastName: 'Mustermann',
  phone: '+41 79 123 45 67',
  position: 'Software Developer'
});
// ✅ E-Mail wird automatisch versendet
```

---

### 2. Status-Updates

**Wann:** Bei jeder Änderung des Bewerbungsstatus

**Status-Übersicht:**

| Status | E-Mail-Titel | Inhalt |
|--------|-------------|---------|
| `NEW` | Bewerbung eingegangen | Bestätigung des Eingangs |
| `SCREENING` | Bewerbung in Prüfung | Unterlagen werden geprüft |
| `INTERVIEW_SCHEDULED` | Vorstellungsgespräch geplant | Hinweis auf Termin im Portal |
| `OFFER_EXTENDED` | Vertragsangebot | Glückwunsch, Angebot vorhanden |
| `HIRED` | Einstellung bestätigt | Willkommen im Team |
| `REJECTED` | Absage | Höfliche Absage |
| `WITHDRAWN` | Bewerbung zurückgezogen | Bestätigung |

**Trigger:** `updateApplicantStatus(applicantId, status)` Service-Funktion

**Code-Beispiel:**
```typescript
await updateApplicantStatus(applicantId, 'SCREENING');
// ✅ E-Mail wird automatisch versendet
```

---

### 3. Interview-Einladungen

**Wann:** Wenn ein Vorstellungsgespräch geplant wird

**Inhalt:**
- Art des Interviews (Telefon, Video, Vor Ort, etc.)
- Datum und Uhrzeit (formatiert für Schweiz)
- Ort oder Meeting-Link
- Zusätzliche Hinweise
- Button zum Bewerberportal zur Bestätigung

**Interview-Typen:**
- `PHONE` - Telefoninterview
- `VIDEO` - Videointerview
- `ONSITE` - Persönliches Gespräch
- `TECHNICAL` - Technisches Interview
- `HR` - HR-Gespräch

**Trigger:** `scheduleInterview()` Service-Funktion

**Code-Beispiel:**
```typescript
await scheduleInterview({
  applicantId: 'abc123',
  interviewType: 'VIDEO',
  scheduledAt: new Date('2026-02-01T10:00:00'),
  duration: 60,
  meetingLink: 'https://meet.google.com/xyz-abc-def',
  interviewerIds: ['user1', 'user2'],
  notes: 'Bitte halten Sie Ihren Laptop bereit'
});
// ✅ Status wird auf INTERVIEW_SCHEDULED gesetzt
// ✅ E-Mail wird automatisch versendet
```

---

## E-Mail-Design

Alle E-Mails verwenden ein einheitliches Design:

- **Gradient Header** (Grün → Blau)
- **Responsive Layout** (max-width: 600px)
- **HTML + Plain Text** Versionen
- **Firmenname** aus System-Einstellungen
- **Call-to-Action Buttons** mit Gradient-Styling
- **Footer** mit Copyright und Jahr

---

## Konfiguration

### SMTP-Einstellungen

E-Mails werden über die SMTP-Einstellungen im **Admin-Panel** konfiguriert:
1. Admin Dashboard → Einstellungen
2. E-Mail Einstellungen Abschnitt
3. SMTP aktivieren und Daten eingeben
4. Test-E-Mail senden

### Frontend-URL

Die URL für Links im E-Mail wird über die Environment Variable gesetzt:

```bash
# .env
FRONTEND_URL=http://localhost:3002  # oder https://ihre-domain.ch
```

---

## API-Endpunkte

### Bewerber registrieren
```http
POST /api/applicants/register
Content-Type: application/json

{
  "email": "bewerber@example.com",
  "firstName": "Max",
  "lastName": "Mustermann",
  "phone": "+41 79 123 45 67",
  "position": "Software Developer"
}
```
➡️ Sendet Verifizierungs-E-Mail

---

### Status aktualisieren
```http
PATCH /api/applicants/:id/status
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "status": "INTERVIEW_SCHEDULED"
}
```
➡️ Sendet Status-Update-E-Mail

---

### Interview planen
```http
POST /api/applicants/:id/interviews
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "interviewType": "VIDEO",
  "scheduledAt": "2026-02-01T10:00:00Z",
  "duration": 60,
  "meetingLink": "https://meet.google.com/xyz",
  "interviewerIds": ["user1-id"],
  "notes": "Bitte Laptop bereithalten"
}
```
➡️ Sendet Interview-Einladungs-E-Mail

---

## Bewerberportal

Bewerber können nach E-Mail-Verifizierung:
- Login unter `/applicant/login`
- Status ihrer Bewerbung einsehen
- Dokumente hochladen
- Termine bestätigen/absagen
- Notizen einsehen

---

## Fehlerbehandlung

Alle E-Mail-Versendungen sind **non-blocking**:
- Wenn E-Mail-Versand fehlschlägt, wird der Prozess nicht abgebrochen
- Fehler werden geloggt, aber die Aktion wird trotzdem ausgeführt
- Bewerber-Registrierung/Status-Update funktioniert auch ohne E-Mail

**Log-Beispiele:**
```
✅ Verification email sent to bewerber@example.com
✅ Status update email sent to bewerber@example.com (SCREENING)
✅ Interview invitation sent to bewerber@example.com
❌ Failed to send verification email: SMTP connection error
```

---

## Testing

### Test im Development

Ohne SMTP-Konfiguration werden E-Mails in der Console geloggt:
```
⚠️  Email not sent - service not configured
Would send email to: bewerber@example.com
Subject: CFlux - E-Mail bestätigen
Body: Willkommen bei CFlux...
```

### Test mit SMTP

1. SMTP im Admin-Panel konfigurieren
2. Test-E-Mail senden (Einstellungen)
3. Bewerber registrieren
4. E-Mail sollte ankommen

---

## Erweiterungen

### Geplante Features

- [ ] **iCal/ICS Anhänge** für Interview-Termine
- [ ] **E-Mail-Vorlagen** im Admin-Panel editierbar
- [ ] **Automatische Erinnerungen** vor Interviews
- [ ] **Mehrsprachige E-Mails** (DE/EN/FR)
- [ ] **E-Mail an Interviewer** bei Termin-Planung
- [ ] **Absage-Gründe** in Absage-E-Mails (optional)

### Custom E-Mail-Templates

Zukünftig könnten E-Mail-Templates in der Datenbank gespeichert und über das Admin-Panel bearbeitet werden:

```typescript
model EmailTemplate {
  id          String   @id @default(uuid())
  key         String   @unique  // z.B. "applicant_verification"
  subject     String
  htmlBody    String   @db.Text
  textBody    String   @db.Text
  variables   Json     // {{firstName}}, {{companyName}}, etc.
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Best Practices

1. **Immer HTML + Text** - Nicht alle E-Mail-Clients unterstützen HTML
2. **Responsive Design** - Mobile-First Ansatz
3. **Klare CTAs** - Eindeutige Call-to-Action Buttons
4. **Personalisierung** - Immer Namen verwenden
5. **Fehlertoleranz** - E-Mail-Fehler nicht critical behandeln
6. **Logging** - Alle E-Mails loggen für Debugging
7. **Datenschutz** - Keine sensiblen Daten in E-Mails
8. **Test-Modus** - Vor Produktion testen
