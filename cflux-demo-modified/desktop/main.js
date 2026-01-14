const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

const store = new Store();

// Backend process reference
let backendProcess = null;
let backendPort = 3001;

// Keep a global reference of the window object
let mainWindow;

const isDev = process.argv.includes('--dev');

// Function to find an available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Function to start the backend server
async function startBackend() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🚀 Starting integrated backend...');
      
      // Find available port
      backendPort = await findAvailablePort(3001);
      console.log('📍 Backend will run on port:', backendPort);
      
      // Get paths
      const isPackaged = app.isPackaged;
      const backendPath = isPackaged 
        ? path.join(process.resourcesPath, 'backend')
        : path.join(__dirname, '..', 'backend');
      
      const backendEntry = path.join(backendPath, 'dist', 'index.js');
      
      // Database path in user data directory
      const dbPath = path.join(app.getPath('userData'), 'cflux-demo.db');
      const dbUrl = `file:${dbPath}`;
      
      console.log('📂 Backend path:', backendPath);
      console.log('💾 Database path:', dbPath);
      
      // Check if backend exists
      if (!fs.existsSync(backendEntry)) {
        throw new Error(`Backend not found at: ${backendEntry}`);
      }
      
      // Environment variables for backend
      const env = {
        ...process.env,
        DATABASE_URL: dbUrl,
        PORT: backendPort.toString(),
        NODE_ENV: 'production',
        JWT_SECRET: 'demo-jwt-secret-change-in-production',
        JWT_EXPIRES_IN: '7d',
        CORS_ORIGIN: '*'
      };
      
      // Check if database needs initialization
      const needsInit = !fs.existsSync(dbPath);
      
      if (needsInit) {
        console.log('📦 First run detected - initializing database...');
        
        // Run Prisma migrations
        const prismaPath = path.join(backendPath, 'node_modules', '.bin', 'prisma');
        const prismaMigrate = spawn(prismaPath, ['migrate', 'deploy'], {
          env: {
            ...env,
            DATABASE_URL: dbUrl
          },
          cwd: backendPath,
          shell: true
        });
        
        await new Promise((res, rej) => {
          prismaMigrate.on('close', (code) => {
            if (code === 0) {
              console.log('✅ Database initialized');
              res();
            } else {
              rej(new Error('Failed to initialize database'));
            }
          });
        });
      }
      
      // Start backend process
      backendProcess = spawn('node', [backendEntry], {
        env,
        cwd: backendPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Log backend output
      backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend]: ${data.toString().trim()}`);
      });
      
      backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error]: ${data.toString().trim()}`);
      });
      
      backendProcess.on('error', (error) => {
        console.error('Failed to start backend:', error);
        reject(error);
      });
      
      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        backendProcess = null;
      });
      
      // Wait for backend to be ready
      let retries = 0;
      const maxRetries = 30;
      
      const checkBackend = async () => {
        try {
          const http = require('http');
          return new Promise((res, rej) => {
            const req = http.get(`http://localhost:${backendPort}/health`, (response) => {
              if (response.statusCode === 200) {
                res(true);
              } else {
                rej(false);
              }
            });
            req.on('error', () => rej(false));
            req.setTimeout(1000);
          });
        } catch {
          return false;
        }
      };
      
      const waitForBackend = async () => {
        const isReady = await checkBackend().catch(() => false);
        
        if (isReady) {
          console.log('✅ Backend is ready!');
          resolve(backendPort);
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(waitForBackend, 1000);
        } else {
          reject(new Error('Backend failed to start'));
        }
      };
      
      waitForBackend();
      
    } catch (error) {
      console.error('Error starting backend:', error);
      reject(error);
    }
  });
}

// Function to stop the backend
function stopBackend() {
  if (backendProcess) {
    console.log('🛑 Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// Function to generate modified HTML with current backend URL
function generateModifiedHTML() {
  const basePath = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');
  const indexPath = path.join(basePath, 'frontend', 'build', 'index.html');
  
  // Read and modify index.html
  let htmlContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Remove CSP meta tag
  htmlContent = htmlContent.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/gi, '');
  
  // Add base tag for correct asset loading
  const buildDir = path.dirname(indexPath).replace(/\\/g, '/');
  const baseTag = `<base href="file:///${buildDir}/">`;
  htmlContent = htmlContent.replace('<head>', '<head>' + baseTag);
  
  // Inject backend URL
  const backendUrl = `http://localhost:${backendPort}`;
  const injectionScript = `<script>window.ELECTRON_BACKEND_URL = '${backendUrl}'; console.log('Backend URL set:', window.ELECTRON_BACKEND_URL);</script>`;
  htmlContent = htmlContent.replace('<script', injectionScript + '<script');
  
  // Add debug script
  const debugScript = `<script>
    setTimeout(() => {
      const root = document.getElementById('root');
      console.log('Root element:', root);
      console.log('Root innerHTML length:', root ? root.innerHTML.length : 0);
      if (root && root.innerHTML.length === 0) {
        console.error('React did not render! Root element is empty.');
      }
    }, 2000);
  </script>`;
  htmlContent = htmlContent.replace('</body>', debugScript + '</body>');
  
  // Create temporary file
  const tmpDir = app.getPath('temp');
  const tmpPath = path.join(tmpDir, 'cflux-temp-index.html');
  fs.writeFileSync(tmpPath, htmlContent);
  
  console.log('✅ Generated HTML with backend URL:', backendUrl);
  
  return tmpPath;
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
    show: false
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
    const tmpPath = generateModifiedHTML();
    
    // Set session CSP
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self' file:; script-src 'self' 'unsafe-inline' file:; style-src 'self' 'unsafe-inline' file:; img-src 'self' data: blob: file:; font-src 'self' data: file:; connect-src *; base-uri 'self'; form-action 'self';"]
        }
      });
    });
    
    mainWindow.loadFile(tmpPath);
  }

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['VERBOSE', 'INFO', 'WARNING', 'ERROR'];
    console.log(`[Renderer ${levels[level] || level}]:`, message, sourceId ? `(${sourceId}:${line})` : '');
  });

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
          label: 'Über CFlux Demo',
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Über CFlux Demo',
              message: 'CFlux Time Tracking System - Demo Version',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\n\nDies ist eine Demo-Version mit integriertem Backend.`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Initialize app
app.whenReady().then(async () => {
  try {
    // Start backend first
    await startBackend();
    
    // Then create window
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startfehler', `Die Anwendung konnte nicht gestartet werden:\n\n${error.message}`);
    app.quit();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  stopBackend();
});

// Handle app crashes and errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  stopBackend();
});

// IPC Handlers
ipcMain.handle('get-backend-url', () => {
  return `http://localhost:${backendPort}`;
});

ipcMain.handle('app-version', () => {
  return app.getVersion();
});

// Log application info
console.log('═══════════════════════════════════════');
console.log('  CFlux Desktop Application - Demo    ');
console.log('═══════════════════════════════════════');
console.log('Version:', app.getVersion());
console.log('Electron:', process.versions.electron);
console.log('Development Mode:', isDev);
console.log('═══════════════════════════════════════');
