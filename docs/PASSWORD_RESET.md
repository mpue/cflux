# Passwort-Reset-Funktion

## Übersicht

Das System verfügt über einen modernen, sicheren Passwort-Reset-Prozess mit zeitlich begrenzten Tokens.

## Funktionsweise

### 1. Passwort-Reset anfordern
- Benutzer klickt auf "Passwort vergessen?" im Login
- Gibt seine E-Mail-Adresse ein
- System generiert einen sicheren Token (SHA-256 Hash)
- Token wird in der Datenbank mit 1-Stunden-Ablaufzeit gespeichert
- E-Mail mit Reset-Link wird versendet

### 2. Passwort zurücksetzen
- Benutzer klickt auf den Link in der E-Mail
- Token wird automatisch validiert
- Bei gültigem Token: Formular zum Setzen eines neuen Passworts
- Nach erfolgreichem Reset: Automatische Weiterleitung zum Login

## Sicherheitsfeatures

✅ **Token-Hashing**: Reset-Tokens werden als SHA-256 Hash gespeichert
✅ **Zeitliche Begrenzung**: Tokens sind nur 1 Stunde gültig
✅ **Einmalige Verwendung**: Token wird nach Verwendung gelöscht
✅ **E-Mail-Enumeration-Schutz**: Immer gleiche Antwort, unabhängig ob E-Mail existiert
✅ **Passwort-Validierung**: Mindestlänge 6 Zeichen
✅ **Audit-Log**: Alle Aktionen werden geloggt

## API-Endpunkte

### POST /api/auth/request-password-reset
Fordert einen Password-Reset an.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /api/auth/verify-reset-token
Überprüft, ob ein Token gültig ist.

**Request Body:**
```json
{
  "token": "abc123..."
}
```

**Response:**
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Setzt das Passwort mit einem gültigen Token zurück.

**Request Body:**
```json
{
  "token": "abc123...",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

## Frontend-Routen

- `/forgot-password` - Formular zum Anfordern des Reset-Links
- `/reset-password?token=xxx` - Formular zum Setzen des neuen Passworts
- Im Login-Screen: Link "Passwort vergessen?"

## E-Mail-Konfiguration

Die E-Mail-Einstellungen werden **nicht mehr über Environment Variables**, sondern **über das Admin-Panel** konfiguriert:

### Konfiguration im Admin-Panel

1. Als Administrator anmelden
2. **Admin Dashboard** → **Einstellungen** Tab öffnen
3. Zum Abschnitt **E-Mail Einstellungen** scrollen
4. Folgende Felder ausfüllen:
   - **SMTP aktiviert**: Häkchen setzen
   - **SMTP Host**: z.B. `smtp.gmail.com`
   - **SMTP Port**: z.B. `587` (oder `465` für SSL)
   - **SMTP Secure**: Aktivieren für Port 465
   - **SMTP Benutzername**: Ihr E-Mail-Account
   - **SMTP Passwort**: Ihr E-Mail-Passwort oder App-Passwort
   - **Absender E-Mail**: z.B. `noreply@ihre-firma.ch`
   - **Absender Name**: z.B. `Ihre Firma Zeiterfassung`
5. **Test-E-Mail senden** Button verwenden, um die Konfiguration zu testen
6. **Speichern**

### Environment Variables

Nur noch **eine** Environment Variable wird benötigt:

```bash
# Frontend URL (für Reset-Links in E-Mails)
FRONTEND_URL="http://localhost:3000"  # oder https://ihre-domain.ch
```

Diese wird in der `backend/.env` Datei gesetzt.

### Beispiel-Konfigurationen

**Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- Secure: `false`
- User: Ihre Gmail-Adresse
- Pass: App-Passwort (siehe unten)

**App-Passwort für Gmail generieren:**
1. Google Account → Sicherheit → 2-Faktor-Authentifizierung aktivieren
2. App-Passwörter → "Mail" auswählen
3. Generiertes Passwort kopieren und in SMTP Passwort eintragen

**SendGrid:**
- Host: `smtp.sendgrid.net`
- Port: `587`
- User: `apikey`
- Pass: Ihr SendGrid API Key

**Mailgun:**
- Host: `smtp.mailgun.org`  
- Port: `587`
- User: Ihr Mailgun SMTP Username
- Pass: Ihr Mailgun SMTP Passwort

**Office 365:**
- Host: `smtp.office365.com`
- Port: `587`
- User: Ihre Office 365 E-Mail
- Pass: Ihr Passwort

## Fallback-Modus

Wenn SMTP im Admin-Panel nicht aktiviert oder nicht konfiguriert ist:
- System funktioniert weiterhin
- Reset-Token wird in die Backend-Console geloggt (für Development/Testing)
- Keine E-Mails werden versendet
- Warnung in den Logs: `ℹ️  Email service not configured`

## Testing

### Test ohne E-Mail-Konfiguration

1. Backend ohne SMTP-Konfiguration starten
2. Auf `/forgot-password` gehen und E-Mail eingeben
3. Token aus Backend-Console-Log kopieren:
   ```
   Would send email to: user@example.com
   Subject: Passwort zurücksetzen
   ```
4. Manuell zu `/reset-password?token=COPIED_TOKEN` navigieren
5. Neues Passwort setzen

### Test mit E-Mail-Konfiguration

1. SMTP im Admin-Panel konfigurieren
2. **Test-E-Mail senden** Button verwenden
3. Wenn Test erfolgreich: Passwort-Reset-Flow testen
4. E-Mail sollte im Posteingang ankommen
5. Auf Link in E-Mail klicken
6. Neues Passwort setzen

## Deployment-Hinweise

### Docker-Umgebung

Nur die FRONTEND_URL muss in der `.env` oder `docker-compose.yml` gesetzt werden:

```yaml
services:
  backend:
    environment:
      - FRONTEND_URL=https://ihre-domain.ch
```

**Wichtig:** SMTP-Einstellungen werden über das Admin-Panel konfiguriert, nicht über Environment Variables!

### Produktion

**Wichtig für Produktion:**

1. ✅ HTTPS für Frontend-URL verwenden (`FRONTEND_URL=https://ihre-domain.ch`)
2. ✅ Zuverlässigen SMTP-Dienst im Admin-Panel einrichten
3. ✅ Test-E-Mail vor Produktiv-Schaltung senden
4. ✅ Rate-Limiting für `/api/auth/request-password-reset` implementieren (z.B. max. 3 Anfragen pro 15 Min.)
5. ✅ Monitoring für fehlgeschlagene E-Mail-Versendungen
6. ✅ SMTP-Passwort sicher speichern (wird in DB verschlüsselt gespeichert)

## Troubleshooting

### E-Mails kommen nicht an

1. **SMTP-Konfiguration prüfen**
   ```bash
   # Backend-Logs prüfen
   docker-compose logs -f backend | grep -i email
   ```

2. **Firewall/Port prüfen**
   - Port 587 (STARTTLS) oder 465 (SSL) muss offen sein
   - Einige Provider blockieren ausgehende SMTP-Verbindungen

3. **Spam-Ordner prüfen**
   - E-Mails können im Spam landen
   - SPF/DKIM-Records für Produktionsumgebung konfigurieren

4. **SMTP-Credentials testen**
   ```bash
   cd backend
   node -e "const nodemailer = require('nodemailer'); const t = nodemailer.createTransport({host:'smtp.gmail.com',port:587,auth:{user:'your-email',pass:'your-pass'}}); t.verify().then(console.log).catch(console.error);"
   ```

### Token ungültig/abgelaufen

- Token sind nur 1 Stunde gültig
- Nach Verwendung werden sie automatisch gelöscht
- Benutzer muss neuen Reset-Link anfordern

## UI/UX Features

- 🎨 Modernes, responsives Design (wie Login-Seite)
- ✅ Inline-Validierung
- 📧 Visuelles Feedback (Erfolgs-/Fehlermeldungen)
- ⏱️ Automatische Weiterleitung nach erfolgreichem Reset
- 🔗 Breadcrumb-Links zurück zum Login
- 📱 Mobile-optimiert

## Erweiterungsmöglichkeiten

### Zukünftige Features

- [ ] 2FA-Support für Password-Reset
- [ ] Benachrichtigung bei erfolgreichem Reset
- [ ] Passwort-Stärke-Anzeige
- [ ] Passwort-Historie (letzte 5 Passwörter nicht erlauben)
- [ ] Rate-Limiting (max. 3 Anfragen pro 15 Minuten)
- [ ] CAPTCHA bei wiederholten Anfragen
- [ ] SMS-basierter Reset als Alternative
