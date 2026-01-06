# Time Tracking System - Project Setup

## Project Overview
Complete time tracking system with TypeScript, Node.js backend, React frontend, and PostgreSQL database.

## Setup Steps
- [x] Create copilot-instructions.md
- [x] Scaffold backend project structure
- [x] Scaffold frontend project structure
- [x] Setup database models and migrations
- [x] Implement backend API endpoints
- [x] Create frontend components
- [x] Install dependencies and compile
- [x] Create documentation
- [x] Implement Intranet Module with Attachments (Jan 2026)

## Technology Stack
- Frontend: React with TypeScript
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT

## Recent Updates (January 2026)

### Intranet Module - Attachment Functionality ✅
- **Revisionssichere Attachments** an DocumentNodes
- **Separate Versionierung** unabhängig von Node-Versionen
- **Soft-Delete** für vollständige Revisionssicherheit
- **API:** 8 neue Endpunkte für Attachment-Management
- **Frontend:** Vollständige UI mit Upload, Download, Versionen
- **Dokumentation:** docs/INTRANET_ATTACHMENTS.md

Siehe: `INTRANET_ATTACHMENTS_IMPLEMENTATION.md` für Details

### Intranet Module - Intelligent Search ✅
- **Volltext-Suche** in Nodes, Attachments, Versionen
- **Relevanz-Ranking** mit Score-basierter Sortierung
- **Snippet-Highlighting** zeigt Kontext der Treffer
- **Type-Filter** (Alle, Dokumente, Anhänge, Versionen)
- **Berechtigungen** respektiert Group Permissions
- **API:** 2 Endpunkte (`/search`, `/search/suggestions`)
- **Frontend:** IntranetSearch Component mit Auto-Complete
- **Dokumentation:** docs/INTRANET_SEARCH.md

## Next Steps

To run the application:

1. Install PostgreSQL and create a database
2. Configure the `.env` file in the backend folder
3. Run `npm install` in both backend and frontend folders
4. Run `npm run prisma:migrate` in backend folder
5. Run `npm run dev` in backend folder
6. Run `npm start` in frontend folder
7. Register a user and set first user as admin in database
