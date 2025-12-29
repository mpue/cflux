const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Get app version
  getVersion: () => ipcRenderer.invoke('app-version'),
  
  // Store operations
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear')
  },
  
  // Navigation
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },
  
  // System info
  platform: process.platform,
  
  // Open external links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Settings operations
  saveSettings: (settings) => {
    ipcRenderer.invoke('save-settings', settings).then(() => {
      ipcRenderer.invoke('reload-app');
      // Close the settings window
      window.close();
    });
  },
  
  closeSettings: () => {
    window.close();
  },
  
  // Get backend URL
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url')
});

// Log preload script loaded
console.log('Preload script loaded successfully');
