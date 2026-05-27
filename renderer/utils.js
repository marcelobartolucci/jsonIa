const $ = selector => document.querySelector(selector)

let locale = {}
let currentLang = localStorage.getItem('locale') || 'es'
let currentTheme = localStorage.getItem('theme') || 'system'
const localeChangeCallbacks = []

function t (key, vars = {}) {
  let str = locale[key]
  if (str === undefined) str = key
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
  })
  return str
}

function translatePage () {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.tagName === 'TITLE') {
      document.title = t(el.dataset.i18n)
    } else {
      el.textContent = t(el.dataset.i18n)
    }
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder)
  })
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle)
  })
}

function onLocaleChange (callback) {
  localeChangeCallbacks.push(callback)
}

async function loadLocale (lang) {
  const data = await window.electronAPI.loadLocale(lang)
  if (data) {
    locale = data
    currentLang = lang
    localStorage.setItem('locale', lang)
    translatePage()
    localeChangeCallbacks.forEach(cb => cb())
  }
}

function applyTheme (theme) {
  currentTheme = theme
  document.documentElement.dataset.theme = theme
}

// When menu triggers a locale change
window.electronAPI.onChangeLocale((event, lang) => {
  loadLocale(lang)
})

// When menu triggers a theme change
window.electronAPI.onUpdateTheme((event, theme) => {
  applyTheme(theme)
  localStorage.setItem('theme', theme)
  window.electronAPI.setTheme(theme)
})

// Start loading locale immediately, then sync locale & theme with main process
loadLocale(currentLang).then(() => {
  window.electronAPI.updateLocale(currentLang)
})
applyTheme(currentTheme)
window.electronAPI.setTheme(currentTheme)

function pathToString (path) {
  return path.map((p, i) => {
    if (typeof p === 'number') return `[${p}]`
    return i === 0 ? p : `.${p}`
  }).join('')
}

function parseValue (value) {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (value !== '' && !isNaN(value)) return parseFloat(value)
  return value
}

function createEditableInput (path, value, type) {
  const wrapper = document.createElement('div')
  wrapper.className = 'input-wrapper'

  const input = document.createElement('input')
  input.type = 'text'
  input.className = `json-input ${type}`
  input.value = value
  input.dataset.path = pathToString(path)
  input.dataset.type = type

  const copyBtn = document.createElement('button')
  copyBtn.className = 'input-btn copy-btn'
  copyBtn.innerHTML = '📋'
  copyBtn.title = t('utils.copyTitle')
  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(input.value)
      copyBtn.innerHTML = '✓'
      setTimeout(() => { copyBtn.innerHTML = '📋' }, 1000)
    } catch (err) {
      console.error('Failed to copy')
    }
  })

  const pasteBtn = document.createElement('button')
  pasteBtn.className = 'input-btn paste-btn'
  pasteBtn.innerHTML = '📨'
  pasteBtn.title = t('utils.pasteTitle')
  pasteBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    try {
      const text = await navigator.clipboard.readText()
      input.value = text
    } catch (err) {
      console.error('Failed to paste')
    }
  })

  wrapper.appendChild(input)
  wrapper.appendChild(pasteBtn)
  wrapper.appendChild(copyBtn)

  return wrapper
}
