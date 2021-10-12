const { app, BrowserWindow, Menu, ipcMain, powerSaveBlocker } = require('electron');


const core = require('./lib/core');
const events = require('./lib/events');

app.whenReady().then(() => {
  core.windowDefault();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      core.windowDefault();
    }
  })

  core.toolbarUpdate();
})


app.on('window-all-closed', () => {
  if (core.store.isExit === false) {
    core.store.isExit = true;
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }
})


core.init();