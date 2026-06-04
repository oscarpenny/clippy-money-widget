const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

// substrate-clippy lives inside this app folder (a nested checkout of life-os-bot),
// so anchor to __dirname rather than the home dir — survives the app being moved.
const COST_DIR = path.join(__dirname, 'substrate-clippy/ai-workflow/data/cost')
const CAP = 100

function readSpend () {
  const state = JSON.parse(fs.readFileSync(path.join(COST_DIR, 'tripwire_state.json'), 'utf8'))
  const periodStart = state.period_start

  let inTok = 0, outTok = 0, cacheTok = 0
  try {
    const lines = fs.readFileSync(path.join(COST_DIR, 'claude_usage.jsonl'), 'utf8').trim().split('\n')
    for (const line of lines) {
      if (!line) continue
      let r
      try { r = JSON.parse(line) } catch (e) { continue }
      if (r.ts.slice(0, 10) < periodStart) continue
      if (r.counts_against_credit === false) continue
      inTok += r.input_tokens || 0
      outTok += r.output_tokens || 0
      cacheTok += (r.cache_creation_input_tokens || 0) + (r.cache_read_input_tokens || 0)
    }
  } catch (e) {}

  const total = state.period_total
  const projected = state.projected_period
  const pct = Math.round((total / CAP) * 100)

  let level = 'ok'
  if (projected > CAP) level = 'over'
  else if (projected > CAP * 0.7) level = 'warn'

  // cycle window: starts on period_start (the 26th), resets one month later
  const fmt = function (d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
  const start = new Date(periodStart + 'T00:00:00')
  const reset = new Date(start); reset.setMonth(reset.getMonth() + 1)
  const end = new Date(reset); end.setDate(end.getDate() - 1)
  const daysLeft = Math.max(0, Math.ceil((reset - new Date()) / 86400000))

  return {
    total: total, cap: CAP, pct: pct, projected: projected, level: level,
    inTok: inTok, outTok: outTok, cacheTok: cacheTok,
    cycleLabel: fmt(start) + ' \u2013 ' + fmt(end),
    resetLabel: fmt(reset), daysLeft: daysLeft,
    regressed: state.model_regressed || []
  }
}

ipcMain.handle('get-spend', function () { return readSpend() })
ipcMain.handle('get-window-pos', function (e) {
  return BrowserWindow.fromWebContents(e.sender).getPosition()
})
ipcMain.on('set-window-pos', function (e, x, y) {
  BrowserWindow.fromWebContents(e.sender).setPosition(Math.round(x), Math.round(y))
})
ipcMain.on('set-window-size', function (e, w, h) {
  BrowserWindow.fromWebContents(e.sender).setSize(Math.round(w), Math.round(h))
})

function createWindow () {
  const win = new BrowserWindow({
    width: 160, height: 130,
    transparent: true, frame: false, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, resizable: true,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })
  win.loadFile('index.html')
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
}

app.whenReady().then(function () {
  if (app.dock) app.dock.hide()
  createWindow()
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
