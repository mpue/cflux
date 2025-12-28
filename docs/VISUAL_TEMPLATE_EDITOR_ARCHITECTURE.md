# Architektur des Visuellen Template-Editors

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │            InvoiceTemplateEditor (Split-Screen)                   │  │
│  ├────────────────────────────┬──────────────────────────────────────┤  │
│  │     Editor Panel          │       Preview Panel                  │  │
│  │  ┌──────────────────────┐ │  ┌──────────────────────────────┐  │  │
│  │  │  Tabs:               │ │  │   InvoicePreview             │  │  │
│  │  │  • Firmendaten       │ │  │                              │  │  │
│  │  │  • Texte             │ │  │  ┌────────────────────────┐ │  │  │
│  │  │  • Design ◄──────────┼─┼──┼──┤ Draggable Logo        │ │  │  │
│  │  │    - LogoUpload      │ │  │  │ [Drag & Drop]         │ │  │  │
│  │  │    - Color Picker    │ │  │  │ [Resize Handle]       │ │  │  │
│  │  │  • Einstellungen     │ │  │  └────────────────────────┘ │  │  │
│  │  └──────────────────────┘ │  │                              │  │  │
│  │                            │  │  Company Info                │  │  │
│  │  Form Data State           │  │  Customer Address            │  │  │
│  │  ↓                         │  │  Invoice Details             │  │  │
│  │  onChange handlers         │  │  Items Table                 │  │  │
│  │  ↓                         │  │  Totals & VAT                │  │  │
│  │  Live Update ──────────────┼──┼─→ Payment Info               │  │  │
│  │                            │  │  Footer                      │  │  │
│  │                            │  │                              │  │  │
│  └────────────────────────────┴──┴──────────────────────────────────┘  │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         LogoUpload                                │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  Drag & Drop Zone                                          │  │  │
│  │  │  • File Selection                                          │  │  │
│  │  │  • Validation (type, size)                                 │  │  │
│  │  │  • Upload Progress                                         │  │  │
│  │  │  • Preview                                                 │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Requests
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Backend (Node.js/Express)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     API Routes                                    │  │
│  │  POST   /api/uploads/logo          ──┐                           │  │
│  │  DELETE /api/uploads/:filename     ──┤                           │  │
│  │  GET    /api/invoice-templates     ──┤                           │  │
│  │  POST   /api/invoice-templates     ──┤                           │  │
│  │  PUT    /api/invoice-templates/:id ──┤                           │  │
│  └───────────────────────────────────────┤                           │  │
│                                          │                           │  │
│  ┌───────────────────────────────────────▼───────────────────────┐  │  │
│  │                    Middleware                                  │  │  │
│  │  • authenticate()     - JWT validation                         │  │  │
│  │  • authorize(ADMIN)   - Role check                             │  │  │
│  │  • multer()          - File upload handling                    │  │  │
│  └───────────────────────────────────────┬───────────────────────┘  │  │
│                                          │                           │  │
│  ┌───────────────────────────────────────▼───────────────────────┐  │  │
│  │                    Controllers                                 │  │  │
│  │                                                                 │  │  │
│  │  upload.controller.ts                                          │  │  │
│  │  ├─ uploadLogo()       ──┐                                     │  │  │
│  │  │  - Validate file      │                                     │  │  │
│  │  │  - Generate UUID      │                                     │  │  │
│  │  │  - Save to disk       ├──→ /backend/uploads/uuid.png        │  │  │
│  │  │  - Return URL         │                                     │  │  │
│  │  └─ deleteUpload()     ──┘                                     │  │  │
│  │                                                                 │  │  │
│  │  invoiceTemplate.controller.ts                                 │  │  │
│  │  ├─ getAllTemplates()                                          │  │  │
│  │  ├─ getTemplateById()                                          │  │  │
│  │  ├─ createTemplate()    ──┐                                    │  │  │
│  │  └─ updateTemplate()    ──┤                                    │  │  │
│  └───────────────────────────┼────────────────────────────────────┘  │  │
│                               │                                       │  │
│                               ▼                                       │  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Prisma ORM                                 │  │
│  │                                                                  │  │
│  │  InvoiceTemplate Model:                                         │  │
│  │  {                                                               │  │
│  │    id: string                                                    │  │
│  │    name: string                                                  │  │
│  │    companyName: string                                           │  │
│  │    logoUrl?: string                                              │  │
│  │    logoPosition?: string  // JSON: {x,y,width,height}           │  │
│  │    logoAlignment: string                                         │  │
│  │    primaryColor: string                                          │  │
│  │    ...                                                           │  │
│  │  }                                                               │  │
│  └──────────────────────────────┬──────────────────────────────────┘  │
│                                 │                                     │  │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │   PostgreSQL Database        │
                    │                              │
                    │  Table: invoice_templates    │
                    │  ┌────────────────────────┐  │
                    │  │ id                     │  │
                    │  │ name                   │  │
                    │  │ logoUrl                │  │
                    │  │ logoPosition (TEXT)    │  │ ◄─ JSON string
                    │  │ logoAlignment          │  │
                    │  │ ...                    │  │
                    │  └────────────────────────┘  │
                    └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          File System                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  backend/uploads/                                                         │
│  ├─ uuid-1.png          ◄─── Uploaded logo files                        │
│  ├─ uuid-2.jpg                                                           │
│  └─ uuid-3.svg                                                           │
│                                                                           │
│  Served statically via: GET /uploads/:filename                           │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Datenfluss

### 1. Logo Upload
```
User Action (Drag & Drop)
    ↓
LogoUpload Component
    ↓
File Validation (client-side)
    ↓
FormData with file
    ↓
POST /api/uploads/logo
    ↓
Multer Middleware (file handling)
    ↓
upload.controller.uploadLogo()
    ↓
Save to /backend/uploads/
    ↓
Return URL: http://localhost:3001/uploads/uuid.png
    ↓
Update formData.logoUrl
    ↓
InvoicePreview shows logo
```

### 2. Logo Positioning
```
User Action (Drag & Drop in Preview)
    ↓
InvoicePreview onMouseDown
    ↓
Track mouse movement
    ↓
Update local position state
    ↓
Call onLogoPositionChange callback
    ↓
InvoiceTemplateEditor updates formData.logoPosition
    ↓
On Save: POST/PUT /api/invoice-templates
    ↓
Save to database as JSON string
```

### 3. Live Preview
```
User changes any field
    ↓
handleChange() updates formData
    ↓
React re-renders InvoicePreview
    ↓
Preview shows updated data instantly
    ↓
No server call until Save button
```

## Komponenten-Hierarchie

```
InvoiceTemplatesPage
└─ InvoiceTemplateEditor
   ├─ Editor Panel (left)
   │  ├─ Form Fields
   │  ├─ Tabs
   │  │  ├─ Company Tab
   │  │  ├─ Text Tab
   │  │  ├─ Design Tab
   │  │  │  └─ LogoUpload ◄─── File upload component
   │  │  └─ Settings Tab
   │  └─ Action Buttons
   │
   └─ Preview Panel (right)
      └─ InvoicePreview
         ├─ Draggable Logo
         ├─ Company Info
         ├─ Customer Address
         ├─ Invoice Details
         ├─ Items Table
         └─ Footer
```

## State Management

```typescript
InvoiceTemplateEditor State:
{
  formData: {
    name: string,
    logoUrl?: string,          // Set by LogoUpload
    logoPosition?: string,     // Set by InvoicePreview drag
    logoAlignment: string,
    primaryColor: string,
    companyName: string,
    // ... all other fields
  },
  activeTab: 'company' | 'text' | 'style' | 'settings',
  loading: boolean,
  error: string | null,
  success: string | null
}
```

## Sicherheitsebenen

```
Request Flow:
Client → authenticate() → authorize(ADMIN) → Controller → Database

Upload Security:
- MIME type validation
- File size limit (5MB)
- UUID filenames (prevent overwrites)
- Path traversal prevention
- Admin-only access
```
