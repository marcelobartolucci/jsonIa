const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron')
const path = require('path')
const fs = require('fs')
const { JSONPath } = require('jsonpath-plus')
const { setMainMenu } = require('./menu.js')

let mainWindow
let currentTheme = 'system'

function loadLocaleData (lang) {
  const filePath = path.join(__dirname, 'locales', `${lang}.json`)
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, '/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.loadFile('index.html')

  const locale = loadLocaleData('es')
  setMainMenu(mainWindow, locale, 'es', currentTheme)
}

ipcMain.handle('load-locale', async (event, lang) => {
  return loadLocaleData(lang)
})

ipcMain.handle('update-locale', async (event, lang) => {
  const locale = loadLocaleData(lang)
  if (locale) setMainMenu(mainWindow, locale, lang, currentTheme)
})

ipcMain.handle('set-theme', async (event, theme) => {
  currentTheme = theme
  const native = theme === 'carbon' ? 'dark' : theme
  nativeTheme.themeSource = native
})

app.whenReady().then(() => {
  createWindow()
})

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result.canceled) return null
  const filePath = result.filePaths[0]
  const content = fs.readFileSync(filePath, 'utf-8')
  return { filePath, content }
})

ipcMain.handle('open-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result.canceled) return []
  const files = result.filePaths.map(filePath => ({
    filePath,
    content: fs.readFileSync(filePath, 'utf-8')
  }))
  return files
})

ipcMain.handle('save-file', async (event, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf-8')
})

ipcMain.handle('save-file-with-dialog', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result.canceled) return null
  fs.writeFileSync(result.filePath, content, 'utf-8')
  return result.filePath
})

ipcMain.handle('save-config', async (event, config) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'config.json',
    filters: [{ name: 'JSON Config', extensions: ['json'] }]
  })
  if (result.canceled) return null
  fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2), 'utf-8')
  return result.filePath
})

ipcMain.handle('load-config', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON Config', extensions: ['json'] }]
  })
  if (result.canceled) return null
  const content = fs.readFileSync(result.filePaths[0], 'utf-8')
  return JSON.parse(content)
})

ipcMain.handle('read-files', async (event, filePaths) => {
  return filePaths.map(filePath => {
    try {
      return { filePath, content: fs.readFileSync(filePath, 'utf-8') }
    } catch {
      return { filePath, content: null, error: `Could not read ${filePath}` }
    }
  })
})

ipcMain.handle('show-confirm-dialog', async (event, message) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Sí', 'No'],
    defaultId: 1,
    cancelId: 1,
    message: message
  })
  return result.response === 0
})

ipcMain.handle('replace-json-path', async (event, expr, json, newValue) => {
  const results = JSONPath({ path: expr, json, resultType: 'all' })
  for (const ref of results) {
    ref.parent[ref.parentProperty] = newValue
  }
  return { count: results.length, json: JSON.stringify(json, null, 2) }
})
