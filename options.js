const DEFAULTS = { enabled: false, listenerUrl: 'http://127.0.0.1:8765', token: '' }

async function load() {
  const s = await chrome.storage.local.get(DEFAULTS)
  document.getElementById('enabled').checked = s.enabled
  document.getElementById('listenerUrl').value = s.listenerUrl
  document.getElementById('token').value = s.token
}

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    enabled: document.getElementById('enabled').checked,
    listenerUrl: document.getElementById('listenerUrl').value.trim(),
    token: document.getElementById('token').value.trim()
  })
  const msg = document.getElementById('msg')
  msg.textContent = 'Saved ✓'
  setTimeout(() => (msg.textContent = ''), 1500)
})

load()
