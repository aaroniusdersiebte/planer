// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialisiere den Speicher
const store = new Store({
  name: 'miniplaner-data',
  defaults: {
    groups: [],
    tasks: [],
    tags: [],
    notes: [],
    archivedTasks: []
  }
});

let mainWindow;

function createWindow() {
  // Erstelle das Browserfenster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e', // Dunkles Theme
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // WICHTIG: Lade die richtige URL basierend auf der Umgebung
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const startUrl = isDev 
    ? 'http://localhost:3000' // Dev-Server
    : `file://${path.join(__dirname, '../build/index.html')}`; // Prod-Build
  
  mainWindow.loadURL(startUrl);
  
  // Öffne die DevTools im Entwicklungsmodus
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Entferne Referenz auf das Fenster wenn es geschlossen wird
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Erstelle das Fenster, wenn Electron bereit ist
app.whenReady().then(createWindow);

// Beende die Anwendung, wenn alle Fenster geschlossen sind (außer auf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Auf macOS: Erstelle ein neues Fenster, wenn auf das Dock-Icon geklickt wird
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Kommunikation für Datenspeicherung
ipcMain.handle('getData', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('saveData', async (event, { key, data }) => {
  store.set(key, data);
  return true;
});

// Haptisches Feedback durch Vibration (Windows)
ipcMain.handle('hapticFeedback', async () => {
  if (process.platform === 'win32' && mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    `);
  }
});