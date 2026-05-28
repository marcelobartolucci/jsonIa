const $jsonDisplay = document.querySelector('#json-display')
const $fileName = document.querySelector('#file-name')
const $saveBtn = document.querySelector('#save-btn')
const $openBtn = document.querySelector('#open-btn')
const $closeBtn = document.querySelector('#close-btn')

let currentFilePath = null
let jsonData = null
let isDirty = false

$openBtn.addEventListener('click', openFile)
window.electronAPI.onOpenFileDialog(openFile)

$closeBtn.addEventListener('click', closeFile)

$jsonDisplay.addEventListener('input', onInputChange)

$saveBtn.addEventListener('click', async () => {
  const saved = await saveCurrentFile()
  if (saved) {
    window.alert(t('editor.saveSuccess'))
  }
})

async function openFile () {
  const result = await window.electronAPI.openFile()
  if (result) {
    currentFilePath = result.filePath
    isDirty = false
    updateFileNameDisplay()
    try {
      jsonData = JSON.parse(result.content)
      renderJson(jsonData)
      $saveBtn.disabled = false
      $closeBtn.disabled = false
    } catch (e) {
      $jsonDisplay.innerHTML = '<div class="error">' + t('editor.parseError', { message: e.message }) + '</div>'
      $saveBtn.disabled = true
      $closeBtn.disabled = false
    }
  }
}

function onInputChange () {
  if (!isDirty) {
    isDirty = true
    updateFileNameDisplay()
  }
}

function updateFileNameDisplay () {
  $fileName.textContent = currentFilePath + (isDirty ? ' *' : '')
}

async function closeFile () {
  if (isDirty) {
    const choice = await window.electronAPI.showConfirmDialog({
      message: t('editor.confirmClose'),
      buttons: [t('dialog.yes'), t('dialog.no'), t('dialog.cancel')],
      defaultId: 2,
      cancelId: 2
    })
    if (choice === 0) {
      const saved = await saveCurrentFile()
      if (!saved) return
    } else if (choice === 2) {
      return
    }
  }
  currentFilePath = null
  jsonData = null
  isDirty = false
  $jsonDisplay.textContent = t('editor.placeholder')
  $fileName.textContent = t('file.noLoaded')
  $saveBtn.disabled = true
  $closeBtn.disabled = true
}

async function saveCurrentFile () {
  if (!currentFilePath) return false
  try {
    const updatedJson = getUpdatedJson()
    const content = JSON.stringify(updatedJson, null, 2)
    await window.electronAPI.saveFile(currentFilePath, content)
    isDirty = false
    updateFileNameDisplay()
    return true
  } catch (e) {
    window.alert(t('editor.saveError', { message: e.message }))
    return false
  }
}

function renderJson (data) {
  $jsonDisplay.innerHTML = ''
  const container = document.createElement('div')
  container.className = 'json-content'
  renderValue(data, '', 0, container, true, [])
  $jsonDisplay.appendChild(container)
}

const renderers = {
  null: renderNull,
  boolean: renderBoolean,
  number: renderNumber,
  string: renderString,
  array: renderArray,
  object: renderObject
}

function renderValue (value, key, depth, container, isRoot = false, path) {
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
  const renderer = renderers[type]
  if (renderer) renderer(value, key, depth, container, isRoot, path)
}

function buildRow (key, depth, isRoot, path) {
  const row = document.createElement('div')
  row.className = 'json-row'
  row.style.marginLeft = (depth * 20) + 'px'
  if (!isRoot) {
    row.innerHTML = `<span class="json-key">"${key}": </span>`
  }
  return row
}

function renderNull (value, key, depth, container, isRoot, path) {
  const row = buildRow(key, depth, isRoot, path)
  const input = createEditableInput(path, 'null', 'null')
  row.appendChild(input)
  container.appendChild(row)
}

function renderBoolean (value, key, depth, container, isRoot, path) {
  const row = buildRow(key, depth, isRoot, path)
  const input = createEditableInput(path, String(value), 'boolean')
  row.appendChild(input)
  container.appendChild(row)
}

function renderNumber (value, key, depth, container, isRoot, path) {
  const row = buildRow(key, depth, isRoot, path)
  const input = createEditableInput(path, String(value), 'number')
  row.appendChild(input)
  container.appendChild(row)
}

function renderString (value, key, depth, container, isRoot, path) {
  const row = buildRow(key, depth, isRoot, path)
  const input = createEditableInput(path, value, 'string')
  row.appendChild(input)
  container.appendChild(row)
}

function renderArray (value, key, depth, container, isRoot, path) {
  const objPath = [...path]
  const contentWrapper = document.createElement('div')
  contentWrapper.className = 'collapsible-content'

  const row = document.createElement('div')
  row.className = 'json-row collapsible-row'
  row.style.marginLeft = (depth * 20) + 'px'
  row.dataset.path = pathToString(objPath)

  const toggle = document.createElement('span')
  toggle.className = 'json-toggle expanded'
  toggle.textContent = '▼'
  row.appendChild(toggle)

  const keyDisplay = isRoot ? '' : `<span class="json-key">"${key}": </span>`
  row.innerHTML = row.innerHTML + keyDisplay + '<span class="json-bracket">[</span>'
  row.innerHTML = row.innerHTML + `<span class="json-count">${t('editor.items', { count: value.length })}</span>`
  row.innerHTML = row.innerHTML + '<span class="json-bracket">]</span>'

  contentWrapper.appendChild(row)

  if (value.length > 0) {
    value.forEach((item, index) => {
      renderValue(item, index, depth + 1, contentWrapper, false, [...objPath, index])
    })

    const closeRow = document.createElement('div')
    closeRow.className = 'json-row'
    closeRow.style.marginLeft = (depth * 20) + 'px'
    closeRow.innerHTML = '<span class="json-bracket close-bracket">]</span>'
    contentWrapper.appendChild(closeRow)
  }

  container.appendChild(contentWrapper)

  row.addEventListener('click', (e) => {
    if (e.target.classList.contains('json-toggle') || e.target.classList.contains('json-bracket') || e.target.classList.contains('json-count')) {
      toggleCollapse(row, contentWrapper)
    }
  })
}

function renderObject (value, key, depth, container, isRoot, path) {
  const objPath = [...path]
  const contentWrapper = document.createElement('div')
  contentWrapper.className = 'collapsible-content'

  const row = document.createElement('div')
  row.className = 'json-row collapsible-row'
  row.style.marginLeft = (depth * 20) + 'px'
  row.dataset.path = pathToString(objPath)

  const toggle = document.createElement('span')
  toggle.className = 'json-toggle expanded'
  toggle.textContent = '▼'
  row.appendChild(toggle)

  const keyDisplay = isRoot ? '' : `<span class="json-key">"${key}": </span>`
  row.innerHTML = row.innerHTML + keyDisplay + '<span class="json-bracket">{</span>'
  row.innerHTML = row.innerHTML + `<span class="json-count">${t('editor.keys', { count: Object.keys(value).length })}</span>`
  row.innerHTML = row.innerHTML + '<span class="json-bracket">}</span>'

  contentWrapper.appendChild(row)

  if (Object.keys(value).length > 0) {
    Object.keys(value).forEach(k => {
      renderValue(value[k], k, depth + 1, contentWrapper, false, [...objPath, k])
    })

    const closeRow = document.createElement('div')
    closeRow.className = 'json-row'
    closeRow.style.marginLeft = (depth * 20) + 'px'
    closeRow.innerHTML = '<span class="json-bracket close-bracket">}</span>'
    contentWrapper.appendChild(closeRow)
  }

  container.appendChild(contentWrapper)

  row.addEventListener('click', (e) => {
    if (e.target.classList.contains('json-toggle') || e.target.classList.contains('json-bracket') || e.target.classList.contains('json-count')) {
      toggleCollapse(row, contentWrapper)
    }
  })
}

function toggleCollapse (row, contentWrapper) {
  const toggle = row.querySelector('.json-toggle')
  const children = Array.from(contentWrapper.children).filter(c => c !== row)
  const closeBracket = contentWrapper.querySelector('.close-bracket')

  if (row.classList.contains('collapsed')) {
    row.classList.remove('collapsed')
    toggle.classList.remove('collapsed')
    toggle.classList.add('expanded')
    toggle.textContent = '▼'
    children.forEach((c) => { c.style.display = '' })
    if (closeBracket) closeBracket.style.display = ''
  } else {
    row.classList.add('collapsed')
    toggle.classList.remove('expanded')
    toggle.classList.add('collapsed')
    toggle.textContent = '▶'
    children.forEach((c) => { c.style.display = 'none' })
    if (closeBracket) closeBracket.style.display = 'none'
  }
}

function getUpdatedJson () {
  const inputs = document.querySelectorAll('.json-input')
  const result = JSON.parse(JSON.stringify(jsonData))

  inputs.forEach(input => {
    const path = input.dataset.path
    const value = input.value
    const type = input.dataset.type
    const keys = path.split(/[.[\]]/).filter(Boolean)
    let current = result

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      current = isNaN(k) ? current[k] : current[parseInt(k)]
    }

    const lastKey = keys[keys.length - 1]
    const finalKey = isNaN(lastKey) ? lastKey : parseInt(lastKey)

    if (type === 'number') {
      current[finalKey] = isNaN(parseFloat(value)) ? value : parseFloat(value)
    } else if (type === 'null') {
      current[finalKey] = value === 'null' ? null : value
    } else if (type === 'boolean') {
      current[finalKey] = value === 'true'
    } else if (type === 'array') {
      try { current[finalKey] = JSON.parse(value) } catch { current[finalKey] = value }
    } else {
      current[finalKey] = value
    }
  })

  return result
}
