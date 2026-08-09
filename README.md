# Ollama Cookie Sync (optional)

> **⚠️ OPTIONAL — you do not need this extension.** It is a convenience add-on
> for the [Hermes ollama-usage-monitor plugin](https://github.com/Kosello/hermes-ollama-usage-monitor).
> The plugin works fully without it. This extension only removes the rare
> manual re-paste of your Ollama Cloud session cookie (~every 2 months).

> **⚠️ WORK IN PROGRESS — expect bugs.** This extension is under active
> development and has not been extensively tested across browser versions.

Chromium extension (Brave, Chrome, Arc — all Chromium-based) that watches the
Ollama Cloud `__Secure-session` cookie and pushes it to a local sync listener,
which updates `~/.hermes/ollama_cookie.txt` automatically. The moment your
cookie rotates (login, re-issue, expiry), the plugin keeps working — no manual
steps.

## Why HttpOnly cookies need an extension

`__Secure-session` is **HttpOnly** — JavaScript on a webpage can never read it.
A bookmarklet or userscript cannot work. The `chrome.cookies` API is the only
way to read it, and that requires an extension. The extension runs entirely
locally and pushes only to `127.0.0.1`.

## Install

### 1. Start the sync listener (once)

```bash
# from the ollama-usage-monitor repo
python3 cookie-sync-listener.py
# → prints a pairing token like:  x7Kq9...  (also saved to
#   ~/.hermes/ollama-cookie-sync-token.txt)
```

Keep it running (optionally via launchd/cron — see below).

### 2. Load the extension

1. Open **brave://extensions** (or `chrome://extensions` / Arc's extension page)
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select this `ollama-cookie-sync-extension` folder
4. Open the extension's **Options** (right-click icon → Options)
5. **Enable** the toggle (it is **off by default** — opt-in only)
6. Paste the pairing token from step 1
7. Save

### 3. Verify

Click the extension icon → it shows **"Enabled — cookie found. Auto-sync active."**
Log out and back in on ollama.com, or just click **Sync now** — the plugin chip
should keep working without touching any files.

## What it does (and does not) do

| | |
|---|---|
| Reads | only the `__Secure-session` cookie for `*.ollama.com` |
| Sends | that cookie to `http://127.0.0.1:8765/sync` (loopback only) |
| Stores | your pairing token in `chrome.storage.local` (per-browser profile) |
| Does NOT | read other cookies, other sites, browsing history, or send anything to the internet |

The extension is **disabled by default** and does nothing until you enable it
and add the token.

## Auto-start the listener (launchd, optional)

```xml
<!-- ~/Library/LaunchAgents/ai.hermes.ollama-cookie-sync.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>ai.hermes.ollama-cookie-sync</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>/Users/&lt;you&gt;/Projects/ollama-usage-monitor/cookie-sync-listener.py</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/ai.hermes.ollama-cookie-sync.plist
```

## Security model

- Listener binds **127.0.0.1 only** — unreachable from your network
- Every request needs a **Bearer token** (random 24 bytes, generated on first run)
- Cookie is validated (length + ASCII) and written atomically (temp + rename)
- The cookie value is **never logged** — only length + timestamp
- Token file is chmod 600

## Files

```
manifest.json      # MV3 manifest — cookies + storage permissions only
background.js      # cookie watcher + push logic
popup.html/.js     # status + "Sync now"
options.html/.js   # enable toggle, listener URL, token
icons/             # generated icons
```

## License

MIT
