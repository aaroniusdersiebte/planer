// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Dienste importieren
const settingsService = require('../src/services/settingsService');
const obsService = require('../src/services/obsService');
const webServerService = require('../src/services/webServerService');

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
    ? 'http://localhost:3000' // Dev server
    : `file://${path.join(__dirname, '../build/index.html')}`; // Production build path
  
  mainWindow.loadURL(startUrl);
  
  // Öffne die DevTools im Entwicklungsmodus
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Entferne Referenz auf das Fenster wenn es geschlossen wird
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Globale Referenz auf das Hauptfenster
  global.mainWindow = mainWindow;
}

// Erstelle das Fenster, wenn Electron bereit ist
app.whenReady().then(() => {
  createWindow();
  
  // Dienste starten, wenn Einstellungen aktiviert sind
  const obsSettings = settingsService.getOBSSettings();
  if (obsSettings.enabled) {
    // Webserver starten
    webServerService.start();
    
    // Mit OBS verbinden, wenn autoReconnect aktiviert ist
    if (obsSettings.autoReconnect) {
      obsService.connect().catch(err => console.error('Fehler beim Verbinden mit OBS:', err));
    }
  }
});

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

// IPC für Einstellungen
ipcMain.handle('settings:getGeneral', async () => {
  return settingsService.getGeneralSettings();
});

ipcMain.handle('settings:updateGeneral', async (event, settings) => {
  return settingsService.updateGeneralSettings(settings);
});

ipcMain.handle('settings:getOBS', async () => {
  return settingsService.getOBSSettings();
});

ipcMain.handle('settings:updateOBS', async (event, settings) => {
  return settingsService.updateOBSSettings(settings);
});

// IPC für Datei-Dialoge
ipcMain.handle('showSaveDialog', async (event, options) => {
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('showOpenDialog', async (event, options) => {
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('showMessageBox', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('exportSettings', async (event, filePath) => {
  return settingsService.exportSettings(filePath);
});

ipcMain.handle('importSettings', async (event, filePath) => {
  return settingsService.importSettings(filePath);
});

ipcMain.handle('restartApp', async () => {
  app.relaunch();
  app.exit(0);
});

// IPC für Aufgabenabschluss (OBS-Integration)
ipcMain.handle('handleTaskCompleted', async (event, taskId, groupId) => {
  obsService.handleTaskCompleted({ id: taskId }, groupId);
  return true;
});

ipcMain.handle('handleSubtaskCompleted', async (event, taskId, subtaskId, groupId) => {
  obsService.handleSubtaskCompleted(taskId, subtaskId, groupId);
  return true;
});

// IPC-Handler für OBS und Webserver registrieren
obsService.registerIPCHandlers();
webServerService.registerIPCHandlers();