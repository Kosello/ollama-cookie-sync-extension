// Ollama Cookie Sync — OPTIONAL companion to the Hermes ollama-usage-monitor
// plugin. Reads the HttpOnly __Secure-session cookie via chrome.cookies (the
// only API that can see HttpOnly cookies) and pushes it to the local sync
// listener (127.0.0.1:8765) with a Bearer token.
//
// The plugin works perfectly WITHOUT this extension — it only removes the
// rare manual re-paste (~every 2 months) when the session cookie rotates.

const DEFAULTS = {
  enabled: false, // opt-in by default — never pushes until you enable it
  listenerUrl: 'http://127.0.0.1:8765',
  token: ''
}

let settings = { ...DEFAULTS }

async function loadSettings() {
  const stored = await chrome.storage.local.get(DEFAULTS)
  settings = { ...DEFAULTS, ...stored }
}

async function getSessionCookie() {
  for (const domain of ['ollama.com', '.ollama.com']) {
    const cookie = await chrome.cookies.get({
      name: '__Secure-session',
      url: `https://${domain}`
    })
    if (cookie && cookie.value) return cookie
  }
  return null
}

async function pushCookie(cookie, cause) {
  if (!settings.enabled || !settings.token) return
  try {
    const resp = await fetch(settings.listenerUrl + '/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + settings.token
      },
      body: JSON.stringify({ cookie: cookie.value, source: 'browser-extension', cause })
    })
    if (!resp.ok) {
      console.warn('[ollama-cookie-sync] push failed:', resp.status, await resp.text())
    }
  } catch (e) {
    console.warn('[ollama-cookie-sync] listener unreachable — is the sync listener running?', e.message)
  }
}

async function syncNow(cause) {
  await loadSettings()
  const cookie = await getSessionCookie()
  if (cookie) await pushCookie(cookie, cause)
}

// Fire the moment the session cookie changes (login, rotation, re-issue).
chrome.cookies.onChanged.addListener((changeInfo) => {
  const c = changeInfo.cookie
  if (!c || c.name !== '__Secure-session') return
  if (!String(c.domain).includes('ollama.com')) return
  if (changeInfo.removed) return
  syncNow(changeInfo.cause)
})

chrome.runtime.onInstalled.addListener(() => syncNow('install'))
chrome.runtime.onStartup.addListener(() => syncNow('startup'))

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'SYNC_NOW') {
    syncNow('manual').then(() => sendResponse({ ok: true }))
    return true
  }
  if (msg?.type === 'GET_STATUS') {
    loadSettings().then(async () => {
      const cookie = await getSessionCookie()
      sendResponse({
        enabled: settings.enabled,
        hasCookie: Boolean(cookie),
        listenerUrl: settings.listenerUrl,
        tokenSet: Boolean(settings.token)
      })
    })
    return true
  }
  return false
})
