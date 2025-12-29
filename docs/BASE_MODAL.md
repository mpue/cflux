# BaseModal - Wiederverwendbare Modal-Komponente

## Problem
Bisher wurde für jedes Modal individuell ein Escape-Handler implementiert, was zu:
- Code-Duplikation führte
- Fehleranfällig war
- Schwer zu warten war

## Lösung
Die `BaseModal`-Komponente bietet eine zentrale, wiederverwendbare Implementierung mit:
- Automatischer Escape-Taste-Unterstützung
- Overlay-Click-Handling
- Konsistentes Styling

## Verwendung

### Import
```typescript
import { BaseModal } from '../common/BaseModal';
```

### Vorher (Alt)
```tsx
const MyModal = ({ onClose, data }) => {
  const [formData, setFormData] = useState(data);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Mein Modal</h2>
        {/* Content */}
      </div>
    </div>
  );
};
```

### Nachher (Neu)
```tsx
const MyModal = ({ onClose, data }) => {
  const [formData, setFormData] = useState(data);

  return (
    <BaseModal isOpen={true} onClose={onClose}>
      <h2>Mein Modal</h2>
      {/* Content */}
    </BaseModal>
  );
};
```

## Props

| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `isOpen` | `boolean` | - | **Erforderlich.** Gibt an, ob Modal angezeigt wird |
| `onClose` | `() => void` | - | **Erforderlich.** Callback beim Schließen |
| `children` | `ReactNode` | - | **Erforderlich.** Modal-Inhalt |
| `className` | `string` | `''` | Zusätzliche CSS-Klasse |
| `closeOnEscape` | `boolean` | `true` | ESC-Taste schließt Modal |
| `closeOnOverlayClick` | `boolean` | `true` | Klick auf Overlay schließt Modal |
| `maxWidth` | `string` | `'600px'` | Maximale Breite des Modals |

## Beispiele

### Standard Modal
```tsx
<BaseModal isOpen={showModal} onClose={() => setShowModal(false)}>
  <h2>Titel</h2>
  <p>Inhalt</p>
</BaseModal>
```

### Modal ohne Escape
```tsx
<BaseModal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  closeOnEscape={false}
>
  <h2>Wichtige Aktion</h2>
  <p>Kann nicht mit ESC geschlossen werden</p>
</BaseModal>
```

### Modal ohne Overlay-Click
```tsx
<BaseModal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  closeOnOverlayClick={false}
>
  <h2>Formular</h2>
  <p>Kann nur über Button geschlossen werden</p>
</BaseModal>
```

### Breites Modal
```tsx
<BaseModal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  maxWidth="900px"
>
  <h2>Große Tabelle</h2>
  {/* Content */}
</BaseModal>
```

## Migration

### Schritt 1: Import hinzufügen
```typescript
import { BaseModal } from '../common/BaseModal';
```

### Schritt 2: Modal-Struktur ersetzen
Ersetze:
```tsx
<div className="modal-overlay" onClick={onClose}>
  <div className="modal" onClick={(e) => e.stopPropagation()}>
    {/* Content */}
  </div>
</div>
```

Mit:
```tsx
<BaseModal isOpen={true} onClose={onClose}>
  {/* Content */}
</BaseModal>
```

### Schritt 3: useEffect entfernen
Entferne manuellen Escape-Handler:
```tsx
// ENTFERNEN:
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

## Zu migrierende Komponenten

- [x] LocationsTab ✅ (Beispiel-Implementation)
- [ ] SuppliersTab
- [ ] ProjectsTab
- [ ] InvoicesTab
- [ ] CustomersTab (CustomerModal)
- [ ] ArticlesTab
- [ ] ArticleGroupsTab
- [ ] UserGroupsTab (UserGroupsDialog)
- [ ] UsersTab (UserCreateModal)
- [ ] Dashboard (PauseModal, AbsenceModal, PauseReminderModal)
- [ ] IncidentManagement
- [ ] MyApprovals

## Vorteile

✅ **Weniger Code** - Keine Wiederholung von Escape-Handler-Logic  
✅ **Konsistent** - Alle Modals verhalten sich gleich  
✅ **Wartbar** - Änderungen nur an einer Stelle  
✅ **Typsicher** - TypeScript-Props mit Dokumentation  
✅ **Flexibel** - Props für unterschiedliche Anwendungsfälle
