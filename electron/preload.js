// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponiere sichere APIs für den Renderer-Prozess
contextBridge.exposeInMainWorld('electron', {
  // Datenspeicherung
  getData: (key) => ipcRenderer.invoke('getData', key),
  saveData: (key, data) => ipcRenderer.invoke('saveData', { key, data }),
  
  // Haptisches Feedback
  hapticFeedback: () => ipcRenderer.invoke('hapticFeedback'),
  
  // Einstellungen
  getGeneralSettings: () => ipcRenderer.invoke('settings:getGeneral'),
  updateGeneralSettings: (settings) => ipcRenderer.invoke('settings:updateGeneral', settings),
  getOBSSettings: () => ipcRenderer.invoke('settings:getOBS'),
  updateOBSSettings: (settings) => ipcRenderer.invoke('settings:updateOBS', settings),
  
  // Datei-Dialoge
  showSaveDialog: (options) => ipcRenderer.invoke('showSaveDialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('showOpenDialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('showMessageBox', options),
  exportSettings: (filePath) => ipcRenderer.invoke('exportSettings', filePath),
  importSettings: (filePath) => ipcRenderer.invoke('importSettings', filePath),
  restartApp: () => ipcRenderer.invoke('restartApp'),
  
  // OBS-Funktionen
  getOBSConnectionStatus: () => ipcRenderer.invoke('obs:get-connection-status'),
  connectToOBS: () => ipcRenderer.invoke('obs:connect'),
  disconnectFromOBS: () => ipcRenderer.invoke('obs:disconnect'),
  testOBSSource: (params) => ipcRenderer.invoke('obs:test-source', params),
  testOBSFilter: (params) => ipcRenderer.invoke('obs:test-filter', params),
  handleTaskCompleted: (taskId, groupId) => ipcRenderer.invoke('handleTaskCompleted', taskId, groupId),
  handleSubtaskCompleted: (taskId, subtaskId, groupId) => ipcRenderer.invoke('handleSubtaskCompleted', taskId, subtaskId, groupId),
  
  // Webserver-Funktionen
  getWebServerStatus: () => ipcRenderer.invoke('webserver:status'),
  startWebServer: () => ipcRenderer.invoke('webserver:start'),
  stopWebServer: () => ipcRenderer.invoke('webserver:stop'),
  restartWebServer: () => ipcRenderer.invoke('webserver:restart'),
  updateWebServerTasks: (tasks) => ipcRenderer.invoke('webserver:update-tasks', tasks),
  getWebServerPreviewUrl: () => ipcRenderer.invoke('webserver:get-preview-url'),
  
  // Event-Handling
  on: (channel, func) => {
    const validChannels = ['obs:connection-status', 'obs:connection-error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel, func) => {
    const validChannels = ['obs:connection-status', 'obs:connection-error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  }
});