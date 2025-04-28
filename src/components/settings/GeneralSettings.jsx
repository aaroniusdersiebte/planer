// src/components/settings/GeneralSettings.jsx
import React, { useState, useEffect } from 'react';
import { FiMoon, FiSun, FiMonitor, FiGlobe } from 'react-icons/fi';

function GeneralSettings() {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'de',
    startMinimized: false,
    minimizeToTray: true
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const generalSettings = await window.electron.getGeneralSettings();
        setSettings(generalSettings);
      } catch (error) {
        console.error("Fehler beim Laden der Einstellungen:", error);
      }
    }
    
    loadSettings();
  }, []);

  const handleSettingsChange = (field, value) => {
    setSettings(prev => {
      const updated = { ...prev, [field]: value };
      window.electron.updateGeneralSettings(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">Allgemeine Einstellungen</h2>

      {/* Erscheinungsbild */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiSun className="mr-2" />
          Erscheinungsbild
        </h3>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Farbschema
          </label>
          <div className="flex space-x-4">
            <label className={`flex flex-col items-center p-3 rounded cursor-pointer ${
              settings.theme === 'dark' ? 'bg-gray-600 ring-2 ring-orange-500' : 'bg-gray-800 hover:bg-gray-600'
            }`}>
              <FiMoon size={24} className="mb-2 text-gray-300" />
              <span className="text-sm text-gray-300">Dunkel</span>
              <input
                type="radio"
                className="sr-only"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={() => handleSettingsChange('theme', 'dark')}
              />
            </label>
            
            <label className={`flex flex-col items-center p-3 rounded cursor-pointer ${
              settings.theme === 'light' ? 'bg-gray-600 ring-2 ring-orange-500' : 'bg-gray-800 hover:bg-gray-600'
            }`}>
              <FiSun size={24} className="mb-2 text-gray-300" />
              <span className="text-sm text-gray-300">Hell</span>
              <input
                type="radio"
                className="sr-only"
                value="light"
                checked={settings.theme === 'light'}
                onChange={() => handleSettingsChange('theme', 'light')}
              />
            </label>
            
            <label className={`flex flex-col items-center p-3 rounded cursor-pointer ${
              settings.theme === 'system' ? 'bg-gray-600 ring-2 ring-orange-500' : 'bg-gray-800 hover:bg-gray-600'
            }`}>
              <FiMonitor size={24} className="mb-2 text-gray-300" />
              <span className="text-sm text-gray-300">System</span>
              <input
                type="radio"
                className="sr-only"
                value="system"
                checked={settings.theme === 'system'}
                onChange={() => handleSettingsChange('theme', 'system')}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Spracheinstellungen */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiGlobe className="mr-2" />
          Sprache
        </h3>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Anzeigesprache
          </label>
          <select
            className="w-full md:w-64 bg-gray-600 text-white p-2 rounded outline-none focus:ring-1 focus:ring-orange-500"
            value={settings.language}
            onChange={e => handleSettingsChange('language', e.target.value)}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Startverhalten */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4">Startverhalten</h3>
        
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="mr-2"
              checked={settings.startMinimized}
              onChange={e => handleSettingsChange('startMinimized', e.target.checked)}
            />
            <span className="text-white">Minimiert starten</span>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="mr-2"
              checked={settings.minimizeToTray}
              onChange={e => handleSettingsChange('minimizeToTray', e.target.checked)}
            />
            <span className="text-white">In Systemtray minimieren</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default GeneralSettings;