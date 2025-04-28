// src/components/settings/SettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiSettings, 
  FiMonitor, 
  FiSave, 
  FiUpload, 
  FiDownload 
} from 'react-icons/fi';
import GeneralSettings from './GeneralSettings';
import OBSSettings from './OBSSettings';

function SettingsPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('general');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Status-Nachricht für 3 Sekunden anzeigen und dann ausblenden
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Einstellungen exportieren
  const handleExportSettings = async () => {
    try {
      setIsExporting(true);
      
      // Dialog zur Dateiauswahl öffnen
      const result = await window.electron.showSaveDialog({
        title: 'Einstellungen exportieren',
        defaultPath: 'miniplaner-settings.json',
        filters: [
          { name: 'JSON-Dateien', extensions: ['json'] }
        ]
      });
      
      if (result.canceled) {
        setIsExporting(false);
        return;
      }
      
      // Einstellungen exportieren
      const exportResult = await window.electron.exportSettings(result.filePath);
      
      if (exportResult.success) {
        setStatusMessage({ type: 'success', text: 'Einstellungen erfolgreich exportiert' });
      } else {
        setStatusMessage({ type: 'error', text: `Fehler beim Exportieren: ${exportResult.error}` });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: `Fehler: ${error.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  // Einstellungen importieren
  const handleImportSettings = async () => {
    try {
      setIsImporting(true);
      
      // Dialog zur Dateiauswahl öffnen
      const result = await window.electron.showOpenDialog({
        title: 'Einstellungen importieren',
        filters: [
          { name: 'JSON-Dateien', extensions: ['json'] }
        ],
        properties: ['openFile']
      });
      
      if (result.canceled) {
        setIsImporting(false);
        return;
      }
      
      // Einstellungen importieren
      const importResult = await window.electron.importSettings(result.filePaths[0]);
      
      if (importResult.success) {
        setStatusMessage({ type: 'success', text: 'Einstellungen erfolgreich importiert' });
        
        // Neustart erforderlich, um alle Änderungen zu übernehmen
        const shouldRestart = await window.electron.showMessageBox({
          type: 'question',
          buttons: ['Jetzt', 'Später'],
          title: 'Neustart erforderlich',
          message: 'Einige Einstellungen werden erst nach einem Neustart der App wirksam. Möchten Sie die App jetzt neu starten?'
        });
        
        if (shouldRestart.response === 0) {
          await window.electron.restartApp();
        }
      } else {
        setStatusMessage({ type: 'error', text: `Fehler beim Importieren: ${importResult.error}` });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: `Fehler: ${error.message}` });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Einstellungen</h2>
          <button
            className="text-gray-400 hover:text-white p-1"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Seitliche Navigation */}
          <div className="w-48 bg-gray-900 p-4 border-r border-gray-700">
            <nav className="space-y-1">
              <button
                className={`flex items-center w-full px-3 py-2 rounded-md ${
                  activeTab === 'general' 
                    ? 'bg-orange-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('general')}
              >
                <FiSettings className="mr-3" />
                <span>Allgemein</span>
              </button>
              
              <button
                className={`flex items-center w-full px-3 py-2 rounded-md ${
                  activeTab === 'obs' 
                    ? 'bg-orange-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('obs')}
              >
                <FiMonitor className="mr-3" />
                <span>OBS Integration</span>
              </button>
            </nav>

            {/* Import/Export Buttons */}
            <div className="mt-8 space-y-2">
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md"
                onClick={handleExportSettings}
                disabled={isExporting}
              >
                <FiDownload className="mr-2" />
                <span>{isExporting ? 'Exportiere...' : 'Einstellungen exportieren'}</span>
              </button>
              
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md"
                onClick={handleImportSettings}
                disabled={isImporting}
              >
                <FiUpload className="mr-2" />
                <span>{isImporting ? 'Importiere...' : 'Einstellungen importieren'}</span>
              </button>
            </div>
          </div>

          {/* Hauptinhalt */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'obs' && <OBSSettings />}
          </div>
        </div>

        {/* Status-Nachricht */}
        {statusMessage && (
          <div className={`p-3 mx-4 mb-4 rounded ${
            statusMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <p className="text-white">{statusMessage.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPanel;