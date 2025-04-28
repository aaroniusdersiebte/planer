// src/services/webServerService.js
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const { ipcMain } = require('electron');
const settingsService = require('./settingsService');

class WebServerService {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = 3030; // Standard-Port
    this.lastTasks = []; // Zwischenspeicher für die letzten Aufgaben
    this.debugMode = true; // Debug-Modus für mehr Logging
  }

  // Server starten
  start() {
    // Prüfen, ob der Server bereits läuft
    if (this.server) {
      this.log('Webserver läuft bereits');
      return { success: true, message: 'Server läuft bereits', port: this.port };
    }

    try {
      // Einstellungen aktualisieren
      const settings = settingsService.getOBSSettings();
      this.port = settings.webServerPort || 3030;

      // Express-App konfigurieren
      this.configureExpress();

      // Server starten
      this.server = http.createServer(this.app);
      
      this.server.listen(this.port, () => {
        this.log(`Webserver gestartet auf Port ${this.port}`);
        this.log(`OBS Browser-Quelle URL: http://localhost:${this.port}`);
      });

      return { 
        success: true, 
        message: `Server gestartet auf Port ${this.port}`,
        port: this.port,
        url: `http://localhost:${this.port}`
      };
    } catch (error) {
      this.logError('Fehler beim Starten des Webservers:', error);
      return { success: false, error: error.message };
    }
  }

  configureExpress() {
    // CORS für lokale Entwicklung
    this.app.use(cors());

    // Express-Middleware für Logging
    if (this.debugMode) {
      this.app.use((req, res, next) => {
        this.log(`${req.method} ${req.path}`);
        next();
      });
    }

    // Statische Dateien (CSS, JS, Bilder)
    const staticPath = path.join(__dirname, '..', 'obs-templates');
    this.log(`Statischer Pfad: ${staticPath}`);
    this.app.use('/static', express.static(staticPath));

    // Hauptroute für die Aufgabenanzeige
    this.app.get('/', (req, res) => {
      const htmlPath = path.join(__dirname, '..', 'obs-templates', 'task-display.html');
      this.log(`Sende HTML aus: ${htmlPath}`);
      res.sendFile(htmlPath);
    });

    // API-Route für Aufgabendaten
    this.app.get('/api/tasks', (req, res) => {
      this.log(`API-Anfrage für Aufgaben, sende ${this.lastTasks.length} Aufgaben`);
      res.json(this.lastTasks);
    });

    // Debug-Hilfsmittel
    this.app.get('/debug', (req, res) => {
      res.json({
        serverRunning: true,
        port: this.port,
        tasksLoaded: this.lastTasks.length,
        tasks: this.lastTasks,
        staticPath,
        templatePath: path.join(__dirname, '..', 'obs-templates', 'task-display.html')
      });
    });

    // Direkte Vorschau der Task-Anzeige (ohne OBS)
    this.app.get('/preview', (req, res) => {
      // Eine spezielle HTML-Seite mit Vorschau und Debug-Info
      res.send(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MiniPlaner Tasks - Direktvorschau</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #2d2d2d;
            color: #fff;
            margin: 0;
            padding: 20px;
          }
          .container {
            display: flex;
            gap: 20px;
          }
          .preview {
            flex: 2;
            border: 1px solid #444;
            border-radius: 8px;
            overflow: hidden;
            background-color: #1a1a1a;
          }
          .debug {
            flex: 1;
            padding: 15px;
            background-color: #333;
            border-radius: 8px;
          }
          iframe {
            width: 100%;
            height: 500px;
            border: none;
          }
          pre {
            background-color: #222;
            padding: 10px;
            border-radius: 4px;
            overflow: auto;
            max-height: 400px;
          }
          h1, h2 {
            margin-top: 0;
          }
          .reload {
            padding: 8px 16px;
            background-color: #f97316;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 10px;
          }
          .status {
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
          }
          .status.ok {
            background-color: #22c55e;
          }
          .status.error {
            background-color: #ef4444;
          }
        </style>
      </head>
      <body>
        <h1>MiniPlaner Tasks - Direktvorschau</h1>
        
        <button class="reload" onclick="reloadTasks()">Daten neu laden</button>
        
        <div class="container">
          <div class="preview">
            <h2>Vorschau (wie in OBS)</h2>
            <iframe src="/" frameborder="0"></iframe>
          </div>
          
          <div class="debug">
            <h2>Debug-Info</h2>
            <div id="status" class="status"></div>
            <pre id="taskData">Lade Daten...</pre>
          </div>
        </div>
        
        <script>
          // Aufgabendaten laden
          async function loadTaskData() {
            try {
              const response = await fetch('/api/tasks');
              if (!response.ok) {
                throw new Error(\`HTTP Fehler: \${response.status}\`);
              }
              
              const data = await response.json();
              document.getElementById('taskData').textContent = JSON.stringify(data, null, 2);
              
              const statusEl = document.getElementById('status');
              if (data.length > 0) {
                statusEl.className = 'status ok';
                statusEl.textContent = \`✅ \${data.length} Aufgaben geladen\`;
              } else {
                statusEl.className = 'status error';
                statusEl.textContent = '⚠️ Keine Aufgaben gefunden';
              }
            } catch (error) {
              document.getElementById('status').className = 'status error';
              document.getElementById('status').textContent = \`❌ Fehler: \${error.message}\`;
              document.getElementById('taskData').textContent = 'Fehler beim Laden der Daten: ' + error.message;
            }
          }
          
          // Seite und iFrame neu laden
          function reloadTasks() {
            document.querySelector('iframe').src = '/';
            loadTaskData();
          }
          
          // Initialisierung
          loadTaskData();
        </script>
      </body>
      </html>
      `);
    });
  }

  // Server stoppen
  stop() {
    if (!this.server) {
      this.log('Webserver ist nicht aktiv');
      return { success: true, message: 'Server war nicht aktiv' };
    }

    try {
      this.server.close();
      this.server = null;
      this.log('Webserver gestoppt');
      return { success: true, message: 'Server erfolgreich gestoppt' };
    } catch (error) {
      this.logError('Fehler beim Stoppen des Webservers:', error);
      return { success: false, error: error.message };
    }
  }

  // Server neu starten (z.B. nach Konfigurationsänderungen)
  restart() {
    this.stop();
    return this.start();
  }

  // Aufgaben für die Anzeige in OBS aktualisieren
  updateTasks(tasks) {
    this.lastTasks = tasks;
    this.log(`Aufgaben aktualisiert: ${tasks.length} Einträge`);
    
    // Detailliertes Log für Debugging
    if (this.debugMode && tasks.length > 0) {
      this.log('Erste Aufgabe zum Prüfen:', JSON.stringify(tasks[0], null, 2));
    }
  }

  // Benachrichtigung über abgeschlossene Aufgabe senden
  notifyTaskCompleted(task) {
    // Finde und aktualisiere die Aufgabe in der lokalen Liste
    const taskIndex = this.lastTasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      this.log(`Aufgabe als erledigt markiert: ${task.title || task.id}`);
      this.lastTasks[taskIndex] = { ...task, completed: true };
    } else {
      this.log(`Aufgabe mit ID ${task.id} nicht in der Liste gefunden`);
    }
  }

  // Logging-Hilfsmethoden
  log(...args) {
    console.log('[WebServer]', ...args);
  }

  logError(...args) {
    console.error('[WebServer]', ...args);
  }

  // IPC-Handler für Renderer-Prozess registrieren
  registerIPCHandlers() {
    // Webserver starten
    ipcMain.handle('webserver:start', async () => {
      return this.start();
    });

    // Webserver stoppen
    ipcMain.handle('webserver:stop', async () => {
      return this.stop();
    });

    // Webserver neu starten
    ipcMain.handle('webserver:restart', async () => {
      return this.restart();
    });

    // Status des Webservers abrufen
    ipcMain.handle('webserver:status', async () => {
      return { 
        running: this.server !== null,
        port: this.port
      };
    });

    // Aufgaben für OBS aktualisieren
    ipcMain.handle('webserver:update-tasks', async (_, tasks) => {
      this.updateTasks(tasks);
      return { success: true };
    });
    
    // Debug-URL abrufen
    ipcMain.handle('webserver:get-preview-url', async () => {
      if (!this.server) {
        return { success: false, error: 'Server nicht aktiv', url: null };
      }
      return { 
        success: true, 
        url: `http://localhost:${this.port}/preview`
      };
    });
  }
}

// Singleton-Instanz
const webServerService = new WebServerService();

module.exports = webServerService;