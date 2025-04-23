// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponiere sichere APIs für den Renderer-Prozess
contextBridge.exposeInMainWorld('electron', {
  // Datenspeicherung
  getData: (key) => ipcRenderer.invoke('getData', key),
  saveData: (key, data) => ipcRenderer.invoke('saveData', { key, data }),
  
  // Haptisches Feedback
  hapticFeedback: () => ipcRenderer.invoke('hapticFeedback')
});