const statusEl = document.getElementById('status')
const syncBtn = document.getElementById('sync')

async function refresh() {
  const resp = await chrome.runtime.sendMessage({ type: 'GET_STATUS' })
  statusEl.className = 'status ' + (resp.enabled ? (resp.hasCookie ? 'ok' : 'warn') : 'off')
  statusEl.textContent = resp.enabled
    ? (resp.hasCookie ? 'Enabled — cookie found. Auto-sync active.' : 'Enabled — no ollama.com session cookie found (log in first).')
    : 'Disabled — enable it in Settings.'
  syncBtn.disabled = !resp.enabled || !resp.tokenSet
}

syncBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'SYNC_NOW' })
  syncBtn.textContent = 'Synced ✓'
  setTimeout(() => (syncBtn.textContent = 'Sync now'), 1500)
  refresh()
})

refresh()
