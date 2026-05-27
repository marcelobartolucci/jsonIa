const { Menu } = require('electron')
const path = require('path')
const fs = require('fs')

function loadLocaleData (lang) {
  const filePath = path.join(__dirname, 'locales', `${lang}.json`)
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

const setMainMenu = (mainWindow, locale, currentLang, currentTheme) => {
  const t = (key) => (locale && locale[key]) || key
  const isMac = process.platform === 'darwin'

  function buildLanguageSubmenu () {
    const languages = [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' }
    ]
    return languages.map(lang => ({
      label: lang.label,
      type: 'radio',
      checked: currentLang === lang.value,
      click: () => {
        const newLocale = loadLocaleData(lang.value)
        if (newLocale) {
          setMainMenu(mainWindow, newLocale, lang.value, currentTheme)
          mainWindow.webContents.send('change-locale', lang.value)
        }
      }
    }))
  }

  function buildThemeSubmenu () {
    const themes = [
      { value: 'system', label: t('menu.theme.system') },
      { value: 'light', label: t('menu.theme.light') },
      { value: 'dark', label: t('menu.theme.dark') }
    ]
    return themes.map(theme => ({
      label: theme.label,
      type: 'radio',
      checked: currentTheme === theme.value,
      click: () => {
        setMainMenu(mainWindow, locale, currentLang, theme.value)
        mainWindow.webContents.send('update-theme', theme.value)
      }
    }))
  }

  const template = [
    {
      label: t('menu.file'),
      submenu: [
        {
          label: t('menu.openJson'),
          accelerator: 'CmdOrCtrl+O',
          click: () => { mainWindow.webContents.send('open-file-dialog') }
        },
        { type: 'separator' },
        {
          label: t('menu.saveConfig'),
          accelerator: 'CmdOrCtrl+S',
          click: () => { mainWindow.webContents.send('save-config') }
        },
        {
          label: t('menu.loadConfig'),
          accelerator: 'CmdOrCtrl+L',
          click: () => { mainWindow.webContents.send('load-config') }
        },
        { type: 'separator' },
        {
          label: t('menu.preferences'),
          submenu: [
            {
              label: t('menu.language'),
              submenu: buildLanguageSubmenu()
            },
            {
              label: t('menu.theme'),
              submenu: buildThemeSubmenu()
            }
          ]
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports = { setMainMenu }
