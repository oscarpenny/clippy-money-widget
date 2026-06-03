const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('clippyAPI', {
  getSpend: function () { return ipcRenderer.invoke('get-spend') },
  getWindowPos: function () { return ipcRenderer.invoke('get-window-pos') },
  setWindowPos: function (x, y) { ipcRenderer.send('set-window-pos', x, y) },
  setWindowSize: function (w, h) { ipcRenderer.send('set-window-size', w, h) }
})
