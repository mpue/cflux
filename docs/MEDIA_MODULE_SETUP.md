# Medien-Modul - Setup-Anleitung

Diese Anleitung führt durch die Installation und Konfiguration des Medien-Moduls.

## Schritt 1: Datenbank-Migration erstellen und ausführen

```powershell
cd backend
npx prisma migrate dev --name add_media_module
```

Dies erstellt:
- Die `Media` Tabelle in der Datenbank
- Das `MediaType` Enum
- Die Relation zum `User` Modell

## Schritt 2: Prisma Client neu generieren

```powershell
npx prisma generate
```

## Schritt 3: Modul-Berechtigung in Datenbank eintragen

```powershell
npx ts-node prisma/seedMediaModule.ts
```

Dies erstellt:
- Das Medien-Modul in der `modules` Tabelle
- Standard-Berechtigungen für alle Benutzergruppen

## Schritt 4: Backend-Dependencies installieren (falls nötig)

Multer sollte bereits installiert sein, falls nicht:

```powershell
npm install multer
npm install --save-dev @types/multer
```

## Schritt 5: Upload-Verzeichnis erstellen

Das Verzeichnis wird automatisch erstellt, kann aber auch manuell angelegt werden:

```powershell
mkdir -p uploads/media
```

## Schritt 6: Backend neu starten

```powershell
npm run dev
```

Backend läuft auf: `http://localhost:3001`

## Schritt 7: Frontend neu kompilieren (optional)

Falls das Frontend nicht automatisch neu geladen wird:

```powershell
cd ../frontend
npm start
```

Frontend läuft auf: `http://localhost:3000`

## Verifizierung

### 1. Backend-API testen

```powershell
# Statistiken abrufen (erfordert Authentication Token)
curl http://localhost:3001/api/media/statistics -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Frontend-Navigation prüfen

1. Im Browser einloggen
2. Auf das "Mehr" Menü (⋮) in der Navbar klicken
3. "📋 Medien" sollte im Menü erscheinen
4. Medien-Seite öffnet sich mit AppNavbar

### 3. Ersten Upload testen

1. "📤 Datei hochladen" klicken
2. Eine Testdatei auswählen
3. Optional Beschreibung/Tags eingeben
4. "Hochladen" klicken
5. Datei sollte in der Liste erscheinen

## Berechtigungen konfigurieren

Als Admin:

1. Zu `/module-permissions` navigieren
2. "Medien" Modul auswählen
3. Für jede Benutzergruppe Rechte anpassen:
   - **Ansehen**: Medien ansehen und herunterladen
   - **Erstellen**: Neue Dateien hochladen
   - **Bearbeiten**: Metadaten ändern
   - **Löschen**: Medien entfernen

## Troubleshooting

### Problem: Migration schlägt fehl

**Lösung**: Prüfen ob DATABASE_URL in `.env` korrekt ist:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/cflux"
```

### Problem: Upload-Fehler "ENOENT: no such file or directory"

**Lösung**: Upload-Verzeichnis manuell erstellen:

```powershell
cd backend
mkdir -p uploads/media
```

### Problem: "Module not found: mediaService"

**Lösung**: TypeScript neu kompilieren:

```powershell
cd backend
npm run build
npm run dev
```

### Problem: Medien-Menüpunkt erscheint nicht

**Lösung 1**: Seeding-Script erneut ausführen:

```powershell
cd backend
npx ts-node prisma/seedMediaModule.ts
```

**Lösung 2**: Browser-Cache leeren und Seite neu laden

### Problem: Bilder werden nicht angezeigt

**Lösung**: CORS-Einstellungen in `backend/src/index.ts` überprüfen:

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

Und in `.env`:

```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## Nächste Schritte

Nach erfolgreicher Installation können folgende Erweiterungen vorgenommen werden:

1. **Bildoptimierung**: Integration von sharp für automatische Thumbnail-Generierung
2. **Video-Vorschau**: FFmpeg-Integration für Video-Thumbnails
3. **Cloud-Storage**: Migration zu AWS S3 oder Azure Blob Storage
4. **Intranet-Integration**: Media-Browser für den Intranet-Editor
5. **Virenscanner**: Integration eines Virenscanners für Uploads

## Support

Bei Problemen:
1. Backend-Logs überprüfen (`backend/logs`)
2. Browser-Konsole auf Fehler prüfen
3. Datenbank-Verbindung testen
4. Dokumentation in `docs/MEDIA_MODULE.md` lesen
