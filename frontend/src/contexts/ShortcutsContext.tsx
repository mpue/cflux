import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { PushPin as PinIcon, PushPinOutlined as PinOffIcon } from '@mui/icons-material';

// Ein anheftbarer Shortcut. `icon` ist entweder ein Schlüssel aus der Icon-Map
// der Navbar (Module aus dem "Mehr"-Menü) oder ein Emoji (Admin-Tabs).
// `source` steuert, ob beim Anzeigen die Modulberechtigung geprüft wird.
export type ShortcutItem = {
  key: string;
  label: string;
  route: string;
  icon: string;
  source?: 'module' | 'admin';
};

const STORAGE_KEY = 'moduleShortcuts';

interface ShortcutsContextValue {
  shortcuts: ShortcutItem[];
  isPinned: (route: string) => boolean;
  togglePin: (item: ShortcutItem) => void;
  openPinMenu: (e: React.MouseEvent, item: ShortcutItem) => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | undefined>(undefined);

export const useShortcuts = (): ShortcutsContextValue => {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error('useShortcuts must be used within a ShortcutsProvider');
  return ctx;
};

export const ShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; item: ShortcutItem } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  }, [shortcuts]);

  const isPinned = useCallback(
    (route: string) => shortcuts.some((s) => s.route === route),
    [shortcuts]
  );

  const togglePin = useCallback((item: ShortcutItem) => {
    setShortcuts((prev) =>
      prev.some((s) => s.route === item.route)
        ? prev.filter((s) => s.route !== item.route)
        : [...prev, item]
    );
    setCtxMenu(null);
  }, []);

  const openPinMenu = useCallback((e: React.MouseEvent, item: ShortcutItem) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  return (
    <ShortcutsContext.Provider value={{ shortcuts, isPinned, togglePin, openPinMenu }}>
      {children}
      <Menu
        open={!!ctxMenu}
        onClose={() => setCtxMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={ctxMenu ? { top: ctxMenu.y, left: ctxMenu.x } : undefined}
      >
        {ctxMenu && (
          <MenuItem onClick={() => togglePin(ctxMenu.item)}>
            {isPinned(ctxMenu.item.route) ? (
              <>
                <PinOffIcon sx={{ mr: 1 }} />
                Aus der Leiste entfernen
              </>
            ) : (
              <>
                <PinIcon sx={{ mr: 1 }} />
                Oben anheften
              </>
            )}
          </MenuItem>
        )}
      </Menu>
    </ShortcutsContext.Provider>
  );
};
