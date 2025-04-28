// public/electron.js
const path = require('path');
const { app, BrowserWindow } = require('electron');
const isDev = process.env.NODE_ENV === 'development';

// Reuse your existing main.js file
const mainFile = isDev 
  ? path.join(__dirname, '../electron/main.js')
  : path.join(__dirname, '../electron/main.js');

// This is needed for proper packaging
module.exports = require(mainFile);