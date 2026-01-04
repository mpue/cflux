# Medien-Modul

Das Medien-Modul ermöglicht das Hochladen, Verwalten und Organisieren verschiedener Dateitypen.

## Features

### Unterstützte Dateitypen
- 🖼️ **Bilder**: JPG, PNG, GIF, SVG, etc.
- 📄 **PDF**: PDF-Dokumente
- 📝 **Dokumente**: Word, Excel, PowerPoint, etc.
- 🎥 **Videos**: MP4, AVI, MOV, etc.
- 🎵 **Audio**: MP3, WAV, OGG, etc.
- 📦 **Archive**: ZIP, RAR, 7Z, etc.
- ⚙️ **Programme**: EXE, MSI, etc.
- 📋 **Andere**: Sonstige Dateitypen

### Funktionen

#### Upload
- Drag & Drop Upload (bis zu 100MB)
- Automatische Typerkennung basierend auf MIME-Type
- Beschreibung und Tags hinzufügen
- Öffentlich/Privat-Status festlegen

#### Verwaltung
- **Rasteransicht**: Visuelle Darstellung mit Vorschau für Bilder
- **Listenansicht**: Tabellarische Übersicht mit Details
- **Filterung**: Nach Dateityp filtern
- **Suche**: Nach Dateiname oder Beschreibung suchen
- **Tags**: Organisierung durch Tags

#### Statistiken
- Gesamtanzahl der Medien
- Verwendeter Speicherplatz
- Anzahl öffentlicher/privater Dateien
- Verteilung nach Medientyp

#### Download & Verwaltung
- Einzelne Dateien herunterladen
- Dateien löschen (inkl. physische Datei)
- Metadaten bearbeiten

## Technische Details

### Backend

#### Datenbank-Schema (Prisma)
```prisma
enum MediaType {
  IMAGE
  PDF
  DOCUMENT
  VIDEO
  AUDIO
  ARCHIVE
  EXECUTABLE
  OTHER
}

model Media {
  id              String        @id @default(uuid())
  filename        String
  originalFilename String
  mimeType        String
  fileSize        Int
  mediaType       MediaType
  path            String
  url             String?
  description     String?
  tags            String[]      @default([])
  width           Int?
  height          Int?
  duration        Int?
  isPublic        Boolean       @default(false)
  uploadedById    String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  uploadedBy      User          @relation("MediaUploadedBy", fields: [uploadedById], references: [id])
}
```

#### API-Endpunkte

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/media` | Alle Medien abrufen (mit Filtern) |
| GET | `/api/media/statistics` | Statistiken abrufen |
| GET | `/api/media/:id` | Einzelnes Medium abrufen |
| POST | `/api/media` | Neue Datei hochladen |
| PUT | `/api/media/:id` | Metadaten aktualisieren |
| DELETE | `/api/media/:id` | Medium löschen |
| GET | `/api/media/:id/download` | Datei herunterladen |
| GET | `/api/media/tags/:tag` | Medien nach Tag abrufen |

#### Multer-Konfiguration
- Upload-Verzeichnis: `backend/uploads/media/`
- Maximale Dateigröße: 100MB
- Dateinamen-Format: `media-{timestamp}-{random}.{ext}`

### Frontend

#### Komponenten
- **MediaPageWrapper**: Container-Komponente mit AppNavbar, lädt Daten und verwaltet State
- **MediaPage**: Präsentationskomponente mit Grid/List-Ansicht
- **Upload-Modal**: Datei-Upload mit Metadaten
- **Detail-Modal**: Detailansicht für einzelne Medien

#### Services
- `MediaService`: Klassen-basierter Service für alle API-Aufrufe
- Unterstützung für Filter, Suche und Tags
- TypeScript-Typen für alle Datenstrukturen

## Setup & Installation

### 1. Datenbank-Migration
```bash
cd backend
npx prisma migrate dev --name add_media_module
```

### 2. Modul in Datenbank eintragen
```bash
cd backend
npx ts-node prisma/seedMediaModule.ts
```

### 3. Upload-Verzeichnis erstellen
Das Verzeichnis wird automatisch beim ersten Upload erstellt, kann aber auch manuell erstellt werden:
```bash
mkdir -p backend/uploads/media
```

### 4. Backend neu starten
```bash
cd backend
npm run dev
```

### 5. Frontend neu kompilieren
```bash
cd frontend
npm start
```

## Verwendung

### Dateien hochladen
1. Auf "Medien" in der Navigation klicken
2. "📤 Datei hochladen" Button klicken
3. Datei auswählen
4. Optional: Beschreibung und Tags hinzufügen
5. Optional: "Öffentlich zugänglich" aktivieren
6. "Hochladen" klicken

### Dateien suchen
1. Medientyp-Filter verwenden
2. Suchfeld für Dateiname/Beschreibung nutzen
3. Zwischen Raster- und Listenansicht wechseln

### Dateien herunterladen
- In der Listenansicht: "⬇️ Download" Button
- In der Rasteransicht: Auf "⬇️" Button klicken
- In der Detailansicht: "⬇️ Herunterladen" Button

### Dateien löschen
- In der Listenansicht: "🗑️ Löschen" Button
- In der Rasteransicht: Auf "🗑️" Button klicken
- In der Detailansicht: "🗑️ Löschen" Button

⚠️ **Achtung**: Das Löschen einer Datei entfernt sowohl den Datenbankeintrag als auch die physische Datei permanent!

## Integration in Intranet (Vorbereitung)

Das Medien-Modul ist so konzipiert, dass Medien später in Intranet-Seiten eingebunden werden können:

1. **Bilder in Content einfügen**: Markdown/HTML-Editor mit Media-Browser
2. **PDF-Dokumente einbetten**: Inline-PDF-Viewer
3. **Downloads anbieten**: Download-Links in Intranet-Seiten

### Geplante Features
- [ ] Media-Browser für Intranet-Editor
- [ ] Drag & Drop von Medien in Editor
- [ ] Automatische Bildoptimierung
- [ ] Thumbnail-Generierung
- [ ] Bildergalerien
- [ ] Video-Player Integration

## Berechtigungen

Über das Modul-Berechtigungssystem können für jede Benutzergruppe folgende Rechte vergeben werden:

- **Ansehen**: Medien anzeigen und herunterladen
- **Erstellen**: Neue Medien hochladen
- **Bearbeiten**: Metadaten (Beschreibung, Tags, Status) bearbeiten
- **Löschen**: Medien dauerhaft entfernen

Standard-Berechtigungen:
- **Admin**: Alle Rechte
- **Manager**: Ansehen, Erstellen, Bearbeiten
- **Mitarbeiter**: Ansehen

## Sicherheitshinweise

1. **Dateityp-Validierung**: Basiert auf MIME-Type
2. **Größenlimit**: 100MB pro Datei
3. **Zugriffskontrolle**: Über Benutzergruppen
4. **Öffentlich/Privat**: Status-Flag für externe Freigabe
5. **Upload-Verzeichnis**: Außerhalb des Web-Root

⚠️ **Wichtig**: Bei Bedarf sollte eine zusätzliche Virenscanner-Integration implementiert werden!

## Troubleshooting

### Upload schlägt fehl
- Prüfen ob `backend/uploads/media` Verzeichnis existiert
- Schreibrechte für das Upload-Verzeichnis überprüfen
- Dateigröße unter 100MB?
- Backend-Logs überprüfen

### Bilder werden nicht angezeigt
- CORS-Einstellungen überprüfen
- Pfad zur Datei korrekt? (`/uploads/media/...`)
- Datei existiert im Dateisystem?

### Download funktioniert nicht
- Browser-Konsole auf Fehler prüfen
- API-Response überprüfen
- Content-Disposition Header korrekt gesetzt?
