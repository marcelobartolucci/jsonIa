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

$addKeyBtn.addEventListener('click', () => {
  const key = $manualKey.value.trim()
  const value = $manualValue.value.trim()
  if (!key) return

  const existing = keys.find(k => k.key === key)
  if (existing) {
    const overwrite = confirm(t('replacer.keyExists', { key, value: JSON.stringify(existing.value) }))
    if (!overwrite) return
    existing.value = parseValue(value)
    $manualKey.value = ''
    $manualValue.value = ''
    $manualKey.focus()
    renderKeys()
    return
  }

  keys.push({ key, value: parseValue(value) })
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

$loadDestBtn.addEventListener('click', async () => {
  const files = await window.electronAPI.openFiles()
  if (files.length > 0) {
    const existingPaths = new Set(destFiles.map(f => f.filePath))
    for (const file of files) {
      if (!existingPaths.has(file.filePath)) {
        destFiles.push(file)
        existingPaths.add(file.filePath)
      }
    }
    renderDestFiles()
    updateReplaceBtn()
  }
})

$replaceBtn.addEventListener('click', async () => {
  if (!(keys.length > 0) || destFiles.length === 0) return

  let totalReplaced = 0
  const results = []

  for (const destFile of destFiles) {
    try {
      let destData = JSON.parse(destFile.content)
      let replaced = 0

      for (const keyInfo of keys) {
        try {
          const result = await window.electronAPI.replaceJsonPath(keyInfo.key, destData, keyInfo.value)
          replaced += result.count
          destData = JSON.parse(result.json)
        } catch {
          continue
        }
      }
      if (replaced > 0) {
        await window.electronAPI.saveFile(destFile.filePath, JSON.stringify(destData, null, 2))
      }
      totalReplaced += replaced
      results.push({ file: destFile.filePath, replaced, status: 'success' })
    } catch (e) {
      results.push({ file: destFile.filePath, replaced: 0, status: 'error', error: e.message })
    }
  }

  $replaceResult.innerHTML = `
    <h3>${t('replacer.resultsTitle')}</h3>
    <p><strong>${t('replacer.totalReplaced', { count: totalReplaced })}</strong></p>
    <ul>
      ${results.map(r => `
        <li class="${r.status}">
          ${r.file}: ${t('replacer.replacedCount', { count: r.replaced })}
          ${r.error ? `- ${t('replacer.replaceError', { message: r.error })}` : ''}
        </li>
      `).join('')}
    </ul>
  `
})

$saveConfigBtn.addEventListener('click', saveConfig)
$loadConfigBtn.addEventListener('click', loadConfig)
window.electronAPI.onSaveConfig(saveConfig)
window.electronAPI.onLoadConfig(loadConfig)

function renderKeys () {
  if (keys.length === 0) {
    $keysList.innerHTML = `<p style="opacity:0.6">${t('replacer.noKeys')}</p>`
  } else {
    $keysList.innerHTML = '<div class="keys-list">' + keys.map((k, i) =>
      `<span class="key-tag manual-key" data-index="${i}">
        <span class="key-name">${k.key}</span>: <span class="key-value">${JSON.stringify(k.value)}</span>
        <span class="key-actions">
          <button class="key-edit-btn" data-index="${i}" title="${t('replacer.editTitle')}">✎</button>
          <button class="key-delete-btn" data-index="${i}" title="${t('replacer.deleteTitle')}">✕</button>
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

function renderDestFiles () {
  if (destFiles.length === 0) {
    $destFilesList.innerHTML = ''
    $destFilesName.value = ''
  } else {
    $destFilesName.value = destFiles.map(f => f.filePath).join(', ')
    $destFilesList.innerHTML = '<ul>' + destFiles.map((f, i) => {
      const name = f.filePath.split(/[/\\]/).pop()
      return `<li><span class="dest-file-path" title="${f.filePath}">${name}</span> <button class="dest-remove-btn" data-index="${i}" title="${t('replacer.removeTitle')}">✕</button></li>`
    }).join('') + '</ul>'
    $destFilesList.querySelectorAll('.dest-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const i = parseInt(btn.dataset.index)
        destFiles.splice(i, 1)
        renderDestFiles()
        updateReplaceBtn()
      })
    })
  }
}

function updateReplaceBtn () {
  $replaceBtn.disabled = !(keys.length > 0 && destFiles.length > 0)
}

async function saveConfig () {
  const config = {
    keys,
    destPaths: destFiles.map(f => f.filePath)
  }
  const result = await window.electronAPI.saveConfig(config)
  if (result) {
    alert(t('replacer.configSaved', { path: result }))
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
        renderDestFiles()
        updateReplaceBtn()
      } catch (e) {
        $destFilesList.innerHTML = `<div class="error">${t('replacer.loadError')}</div>`
      }
    }
  }
}

onLocaleChange(renderKeys)
renderKeys()
