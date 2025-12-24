import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Material-UI Theme
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      ...(theme === 'dark' ? {
        primary: {
          main: '#667eea',
          light: '#8b9bff',
          dark: '#4c5fd5',
        },
        secondary: {
          main: '#764ba2',
          light: '#a977d6',
          dark: '#5a3778',
        },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#b0b0b0',
        },
        divider: '#3a3a3a',
        error: {
          main: '#ef5350',
        },
        warning: {
          main: '#ff9800',
        },
        success: {
          main: '#66bb6a',
        },
        info: {
          main: '#29b6f6',
        },
      } : {
        primary: {
          main: '#667eea',
          light: '#8b9bff',
          dark: '#4c5fd5',
        },
        secondary: {
          main: '#764ba2',
          light: '#a977d6',
          dark: '#5a3778',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
        text: {
          primary: '#212529',
          secondary: '#6c757d',
        },
      }),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: theme === 'dark' ? {
          body: {
            scrollbarColor: '#4a4a4a #1e1e1e',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: '12px',
              height: '12px',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              backgroundColor: '#4a4a4a',
              minHeight: 24,
              border: '3px solid #1e1e1e',
            },
            '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
              backgroundColor: '#5a5a5a',
            },
            '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
              backgroundColor: '#5a5a5a',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#5a5a5a',
            },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              backgroundColor: '#1e1e1e',
            },
          },
        } : undefined,
      },
      MuiPaper: {
        styleOverrides: {
          root: theme === 'dark' ? {
            backgroundImage: 'none',
            backgroundColor: '#1e1e1e',
          } : undefined,
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: theme === 'dark' ? {
            backgroundImage: 'none',
            backgroundColor: '#1e1e1e',
          } : undefined,
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: theme === 'dark' ? {
            '& .MuiInputBase-root': {
              backgroundColor: '#2d2d2d',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#4a4a4a',
              },
              '&:hover fieldset': {
                borderColor: '#667eea',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
              },
            },
          } : undefined,
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: theme === 'dark' ? {
            backgroundColor: '#2d2d2d',
            '&:hover': {
              backgroundColor: '#2d2d2d',
            },
          } : undefined,
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: theme === 'dark' ? {
            '&:hover': {
              backgroundColor: '#2d2d2d',
            },
            '&.Mui-selected': {
              backgroundColor: '#3a3a3a',
              '&:hover': {
                backgroundColor: '#3a3a3a',
              },
            },
          } : undefined,
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: theme === 'dark' ? {
            borderColor: '#3a3a3a',
          } : undefined,
        },
      },
      MuiChip: {
        styleOverrides: {
          root: theme === 'dark' ? {
            backgroundColor: '#2d2d2d',
          } : undefined,
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
