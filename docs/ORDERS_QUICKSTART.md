# Bestellungen Modul - Schnellstart

## Übersicht

Das Bestellungen-Modul wurde erfolgreich installiert und ist einsatzbereit!

## Installation ✅

Alle erforderlichen Schritte wurden durchgeführt:

1. ✅ Prisma Schema erweitert (Order, OrderItem, OrderDelivery, OrderDeliveryItem)
2. ✅ Datenbank-Migration angewendet
3. ✅ Backend-Controller und Routes erstellt
4. ✅ Frontend-Komponenten erstellt
5. ✅ Routing integriert
6. ✅ Modul in Datenbank registriert
7. ✅ Berechtigungen für Benutzergruppen gesetzt

## Zugriff

### URL
Das Modul ist unter folgender URL erreichbar:
```
http://localhost:3000/#/orders
```

### Berechtigungen

Standardmäßig haben folgende Gruppen Zugriff:

| Gruppe | View | Create | Edit | Delete |
|--------|------|--------|------|--------|
| Admins | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ❌ | ❌ |
| Benutzer | ✅ | ✅ | ❌ | ❌ |

## Erste Schritte

### 1. Lieferanten anlegen

Bevor Sie Bestellungen erstellen, sollten Sie Lieferanten anlegen:

1. Navigieren Sie zu "Lieferanten" (Suppliers)
2. Erstellen Sie neue Lieferanten mit:
   - Name
   - Kontaktperson
   - E-Mail
   - Telefon
   - Adresse

### 2. Artikel anlegen (Optional)

Legen Sie häufig bestellte Artikel in den Stammdaten an:

1. Navigieren Sie zu "Artikel" (Articles)
2. Erstellen Sie Artikel mit:
   - Artikelnummer
   - Name
   - Beschreibung
   - Standardpreis
   - Einheit
   - MwSt-Satz

### 3. Erste Bestellung erstellen

1. Navigieren Sie zu "Bestellungen" (`/orders`)
2. Klicken Sie auf "+ Neue Bestellung"
3. Füllen Sie die Pflichtfelder aus:
   - **Titel** (z.B. "Büromaterial Q1 2026")
   - **Mindestens eine Bestellposition**
4. Optional:
   - Lieferant auswählen
   - Lieferdatum
   - Lieferadresse
   - Projekt/Kostenstelle
5. Speichern Sie die Bestellung

### 4. Freigabe-Workflow

#### Als Benutzer:
1. Öffnen Sie Ihre Entwurfs-Bestellung
2. Klicken Sie auf "Freigabe anfordern"
3. Status ändert sich zu "Angefordert"

#### Als Admin:
1. Öffnen Sie die Bestellungsliste
2. Bei Status "Angefordert" erscheinen Aktions-Buttons
3. Klicken Sie auf ✓ zum Freigeben oder ✗ zum Ablehnen

### 5. Bestellung aufgeben

Nach der Freigabe:
1. Öffnen Sie die freigegebene Bestellung
2. Klicken Sie auf "Als bestellt markieren" (📦)
3. Status ändert sich zu "Bestellt"

### 6. Wareneingang erfassen

Wenn die Lieferung eintrifft:
1. Öffnen Sie die bestellte Bestellung
2. Klicken Sie auf "Wareneingang" (📥)
3. Erfassen Sie:
   - Lieferdatum
   - Lieferschein-Nummer (optional)
   - Gelieferte Artikel und Mengen
4. Speichern - Status wird automatisch aktualisiert

## Beispiel-Workflow

```
1. Bestellung erstellen → Status: DRAFT
   ↓
2. Freigabe anfordern → Status: REQUESTED
   ↓
3. Admin genehmigt → Status: APPROVED
   ↓
4. Beim Lieferanten bestellen → Status: ORDERED
   ↓
5. Wareneingang erfassen → Status: RECEIVED
```

## API-Nutzung

Alle Endpoints sind unter `/api/orders` verfügbar:

### Bestellungen abrufen
```bash
curl http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Neue Bestellung erstellen
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Büromaterial",
    "items": [{
      "name": "Kopierpapier A4",
      "quantity": 10,
      "unit": "Packung",
      "unitPrice": 25.50,
      "vatRate": 7.7
    }]
  }'
```

### Bestellung freigeben
```bash
curl -X POST http://localhost:3001/api/orders/{id}/approve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Statistiken

Die Übersichtsseite zeigt:
- **Gesamt** - Anzahl aller Bestellungen
- **Angefordert** - Warten auf Freigabe
- **Freigegeben** - Können bestellt werden
- **Bestellt** - Bei Lieferant aufgegeben
- **Gesamtwert** - Summe aller aktiven Bestellungen

## Fehlerbehebung

### Module wird nicht angezeigt

1. Prüfen Sie die Berechtigungen Ihrer Benutzergruppe:
```sql
SELECT m.name, ma."canView", ma."canCreate", ma."canEdit", ma."canDelete"
FROM modules m
JOIN module_access ma ON m.id = ma."moduleId"
JOIN user_groups ug ON ma."userGroupId" = ug.id
WHERE m.key = 'orders' AND ug.name = 'IHR_GRUPPENNAME';
```

2. Falls keine Berechtigung existiert, führen Sie das SQL-Script erneut aus:
```bash
Get-Content db/add_orders_module.sql | docker exec -i timetracking-db psql -U timetracking -d timetracking
```

### Backend-Fehler

Starten Sie den Backend-Container neu:
```bash
docker-compose restart backend
```

### Frontend zeigt Module nicht

Leeren Sie den Browser-Cache und laden Sie die Seite neu.

## Docker-Setup

### Backend neu starten
```bash
docker-compose restart backend
```

### Logs anzeigen
```bash
docker-compose logs -f backend
```

### Datenbank-Abfragen
```bash
docker exec -it timetracking-db psql -U timetracking -d timetracking
```

## Nächste Schritte

1. **Lieferanten einrichten** - Legen Sie häufig genutzte Lieferanten an
2. **Artikel pflegen** - Erstellen Sie einen Artikel-Katalog
3. **Berechtigungen anpassen** - Passen Sie Modulzugriffe an Ihre Anforderungen an
4. **Test-Bestellung** - Erstellen Sie eine Test-Bestellung durchlaufen Sie den kompletten Workflow
5. **Schulung** - Schulen Sie Ihre Mitarbeiter im Umgang mit dem Modul

## Support

Für weitere Informationen siehe:
- **Vollständige Dokumentation:** [docs/ORDERS_MODULE.md](./ORDERS_MODULE.md)
- **API-Referenz:** [docs/ORDERS_MODULE.md#api-endpoints](./ORDERS_MODULE.md#api-endpoints)
- **Workflow-Diagramm:** [docs/ORDERS_MODULE.md#workflow](./ORDERS_MODULE.md#workflow)

## Version

**Version:** 1.0.0  
**Datum:** Januar 2026  
**Status:** Production Ready ✅

---

🎉 **Das Bestellungen-Modul ist einsatzbereit!**
