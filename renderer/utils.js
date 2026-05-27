const $ = selector => document.querySelector(selector)

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
