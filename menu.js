const { Menu } = require('electron')

const setMainMenu = (mainWindow) => {
  const isMac = process.platform === 'darwin'
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open JSON',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('open-file-dialog')
          }
        },
        { type: 'separator' },
        {
          label: 'Save Config',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-config')
          }
        },
        {
          label: 'Load Config',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow.webContents.send('load-config')
          }
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

module.exports = {
  setMainMenu
}
