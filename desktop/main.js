const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

// Default backend URL
const DEFAULT_BACKEND_URL = 'http://localhost:5000';

// Keep a global reference of the window object
let mainWindow;

const isDev = process.argv.includes('--dev');

function showSettingsDialog() {
  const currentBackendUrl = store.get('backendUrl', DEFAULT_BACKEND_URL);
  
  const settingsWindow = new BrowserWindow({
    width: 500,
    height: 250,
    parent: mainWindow,
    modal: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Create HTML content for settings dialog
  const settingsHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Einstellungen</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h2 {
          margin-bottom: 20px;
          color: #333;
          font-size: 18px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-size: 14px;
          font-weight: 500;
        }
        input[type="text"] {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          transition: border-color 0.2s;
        }
        input[type="text"]:focus {
          outline: none;
          border-color: #4a90e2;
        }
        .button-group {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-primary {
          background-color: #4a90e2;
          color: white;
        }
        .btn-primary:hover {
          background-color: #357abd;
        }
        .btn-secondary {
          background-color: #e0e0e0;
          color: #333;
        }
        .btn-secondary:hover {
          background-color: #d0d0d0;
        }
        .hint {
          margin-top: 6px;
          font-size: 12px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Einstellungen</h2>
        <div class="form-group">
          <label for="backendUrl">Backend-URL:</label>
          <input type="text" id="backendUrl" value="${currentBackendUrl}" placeholder="http://localhost:5000">
          <div class="hint">Geben Sie die URL Ihres Backend-Servers ein (z.B. http://localhost:5000)</div>
        </div>
        <div class="button-group">
          <button class="btn-secondary" onclick="window.electron.closeSettings()">Abbrechen</button>
          <button class="btn-primary" onclick="saveSettings()">Speichern & Neu laden</button>
        </div>
      </div>
      <script>
        function saveSettings() {
          const backendUrl = document.getElementById('backendUrl').value.trim();
          if (!backendUrl) {
            alert('Bitte geben Sie eine Backend-URL ein.');
            return;
          }
          if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
            alert('Die URL muss mit http:// oder https:// beginnen.');
            return;
          }
          window.electron.saveSettings({ backendUrl });
        }
        
        // Handle Enter key
        document.getElementById('backendUrl').addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            saveSettings();
          }
        });
      </script>
    </body>
    </html>
  `;

  settingsWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(settingsHtml));
  
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    // Window closed
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false // Don't show until ready-to-show
  });

  // Restore window state if saved
  const windowState = store.get('windowState');
  if (windowState) {
    mainWindow.setBounds(windowState);
    if (windowState.isMaximized) {
      mainWindow.maximize();
    }
  }

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000'); // React dev server
  } else {
    const indexPath = path.resolve(__dirname, '..', 'frontend', 'build', 'index.html');
    console.log('Loading from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  // Open DevTools with F12 key
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Save window state before closing
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowState', {
      ...bounds,
      isMaximized: mainWindow.isMaximized()
    });
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Datei',
      submenu: [
        {
          label: 'Einstellungen',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            showSettingsDialog();
          }
        },
        { type: 'separator' },
        {
          label: 'Beenden',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Bearbeiten',
      submenu: [
        { role: 'undo', label: 'Rückgängig' },
        { role: 'redo', label: 'Wiederholen' },
        { type: 'separator' },
        { role: 'cut', label: 'Ausschneiden' },
        { role: 'copy', label: 'Kopieren' },
        { role: 'paste', label: 'Einfügen' },
        { role: 'selectAll', label: 'Alles auswählen' }
      ]
    },
    {
      label: 'Ansicht',
      submenu: [
        { role: 'reload', label: 'Neu laden' },
        { role: 'forceReload', label: 'Erzwungenes Neuladen' },
        { role: 'toggleDevTools', label: 'Entwicklertools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom zurücksetzen' },
        { role: 'zoomIn', label: 'Vergrößern' },
        { role: 'zoomOut', label: 'Verkleinern' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Vollbild' }
      ]
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Über CFlux',
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Über CFlux',
              message: 'CFlux Time Tracking System',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}`,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Dokumentation',
          click: () => {
            shell.openExternal('https://github.com/yourusername/cflux');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay open until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create window when dock icon is clicked and no other windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app crashes and errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Fehler', `Ein unerwarteter Fehler ist aufgetreten:\n\n${error.message}`);
});

// IPC Handlers
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  return store.set(key, value);
});

ipcMain.handle('store-delete', (event, key) => {
  return store.delete(key);
});

ipcMain.handle('store-clear', () => {
  return store.clear();
});

ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('open-external', (event, url) => {
  return shell.openExternal(url);
});

ipcMain.handle('save-settings', (event, settings) => {
  if (settings.backendUrl) {
    store.set('backendUrl', settings.backendUrl);
  }
  return true;
});

ipcMain.handle('close-settings', () => {
  return true;
});

ipcMain.handle('reload-app', () => {
  if (mainWindow) {
    mainWindow.reload();
  }
  return true;
});

ipcMain.handle('get-backend-url', () => {
  return store.get('backendUrl', DEFAULT_BACKEND_URL);
});

// Log application info
console.log('CFlux Desktop Application');
console.log('Version:', app.getVersion());
console.log('Electron:', process.versions.electron);
console.log('Development Mode:', isDev);
