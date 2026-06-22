import React, { useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

// Erzwingt Light Mode für den umschlossenen Bereich – unabhängig von der
// Theme-Einstellung des Benutzers. Wird für öffentliche Seiten (Startseite,
// Job-Board, Job-Detail) verwendet, die ausschließlich hell dargestellt werden.
const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const LightModeOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Light Mode auch für CSS-Variablen (data-theme auf <html>) erzwingen und beim
  // Verlassen das ursprüngliche Theme wiederherstellen.
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    return () => {
      if (previousTheme) {
        root.setAttribute('data-theme', previousTheme);
      } else {
        root.removeAttribute('data-theme');
      }
    };
  }, []);

  return <MuiThemeProvider theme={lightTheme}>{children}</MuiThemeProvider>;
};

export default LightModeOnly;
