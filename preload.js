const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('winControls', {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  close: () => ipcRenderer.send('window-control', 'close')
});

// 在页面渲染前恢复已保存的主题与锁定状态，避免闪烁
try {
  if (localStorage.getItem('sticky.theme') === 'light') {
    document.documentElement.classList.add('light');
  }
  if (localStorage.getItem('sticky.locked') === '1') {
    document.documentElement.classList.add('locked');
  }
} catch (e) { /* localStorage 不可用时保持默认 */ }
