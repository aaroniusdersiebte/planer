// src/components/settings/OBSSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiRefreshCw, 
  FiPlay, 
  FiPause, 
  FiCheck, 
  FiX,
  FiEye,
  FiLink,
  FiSliders
} from 'react-icons/fi';
import { useAppStore } from '../../store/appStore'; // Korrekter Import für AppStore

function OBSSettings() {
  // App-Store für Zugriff auf Gruppen und Tasks
  const { groups, tasks } = useAppStore();
  
  // OBS-Einstellungen
  const [settings, setSettings] = useState({
    enabled: false,
    host: 'localhost',
    port: 4444,
    password: '',
    autoReconnect: true,
    streamGroup: null,
    sceneName: '',
    sourceName: '',
    showMode: 'permanent',
    displayDuration: 6,
    webServerPort: 3030,
    useFilter: false,
    filterSource: '',
    filterName: ''
  });

  // Status der OBS-Verbindung
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    connecting: false,
    error: null
  });

  // Status des Webservers
  const [serverStatus, setServerStatus] = useState({
    running: false,
    starting: false,
    port: 3030
  });

  // Einstellungen laden
  useEffect(() => {
    async function loadSettings() {
      try {
        if (window.electron && window.electron.getOBSSettings) {
          const obsSettings = await window.electron.getOBSSettings();
          setSettings(obsSettings);
          
          // Verbindungsstatus abrufen
          if (window.electron.getOBSConnectionStatus) {
            const status = await window.electron.getOBSConnectionStatus();
            setConnectionStatus(prev => ({ ...prev, connected: status.connected }));
          }
          
          // Webserver-Status abrufen
          if (window.electron.getWebServerStatus) {
            const webserverStatus = await window.electron.getWebServerStatus();
            setServerStatus(webserverStatus);
          }
        }
      } catch (error) {
        console.error("Fehler beim Laden der OBS-Einstellungen:", error);
      }
    }
    
    loadSettings();
  }, []);

  // Event-Listener für OBS-Verbindungsstatus
  useEffect(() => {
    const handleConnectionStatus = (status) => {
      setConnectionStatus(prev => ({ 
        ...prev, 
        connected: status.connected,
        connecting: false,
        error: null
      }));
    };
    
    const handleConnectionError = (data) => {
      setConnectionStatus(prev => ({ 
        ...prev, 
        connected: false,
        connecting: false,
        error: data.error
      }));
    };
    
    // Event-Listener registrieren, wenn die Funktion verfügbar ist
    if (window.electron && window.electron.on) {
      window.electron.on('obs:connection-status', handleConnectionStatus);
      window.electron.on('obs:connection-error', handleConnectionError);
      
      // Cleanup
      return () => {
        if (window.electron && window.electron.removeListener) {
          window.electron.removeListener('obs:connection-status', handleConnectionStatus);
          window.electron.removeListener('obs:connection-error', handleConnectionError);
        }
      };
    }
  }, []);

  // Einstellungen aktualisieren
  const handleSettingsChange = (field, value) => {
    setSettings(prev => {
      const updated = { ...prev, [field]: value };
      if (window.electron && window.electron.updateOBSSettings) {
        window.electron.updateOBSSettings(updated);
      }
      return updated;
    });
  };

  // Mit OBS verbinden
  const handleConnect = async () => {
    setConnectionStatus(prev => ({ ...prev, connecting: true, error: null }));
    
    try {
      if (window.electron && window.electron.connectToOBS) {
        const result = await window.electron.connectToOBS();
        
        if (!result.success) {
          setConnectionStatus(prev => ({ 
            ...prev, 
            connecting: false, 
            error: result.error 
          }));
        }
      }
    } catch (error) {
      setConnectionStatus(prev => ({ 
        ...prev, 
        connecting: false, 
        error: error.message 
      }));
    }
  };

  // OBS-Verbindung trennen
  const handleDisconnect = async () => {
    try {
      if (window.electron && window.electron.disconnectFromOBS) {
        await window.electron.disconnectFromOBS();
      }
    } catch (error) {
      setConnectionStatus(prev => ({ 
        ...prev, 
        error: error.message 
      }));
    }
  };

  // Webserver starten
  const handleStartServer = async () => {
    setServerStatus(prev => ({ ...prev, starting: true }));
    
    try {
      if (window.electron && window.electron.startWebServer) {
        const result = await window.electron.startWebServer();
        
        if (result.success) {
          setServerStatus({
            running: true,
            starting: false,
            port: result.port
          });
        } else {
          setServerStatus(prev => ({ 
            ...prev, 
            starting: false,
            error: result.error 
          }));
        }
      }
    } catch (error) {
      setServerStatus(prev => ({ 
        ...prev, 
        starting: false,
        error: error.message 
      }));
    }
  };

  // Webserver stoppen
  const handleStopServer = async () => {
    try {
      if (window.electron && window.electron.stopWebServer) {
        await window.electron.stopWebServer();
        setServerStatus(prev => ({ ...prev, running: false }));
      }
    } catch (error) {
      setServerStatus(prev => ({ ...prev, error: error.message }));
    }
  };

  // OBS-Quelle testen
  const handleTestSource = async () => {
    if (!settings.sceneName || !settings.sourceName) {
      alert('Bitte geben Sie Szenen- und Quellennamen an');
      return;
    }
    
    try {
      if (window.electron && window.electron.testOBSSource) {
        const result = await window.electron.testOBSSource({
          sceneName: settings.sceneName,
          sourceName: settings.sourceName
        });
        
        if (!result.success) {
          alert(`Fehler beim Testen der Quelle: ${result.error}`);
        } else {
          alert('Quellen-Test erfolgreich. Die Quelle sollte kurz in OBS sichtbar sein.');
        }
      }
    } catch (error) {
      alert(`Fehler: ${error.message}`);
    }
  };

  // Aufgaben an OBS senden (verbesserte Funktion)
  const refreshOBSData = async () => {
    try {
      // Prüfen, ob eine Gruppe ausgewählt ist
      if (!settings.streamGroup) {
        alert('Bitte wählen Sie zuerst eine Gruppe aus!');
        return;
      }
      
      // Gruppendaten finden
      const group = groups.find(g => g.id === settings.streamGroup);
      const groupName = group ? group.name : 'Aufgabenliste';
      
      // Aufgaben dieser Gruppe finden
      const groupTasks = tasks
        .filter(t => t.groupId === settings.streamGroup)
        .map(t => ({
          ...t,
          groupName // Gruppennamen zu jeder Aufgabe hinzufügen - WICHTIG!
        }));
      
      // An OBS senden
      if (window.electron && window.electron.updateWebServerTasks) {
        await window.electron.updateWebServerTasks(groupTasks);
        alert(`${groupTasks.length} Aufgaben mit Gruppentitel "${groupName}" an OBS gesendet!`);
      } else {
        alert('Update-Funktion nicht verfügbar (updateWebServerTasks)');
      }
    } catch (error) {
      alert(`Fehler: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">OBS Integration</h2>

      {/* OBS-Integration aktivieren */}
      <div className="flex items-center mb-6">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={settings.enabled}
              onChange={e => handleSettingsChange('enabled', e.target.checked)}
            />
            <div className={`w-10 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-orange-600' : 'bg-gray-600'
            }`} />
            <div className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
              settings.enabled ? 'transform translate-x-4' : ''
            }`} />
          </div>
          <span className="ml-3 text-white">OBS-Integration aktivieren</span>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* OBS-Verbindungseinstellungen */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <FiLink className="mr-2" />
              OBS-Verbindung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Hostname/IP
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.host}
                  onChange={e => handleSettingsChange('host', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  WebSocket-Port
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.port}
                  onChange={e => handleSettingsChange('port', parseInt(e.target.value) || 4444)}
                  placeholder="4444"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Passwort
                </label>
                <input
                  type="password"
                  className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.password}
                  onChange={e => handleSettingsChange('password', e.target.value)}
                  placeholder="Passwort (falls erforderlich)"
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={settings.autoReconnect}
                    onChange={e => handleSettingsChange('autoReconnect', e.target.checked)}
                  />
                  <span className="text-white">Automatisch wiederherstellen</span>
                </label>
              </div>
            </div>
            
            {/* Verbindungsstatus und Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-300">
                  {connectionStatus.connected 
                    ? 'Verbunden' 
                    : connectionStatus.connecting 
                      ? 'Verbinde...' 
                      : 'Nicht verbunden'
                  }
                </span>
                {connectionStatus.error && (
                  <span className="text-red-500 ml-2 text-sm">{connectionStatus.error}</span>
                )}
              </div>
              
              <div>
                {connectionStatus.connected ? (
                  <button
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded flex items-center"
                    onClick={handleDisconnect}
                  >
                    <FiPause className="mr-1" size={14} />
                    <span>Trennen</span>
                  </button>
                ) : (
                  <button
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded flex items-center"
                    onClick={handleConnect}
                    disabled={connectionStatus.connecting}
                  >
                    {connectionStatus.connecting ? (
                      <FiRefreshCw className="mr-1 animate-spin" size={14} />
                    ) : (
                      <FiPlay className="mr-1" size={14} />
                    )}
                    <span>{connectionStatus.connecting ? 'Verbinde...' : 'Verbinden'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Webserver-Einstellungen */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <FiSliders className="mr-2" />
              Webserver
            </h3>
            
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Webserver-Port
              </label>
              <input
                type="number"
                className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                value={settings.webServerPort}
                onChange={e => handleSettingsChange('webServerPort', parseInt(e.target.value) || 3030)}
                placeholder="3030"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL für OBS-Browser-Quelle: http://localhost:{settings.webServerPort}
              </p>
            </div>
            
            {/* Webserver-Status und Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  serverStatus.running ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-300">
                  {serverStatus.running 
                    ? `Läuft auf Port ${serverStatus.port}` 
                    : serverStatus.starting 
                      ? 'Starte...' 
                      : 'Gestoppt'
                  }
                </span>
              </div>
              
              <div className="flex items-center">
                {serverStatus.running ? (
                  <button
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded flex items-center"
                    onClick={handleStopServer}
                  >
                    <FiPause className="mr-1" size={14} />
                    <span>Stoppen</span>
                  </button>
                ) : (
                  <button
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded flex items-center"
                    onClick={handleStartServer}
                    disabled={serverStatus.starting}
                  >
                    {serverStatus.starting ? (
                      <FiRefreshCw className="mr-1 animate-spin" size={14} />
                    ) : (
                      <FiPlay className="mr-1" size={14} />
                    )}
                    <span>{serverStatus.starting ? 'Starte...' : 'Starten'}</span>
                  </button>
                )}
                
                {/* Verbesserter Button zum manuellen Aktualisieren der OBS-Daten */}
                <button 
                  className="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center"
                  onClick={refreshOBSData}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  OBS-Daten aktualisieren
                </button>
              </div>
            </div>
          </div>

          {/* OBS-Quelle und Anzeigeeinstellungen */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <FiEye className="mr-2" />
              OBS-Anzeige
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Szenenname
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.sceneName}
                  onChange={e => handleSettingsChange('sceneName', e.target.value)}
                  placeholder="Name der OBS-Szene"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Quellenname
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.sourceName}
                  onChange={e => handleSettingsChange('sourceName', e.target.value)}
                  placeholder="Name der Browser-Quelle"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Anzeigemodus
                </label>
                <select
                  className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.showMode}
                  onChange={e => handleSettingsChange('showMode', e.target.value)}
                >
                  <option value="permanent">Permanent anzeigen</option>
                  <option value="temporary">Temporär bei Erledigung anzeigen</option>
                </select>
              </div>
              
              {settings.showMode === 'temporary' && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Anzeigedauer (Sekunden)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                    value={settings.displayDuration}
                    onChange={e => handleSettingsChange('displayDuration', parseInt(e.target.value) || 6)}
                    min="1"
                    max="30"
                  />
                </div>
              )}
            </div>
            
            {/* Filter-Einstellungen */}
            <div className="mt-4">
              <label className="flex items-center cursor-pointer mb-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={settings.useFilter}
                  onChange={e => handleSettingsChange('useFilter', e.target.checked)}
                />
                <span className="text-white">Filter aktivieren/deaktivieren</span>
              </label>
              
              {settings.useFilter && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Filterquelle
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                      value={settings.filterSource}
                      onChange={e => handleSettingsChange('filterSource', e.target.value)}
                      placeholder="Name der Quelle mit Filter"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Filtername
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
                      value={settings.filterName}
                      onChange={e => handleSettingsChange('filterName', e.target.value)}
                      placeholder="Name des Filters"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Test-Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded"
                onClick={handleTestSource}
                disabled={!settings.sceneName || !settings.sourceName}
              >
                Quelle testen
              </button>
            </div>
          </div>

          {/* Gruppenauswahl mit tatsächlichen Gruppen */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Anzuzeigende Gruppe</h3>
            <p className="text-gray-300 text-sm mb-4">
              Wählen Sie eine Gruppe, deren Aufgaben in OBS angezeigt werden sollen:
            </p>
            
            <select
              className="w-full bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
              value={settings.streamGroup || ""}
              onChange={e => handleSettingsChange('streamGroup', e.target.value || null)}
            >
              <option value="">Keine Gruppe auswählen</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            
            {groups.length === 0 && (
              <p className="text-yellow-500 text-sm mt-2">
                Es sind keine Gruppen vorhanden. Bitte erstellen Sie zuerst eine Gruppe.
              </p>
            )}
          </div>
          
          {/* Einfache Vorschau der gewählten Gruppe */}
          {settings.streamGroup && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Vorschau</h3>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-lg text-white mb-2">
                  {groups.find(g => g.id === settings.streamGroup)?.name || 'Ausgewählte Gruppe'}
                </h4>
                <p className="text-gray-400 text-sm">
                  Aufgaben dieser Gruppe werden in OBS angezeigt.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// WICHTIG: Default-Export hinzufügen, dieser fehlte zuvor
export default OBSSettings;