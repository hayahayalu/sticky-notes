const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 440,
    height: 720,
    minWidth: 360,
    minHeight: 480,
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // 转发渲染进程 console 到主进程 stdout（便于排查问题）
  win.webContents.on('console-message', (event, level, message) => {
    console.log('[renderer]', message);
  });
}

ipcMain.on('window-control', (event, cmd) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (cmd === 'minimize') win.minimize();
  else if (cmd === 'close') win.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
