// src/services/obsService.js
const OBSWebSocket = require('obs-websocket-js').default;
const { ipcMain } = require('electron');
const settingsService = require('./settingsService');
const webServerService = require('./webServerService');

class OBSService {
  constructor() {
    this.obs = new OBSWebSocket();
    this.connected = false;
    this.reconnectInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // Verbindungseinstellungen abrufen
    this.settings = settingsService.getOBSSettings();
    
    // Event-Handler registrieren
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Verbindungsereignisse
    this.obs.on('ConnectionOpened', () => {
      console.log('OBS WebSocket verbunden');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Benachrichtigung an Renderer-Prozess senden
      if (global.mainWindow) {
        global.mainWindow.webContents.send('obs:connection-status', { connected: true });
      }
    });

    this.obs.on('ConnectionClosed', () => {
      console.log('OBS WebSocket Verbindung getrennt');
      this.connected = false;
      
      // Benachrichtigung an Renderer-Prozess senden
      if (global.mainWindow) {
        global.mainWindow.webContents.send('obs:connection-status', { connected: false });
      }
      
      // Automatische Wiederverbindung
      if (this.settings.autoReconnect && !this.reconnectInterval) {
        this.setupReconnect();
      }
    });

    // Fehlerbehandlung
    this.obs.on('ConnectionError', (error) => {
      console.error('OBS WebSocket Verbindungsfehler:', error);
      // Benachrichtigung an Renderer-Prozess senden
      if (global.mainWindow) {
        global.mainWindow.webContents.send('obs:connection-error', { error: error.message });
      }
    });
  }

  // Verbindung zu OBS herstellen
  async connect() {
    if (this.connected) return { success: true };
    
    try {
      // Verbindungseinstellungen abrufen (falls sie aktualisiert wurden)
      this.settings = settingsService.getOBSSettings();
      
      const { host, port, password } = this.settings;
      const url = `ws://${host}:${port}`;
      
      await this.obs.connect(url, password);
      
      return { success: true };
    } catch (error) {
      console.error('Fehler beim Verbinden mit OBS:', error);
      return { 
        success: false, 
        error: error.message || 'Unbekannter Fehler bei der Verbindung mit OBS'
      };
    }
  }

  // Verbindung zu OBS trennen
  async disconnect() {
    if (!this.connected) return;
    
    try {
      // Wiederherstellen der Verbindung deaktivieren
      this.clearReconnect();
      
      await this.obs.disconnect();
      this.connected = false;
      
      return { success: true };
    } catch (error) {
      console.error('Fehler beim Trennen von OBS:', error);
      return { success: false, error: error.message };
    }
  }

  // Automatische Wiederverbindung einrichten
  setupReconnect() {
    this.clearReconnect();
    
    this.reconnectInterval = setInterval(async () => {
      if (this.connected) {
        this.clearReconnect();
        return;
      }
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Maximale Anzahl an Wiederverbindungsversuchen erreicht');
        this.clearReconnect();
        return;
      }
      
      console.log(`Wiederverbindungsversuch ${this.reconnectAttempts + 1} von ${this.maxReconnectAttempts}`);
      this.reconnectAttempts++;
      
      try {
        await this.connect();
      } catch (error) {
        console.error('Fehler bei der Wiederverbindung:', error);
      }
    }, 5000); // Alle 5 Sekunden versuchen
  }

  // Wiederverbindungslogik zurücksetzen
  clearReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    this.reconnectAttempts = 0;
  }

  // OBS-Quellen steuern
  async setSourceVisibility(sceneName, sourceName, visible) {
    if (!this.connected) {
      await this.connect();
      if (!this.connected) return { success: false, error: 'Nicht mit OBS verbunden' };
    }
    
    try {
      await this.obs.call('SetSceneItemProperties', {
        'scene-name': sceneName,
        item: { name: sourceName },
        visible: visible
      });
      
      return { success: true };
    } catch (error) {
      console.error('Fehler beim Ändern der Quelleneinstellungen:', error);
      return { success: false, error: error.message };
    }
  }

  // OBS-Filter aktivieren/deaktivieren
  async setFilterVisibility(sourceName, filterName, enabled) {
    if (!this.connected) {
      await this.connect();
      if (!this.connected) return { success: false, error: 'Nicht mit OBS verbunden' };
    }
    
    try {
      await this.obs.call('SetSourceFilterVisibility', {
        sourceName,
        filterName,
        filterEnabled: enabled
      });
      
      return { success: true };
    } catch (error) {
      console.error('Fehler beim Ändern der Filtereinstellungen:', error);
      return { success: false, error: error.message };
    }
  }

  // Aufgabe als abgeschlossen markieren und OBS aktualisieren
  async handleTaskCompleted(task, groupId) {
    // Prüfen, ob die Aufgabengruppe für OBS konfiguriert ist
    const obsSettings = settingsService.getOBSSettings();
    
    if (obsSettings.streamGroup === groupId) {
      // Webserver und Inhalte aktualisieren
      webServerService.notifyTaskCompleted(task);
      
      // Wenn temporäre Anzeige aktiviert ist, Sichtbarkeit der Quelle steuern
      if (obsSettings.showMode === 'temporary') {
        // Quelle anzeigen
        await this.setSourceVisibility(
          obsSettings.sceneName, 
          obsSettings.sourceName, 
          true
        );
        
        // Filter aktivieren, wenn konfiguriert
        if (obsSettings.useFilter && obsSettings.filterSource && obsSettings.filterName) {
          await this.setFilterVisibility(
            obsSettings.filterSource,
            obsSettings.filterName,
            true
          );
        }
        
        // Timer für Ausblenden der Quelle nach konfigurierter Zeit
        setTimeout(async () => {
          await this.setSourceVisibility(
            obsSettings.sceneName, 
            obsSettings.sourceName, 
            false
          );
          
          // Filter deaktivieren
          if (obsSettings.useFilter && obsSettings.filterSource && obsSettings.filterName) {
            await this.setFilterVisibility(
              obsSettings.filterSource,
              obsSettings.filterName,
              false
            );
          }
        }, obsSettings.displayDuration * 1000); // Umrechnung in Millisekunden
      }
    }
  }

  // IPC-Handler für Renderer-Prozess registrieren
  registerIPCHandlers() {
    // Verbindungsstatus abfragen
    ipcMain.handle('obs:get-connection-status', () => {
      return { connected: this.connected };
    });
    
    // Verbinden
    ipcMain.handle('obs:connect', async () => {
      return await this.connect();
    });
    
    // Trennen
    ipcMain.handle('obs:disconnect', async () => {
      return await this.disconnect();
    });
    
    // Test der Quellensteuerung
    ipcMain.handle('obs:test-source', async (_, { sceneName, sourceName }) => {
      // Quelle kurz anzeigen und dann wieder ausblenden
      try {
        await this.setSourceVisibility(sceneName, sourceName, true);
        
        setTimeout(async () => {
          await this.setSourceVisibility(sceneName, sourceName, false);
        }, 3000); // 3 Sekunden anzeigen
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    // Test des Filters
    ipcMain.handle('obs:test-filter', async (_, { sourceName, filterName }) => {
      // Filter kurz aktivieren und dann wieder deaktivieren
      try {
        await this.setFilterVisibility(sourceName, filterName, true);
        
        setTimeout(async () => {
          await this.setFilterVisibility(sourceName, filterName, false);
        }, 3000); // 3 Sekunden aktivieren
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }
}

// Singleton-Instanz
const obsService = new OBSService();

module.exports = obsService;