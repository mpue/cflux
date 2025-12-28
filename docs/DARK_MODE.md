# Dark Mode Implementation

Das Frontend unterstützt jetzt einen vollständigen Dark Mode mit folgenden Features:

## Features

- **Theme Toggle Button**: Schwebender Button oben rechts auf allen Seiten
- **Automatische Persistenz**: Die Theme-Präferenz wird im localStorage gespeichert
- **Smooth Transitions**: Sanfte Übergänge zwischen Light und Dark Mode
- **CSS Variables**: Einfache Wartung durch CSS Custom Properties
- **Responsive**: Funktioniert auf allen Bildschirmgrößen

## Verwendung

Der Dark Mode Toggle ist automatisch auf allen Seiten verfügbar. Klicken Sie einfach auf das Sonnen/Mond-Symbol oben rechts, um zwischen den Modi zu wechseln.

## Theme Context

Der `ThemeContext` verwaltet das globale Theme:

```tsx
import { useTheme } from './contexts/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
};
```

## CSS Variables

Das Theme-System verwendet folgende CSS Variables:

### Light Mode (Standard)
- `--bg-primary`: #ffffff
- `--bg-secondary`: #f5f5f5
- `--bg-tertiary`: #e9ecef
- `--text-primary`: #212529
- `--text-secondary`: #6c757d
- `--card-bg`: #ffffff
- `--input-bg`: #ffffff
- etc.

### Dark Mode
- `--bg-primary`: #1a1a1a
- `--bg-secondary`: #2d2d2d
- `--bg-tertiary`: #3a3a3a
- `--text-primary`: #e9ecef
- `--text-secondary`: #adb5bd
- `--card-bg`: #2d2d2d
- `--input-bg`: #3a3a3a
- etc.

## Komponenten

### ThemeContext
- **Datei**: `src/contexts/ThemeContext.tsx`
- **Zweck**: Globales Theme-Management mit localStorage-Persistenz

### ThemeToggle
- **Datei**: `src/components/ThemeToggle.tsx`
- **Zweck**: UI-Komponente zum Umschalten des Themes

## Styling-Richtlinien

Beim Erstellen neuer Komponenten sollten Sie CSS Variables verwenden:

```css
.my-component {
  background-color: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## Browser-Unterstützung

Der Dark Mode funktioniert in allen modernen Browsern, die CSS Custom Properties unterstützen:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## Anpassung

Um zusätzliche Farben hinzuzufügen, erweitern Sie die CSS Variables in `src/index.css`:

```css
:root {
  /* Ihre neuen Light Mode Variablen */
  --custom-color: #value;
}

[data-theme='dark'] {
  /* Ihre neuen Dark Mode Variablen */
  --custom-color: #value;
}
```
