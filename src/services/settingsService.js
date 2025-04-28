// src/services/settingsService.js
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

class SettingsService {
  constructor() {
    // Haupteinstellungsspeicher (electron-store)
    this.store = new Store({
      name: 'miniplaner-settings',
      defaults: {
        // Allgemeine Einstellungen
        general: {
          theme: 'dark',
          language: 'de',
          startMinimized: false,
          minimizeToTray: true,
        },
        // OBS-Einstellungen
        obs: {
          enabled: false,
          host: 'localhost',
          port: 4444,
          password: '',
          autoReconnect: true,
          streamGroup: null, // ID der Gruppe, die in OBS angezeigt werden soll
          sceneName: 'Szene', // Name der OBS-Szene
          sourceName: 'Aufgaben', // Name der Browser-Quelle
          showMode: 'permanent', // 'permanent' oder 'temporary'
          displayDuration: 6, // Anzeigedauer in Sekunden (für temporary)
          webServerPort: 3030, // Port für den internen Webserver
          useFilter: false, // Filter verwenden
          filterSource: '', // Quelle für den Filter
          filterName: '' // Name des Filters
        }
      }
    });
  }

  // Allgemeine Einstellungen
  
  getGeneralSettings() {
    return this.store.get('general');
  }

  updateGeneralSettings(settings) {
    this.store.set('general', { ...this.getGeneralSettings(), ...settings });
    return this.getGeneralSettings();
  }

  // OBS-Einstellungen
  
  getOBSSettings() {
    return this.store.get('obs');
  }

  updateOBSSettings(settings) {
    this.store.set('obs', { ...this.getOBSSettings(), ...settings });
    return this.getOBSSettings();
  }

  // Hilfsfunktionen
  
  // Einstellungsverzeichnis erhalten
  getSettingsDirectory() {
    return path.dirname(this.store.path);
  }

  // Export der Einstellungen in eine Datei
  exportSettings(filePath) {
    try {
      const settings = {
        general: this.getGeneralSettings(),
        obs: this.getOBSSettings()
      };
      
      fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Fehler beim Exportieren der Einstellungen:', error);
      return { success: false, error: error.message };
    }
  }

  // Import der Einstellungen aus einer Datei
  importSettings(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const settings = JSON.parse(fileContent);
      
      if (settings.general) {
        this.updateGeneralSettings(settings.general);
      }
      
      if (settings.obs) {
        this.updateOBSSettings(settings.obs);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Fehler beim Importieren der Einstellungen:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton-Instanz
const settingsService = new SettingsService();

module.exports = settingsService;