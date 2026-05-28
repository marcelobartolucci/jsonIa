const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateTheme: (callback) => ipcRenderer.on('update-theme', callback),
  onOpenFileDialog: (callback) => ipcRenderer.on('open-file-dialog', callback),
  onSaveConfig: (callback) => ipcRenderer.on('save-config', callback),
  onLoadConfig: (callback) => ipcRenderer.on('load-config', callback),
  openFile: () => ipcRenderer.invoke('open-file'),
  openFiles: () => ipcRenderer.invoke('open-files'),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
  saveFileWithDialog: (content) => ipcRenderer.invoke('save-file-with-dialog', content),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  readFiles: (filePaths) => ipcRenderer.invoke('read-files', filePaths),
  replaceJsonPath: (expr, json, newValue) => ipcRenderer.invoke('replace-json-path', expr, json, newValue),
  loadLocale: (lang) => ipcRenderer.invoke('load-locale', lang),
  updateLocale: (lang) => ipcRenderer.invoke('update-locale', lang),
  onChangeLocale: (callback) => ipcRenderer.on('change-locale', callback),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  showConfirmDialog: (message) => ipcRenderer.invoke('show-confirm-dialog', message)
})
