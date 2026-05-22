const $ = selector => document.querySelector(selector)

const $jsonDisplay = $('#json-display')
const $fileName = $('#file-name')
const $saveBtn = $('#save-btn')
const $openBtn = $('#open-btn')
const $tabs = document.querySelectorAll('.tab')
const $tabContents = document.querySelectorAll('.tab-content')

let currentFilePath = null
let jsonData = null

$tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    $tabs.forEach(t => t.classList.remove('active'))
    $tabContents.forEach(c => c.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(tab.dataset.tab).classList.add('active')
  })
})

async function openFile () {
  const result = await window.electronAPI.openFile()
  if (result) {
    currentFilePath = result.filePath
    $fileName.textContent = result.filePath
    try {
      jsonData = JSON.parse(result.content)
      renderJson(jsonData)
      $saveBtn.disabled = false
    } catch (e) {
      $jsonDisplay.innerHTML = '<div class="error">Error parsing JSON: ' + e.message + '</div>'
      $saveBtn.disabled = true
    }
  }
}

$openBtn.addEventListener('click', openFile)

window.electronAPI.onOpenFileDialog(openFile)

function renderJson (data) {
  $jsonDisplay.innerHTML = ''
  const container = document.createElement('div')
  container.className = 'json-content'
  renderValue(data, '', 0, container, true, [])
  $jsonDisplay.appendChild(container)
}

function renderValue (value, key, depth, container, isRoot = false, path) {
  const indent = depth * 20
  const keyDisplay = isRoot ? '' : `<span class="json-key">"${key}": </span>`

  if (value === null) {
    const row = document.createElement('div')
    row.className = 'json-row'
    row.style.marginLeft = indent + 'px'
    const input = createEditableInput(path, 'null', 'null')
    row.innerHTML = keyDisplay
    row.appendChild(input)
    container.appendChild(row)
  } else if (typeof value === 'boolean') {
    const row = document.createElement('div')
    row.className = 'json-row'
    row.style.marginLeft = indent + 'px'
    const input = createEditableInput(path, String(value), 'boolean')
    row.innerHTML = keyDisplay
    row.appendChild(input)
    container.appendChild(row)
  } else if (typeof value === 'number') {
    const row = document.createElement('div')
    row.className = 'json-row'
    row.style.marginLeft = indent + 'px'
    const input = createEditableInput(path, String(value), 'number')
    row.innerHTML = keyDisplay
    row.appendChild(input)
    container.appendChild(row)
  } else if (typeof value === 'string') {
    const row = document.createElement('div')
    row.className = 'json-row'
    row.style.marginLeft = indent + 'px'
    const input = createEditableInput(path, value, 'string')
    row.innerHTML = keyDisplay
    row.appendChild(input)
    container.appendChild(row)
  } else if (Array.isArray(value)) {
    const objPath = [...path]
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'collapsible-content'

    const row = document.createElement('div')
    row.className = 'json-row collapsible-row'
    row.style.marginLeft = indent + 'px'
    row.dataset.path = pathToString(objPath)

    const toggle = document.createElement('span')
    toggle.className = 'json-toggle expanded'
    toggle.textContent = '▼'
    row.appendChild(toggle)
    row.innerHTML = row.innerHTML + keyDisplay + '<span class="json-bracket">[</span>'
    row.innerHTML = row.innerHTML + `<span class="json-count">${value.length} items</span>`
    row.innerHTML = row.innerHTML + '<span class="json-bracket">]</span>'

    contentWrapper.appendChild(row)

    if (value.length > 0) {
      value.forEach((item, index) => {
        renderValue(item, index, depth + 1, contentWrapper, false, [...objPath, index])
      })

      const closeRow = document.createElement('div')
      closeRow.className = 'json-row'
      closeRow.style.marginLeft = indent + 'px'
      closeRow.innerHTML = '<span class="json-bracket close-bracket">]</span>'
      contentWrapper.appendChild(closeRow)
    }

    container.appendChild(contentWrapper)

    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('json-toggle') || e.target.classList.contains('json-bracket') || e.target.classList.contains('json-count')) {
        toggleCollapse(row, contentWrapper)
      }
    })
  } else if (typeof value === 'object') {
    const objPath = [...path]
    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'collapsible-content'

    const row = document.createElement('div')
    row.className = 'json-row collapsible-row'
    row.style.marginLeft = indent + 'px'
    row.dataset.path = pathToString(objPath)

    const toggle = document.createElement('span')
    toggle.className = 'json-toggle expanded'
    toggle.textContent = '▼'
    row.appendChild(toggle)
    row.innerHTML = row.innerHTML + keyDisplay + '<span class="json-bracket">{</span>'
    row.innerHTML = row.innerHTML + `<span class="json-count">${Object.keys(value).length} keys</span>`
    row.innerHTML = row.innerHTML + '<span class="json-bracket">}</span>'

    contentWrapper.appendChild(row)

    if (Object.keys(value).length > 0) {
      Object.keys(value).forEach(k => {
        renderValue(value[k], k, depth + 1, contentWrapper, false, [...objPath, k])
      })

      const closeRow = document.createElement('div')
      closeRow.className = 'json-row'
      closeRow.style.marginLeft = indent + 'px'
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
}

function toggleCollapse (row, contentWrapper) {
  const toggle = row.querySelector('.json-toggle')
  const children = contentWrapper.querySelectorAll('.json-row:not(.collapsible-row), .collapsible-content')
  const closeBracket = contentWrapper.querySelector('.close-bracket')

  if (row.classList.contains('collapsed')) {
    row.classList.remove('collapsed')
    toggle.classList.remove('collapsed')
    toggle.classList.add('expanded')
    toggle.textContent = '▼'
    children.forEach((c) => {
      c.style.display = ''
    })
    if (closeBracket) {
      closeBracket.style.display = ''
    }
  } else {
    row.classList.add('collapsed')
    toggle.classList.remove('expanded')
    toggle.classList.add('collapsed')
    toggle.textContent = '▶'
    children.forEach((c) => {
      c.style.display = 'none'
    })
    if (closeBracket) {
      closeBracket.style.display = 'none'
    }
  }
}

function pathToString (path) {
  return path.map((p, i) => {
    if (typeof p === 'number') return `[${p}]`
    return i === 0 ? p : `.${p}`
  }).join('')
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
  copyBtn.title = 'Copy to clipboard'
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
  pasteBtn.title = 'Paste from clipboard'
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
      try {
        current[finalKey] = JSON.parse(value)
      } catch (e) {
        current[finalKey] = value
      }
    } else {
      current[finalKey] = value
    }
  })

  return result
}

$saveBtn.addEventListener('click', async () => {
  if (!currentFilePath) return
  try {
    const updatedJson = getUpdatedJson()
    const content = JSON.stringify(updatedJson, null, 2)
    await window.electronAPI.saveFile(currentFilePath, content)
    window.alert('File saved successfully!')
  } catch (e) {
    window.alert('Error saving file: ' + e.message)
  }
})

const $destFilesName = $('#dest-files-name')
const $destFilesList = $('#dest-files-list')
const $replaceBtn = $('#replace-btn')
const $replaceResult = $('#replace-result')
const $loadDestBtn = $('#load-dest-btn')
const $manualKey = $('#manual-key')
const $manualValue = $('#manual-value')
const $addKeyBtn = $('#add-key-btn')
const $keysList = $('#keys-list')
const $saveConfigBtn = $('#save-config-btn')
const $loadConfigBtn = $('#load-config-btn')

let destFiles = []
let keys = []

function renderKeys () {
  if (keys.length === 0) {
    $keysList.innerHTML = '<p style="opacity:0.6">No hay claves agregadas. Agregue claves manualmente o cargue una configuración.</p>'
  } else {
    $keysList.innerHTML = '<div class="keys-list">' + keys.map((k, i) => 
      `<span class="key-tag manual-key" data-index="${i}">
        <span class="key-name">${k.key}</span>: <span class="key-value">${JSON.stringify(k.value)}</span>
        <span class="key-actions">
          <button class="key-edit-btn" data-index="${i}" title="Editar">✎</button>
          <button class="key-delete-btn" data-index="${i}" title="Eliminar">✕</button>
        </span>
      </span>`
    ).join('') + '</div>'

    $keysList.querySelectorAll('.key-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const i = parseInt(btn.dataset.index)
        const entry = keys[i]
        $manualKey.value = entry.key
        $manualValue.value = String(entry.value)
        keys.splice(i, 1)
        renderKeys()
        $manualKey.focus()
      })
    })

    $keysList.querySelectorAll('.key-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const i = parseInt(btn.dataset.index)
        keys.splice(i, 1)
        renderKeys()
      })
    })
  }
  updateReplaceBtn()
}

$addKeyBtn.addEventListener('click', () => {
  const key = $manualKey.value.trim()
  const value = $manualValue.value.trim()
  if (!key) return
  const existing = keys.find(k => k.key === key)
  if (existing) {
    const overwrite = confirm('La clave "' + key + '" ya existe con valor:\n' + JSON.stringify(existing.value) + '\n\n¿Desea sobrescribirla?')
    if (!overwrite) return
    let parsedValue = value
    if (value === 'true') parsedValue = true
    else if (value === 'false') parsedValue = false
    else if (value === 'null') parsedValue = null
    else if (!isNaN(value) && value !== '') parsedValue = parseFloat(value)
    existing.value = parsedValue
    $manualKey.value = ''
    $manualValue.value = ''
    $manualKey.focus()
    renderKeys()
    return
  }
  let parsedValue = value
  if (value === 'true') parsedValue = true
  else if (value === 'false') parsedValue = false
  else if (value === 'null') parsedValue = null
  else if (!isNaN(value) && value !== '') parsedValue = parseFloat(value)
  keys.push({ key, value: parsedValue })
  $manualKey.value = ''
  $manualValue.value = ''
  $manualKey.focus()
  renderKeys()
})

$manualKey.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $manualValue.focus()
})
$manualValue.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $addKeyBtn.click()
})

renderKeys()

async function saveConfig () {
  const config = {
    keys: keys,
    destPaths: destFiles.map(f => f.filePath)
  }
  const result = await window.electronAPI.saveConfig(config)
  if (result) {
    alert('Configuración guardada en:\n' + result)
  }
}

async function loadConfig () {
  const config = await window.electronAPI.loadConfig()
  if (config) {
    keys = config.keys || []
    renderKeys()
    if (config.destPaths && config.destPaths.length > 0) {
      try {
        const files = await window.electronAPI.readFiles(config.destPaths)
        destFiles = files
        $destFilesName.value = files.map(f => f.filePath).join(', ')
        $destFilesList.innerHTML = '<ul>' + files.map(f =>
          `<li>${f.filePath}</li>`
        ).join('') + '</ul>'
        updateReplaceBtn()
      } catch (e) {
        $destFilesList.innerHTML = '<div class="error">Error al cargar archivos destino</div>'
      }
    }
  }
}

$saveConfigBtn.addEventListener('click', saveConfig)
$loadConfigBtn.addEventListener('click', loadConfig)
window.electronAPI.onSaveConfig(saveConfig)
window.electronAPI.onLoadConfig(loadConfig)

$loadDestBtn.addEventListener('click', async () => {
  const files = await window.electronAPI.openFiles()
  if (files.length > 0) {
    destFiles = files
    $destFilesName.value = files.map(f => f.filePath).join(', ')
    $destFilesList.innerHTML = '<ul>' + files.map(f => 
      `<li>${f.filePath}</li>`
    ).join('') + '</ul>'
    updateReplaceBtn()
  }
})

function updateReplaceBtn () {
  $replaceBtn.disabled = !(keys.length > 0 && destFiles.length > 0)
}

$replaceBtn.addEventListener('click', async () => {
  if (!(keys.length > 0) || destFiles.length === 0) return

  let totalReplaced = 0
  const results = []

  for (const destFile of destFiles) {
    try {
      const destData = JSON.parse(destFile.content)
      let replaced = 0

      for (const keyInfo of keys) {
        const path = parseJsonPath(keyInfo.key)
        const matches = path ? evaluatePath(destData, path, 0) : []
        showDiagnostic(`Parse "${keyInfo.key}" → tokens: ${JSON.stringify(path)}\nMatches: ${JSON.stringify(matches)}\nVal: ${keyInfo.value}`)
        for (const ref of matches) {
          ref.parent[ref.key] = keyInfo.value
          replaced++
        }
      }
      if (replaced > 0) {
        const newContent = JSON.stringify(destData, null, 2)
        await window.electronAPI.saveFile(destFile.filePath, newContent)
      }
      totalReplaced += replaced
      results.push({ file: destFile.filePath, replaced, status: 'success' })
    } catch (e) {
      results.push({ file: destFile.filePath, replaced: 0, status: 'error', error: e.message })
    }
  }

  $replaceResult.innerHTML = `
    <h3>Resultados:</h3>
    <p><strong>Total de valores reemplazados:</strong> ${totalReplaced}</p>
    <ul>
      ${results.map(r => `
        <li class="${r.status}">
          ${r.file}: ${r.replaced} valores reemplazados
          ${r.error ? `- Error: ${r.error}` : ''}
        </li>
      `).join('')}
    </ul>
  `
})

function parseJsonPath (expr) {
  if (!expr.startsWith('$')) {
    expr = '$.' + expr
  }
  const tokens = []
  let i = 0
  while (i < expr.length) {
    if (expr[i] === '$') { i++; continue }
    if (expr[i] === '.') {
      i++
      let key = ''
      while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') {
        key += expr[i++]
      }
      if (key) tokens.push({ type: 'key', value: key })
    } else if (expr[i] === '[') {
      i++
      let content = ''
      while (i < expr.length && expr[i] !== ']') content += expr[i++]
      i++ // skip ]
      content = content.replace(/['"]/g, '')
      if (content === '*') {
        tokens.push({ type: 'wildcard' })
      } else if (!isNaN(content) && content !== '') {
        tokens.push({ type: 'index', value: parseInt(content) })
      } else if (content) {
        tokens.push({ type: 'key', value: content })
      }
    } else {
      i++
    }
  }
  return tokens.length > 0 ? tokens : null
}

function evaluatePath (obj, path, depth) {
  if (depth >= path.length) return [{ parent: null, key: null, value: obj }]

  const token = path[depth]
  const results = []
  const isLast = depth + 1 === path.length

  if (token.type === 'key') {
    if (obj && typeof obj === 'object' && token.value in obj) {
      if (isLast) {
        results.push({ parent: obj, key: token.value, value: obj[token.value] })
      } else {
        results.push(...evaluatePath(obj[token.value], path, depth + 1))
      }
    }
  } else if (token.type === 'index') {
    if (Array.isArray(obj) && token.value < obj.length) {
      if (isLast) {
        results.push({ parent: obj, key: token.value, value: obj[token.value] })
      } else {
        results.push(...evaluatePath(obj[token.value], path, depth + 1))
      }
    }
  } else if (token.type === 'wildcard') {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (isLast) {
          results.push({ parent: obj, key: i, value: obj[i] })
        } else {
          results.push(...evaluatePath(obj[i], path, depth + 1))
        }
      }
    }
  }

  return results
}

function showDiagnostic (msg) {
  const el = document.createElement('pre')
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#333;color:#0f0;padding:12px;z-index:9999;font-size:13px;margin:0;max-height:200px;overflow:auto'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 8000)
}
