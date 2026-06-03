# 📎 Clippy Money Widget

> An always-on-top desktop **Clippy** that floats on my Mac and tells me how much of my Claude **Agent SDK** budget I've burned this billing cycle.

![Clippy money widget](docs/preview.png)

Click Clippy and he pops a panel showing my Claude spend against my **$100/month cap** — in both dollars and tokens — and reacts with a fitting animation (cheerful when I'm under budget, concerned when I'm projected to blow past it).

This is my **first desktop app**. I built it to learn how Electron, git/GitHub, and the JavaScript toolchain fit together, on top of a real data feed from my own [life-os-bot](https://github.com/oscarpenny/life-os-bot) assistant.

---

## What it does

- **Floats above everything** — a frameless, transparent, always-on-top window that follows me across Spaces and full-screen apps.
- **Click to check spend** — Clippy expands a clean panel: `$ spent / $100`, a traffic-light progress bar, the **projected** end-of-cycle total, and the **token** breakdown (input / output / cache) for the cycle.
- **Drag to reposition** — grab Clippy and move the widget anywhere; a quick click (no drag) opens the panel.
- **Read-only and private** — it only *reads* a local data file. It can't change, corrupt, or leak anything (see [Data & privacy](#data--privacy)).

## How it works

The hard part of most apps — *getting the data* — was already solved by my server. The widget just reads local files:

```
life-os-bot (server)
      │  commits cost data (tripwire_state.json + claude_usage.jsonl)
      ▼
launchd  ──►  git pull every 5 min  ──►  ~/substrate-clippy/.../cost/   [read-only mirror on my Mac]
                                                   │  fs.readFileSync
                                                   ▼
                         Electron MAIN process ──IPC──► PRELOAD (safe bridge)
                          reads + sums the files                │
                                                                ▼
                                          RENDERER + clippy.js  (draws Clippy, handles clicks)
```

The interesting engineering is Electron's **two-world security model**, which I leaned into deliberately:

- The **main process** has Node.js powers and is the *only* place that touches the filesystem.
- The **renderer** (the window that loads jQuery + clippy.js) is sandboxed — it has **no filesystem access at all**.
- A tiny **preload** script bridges them, exposing exactly one safe function (`getSpend()`) over IPC.

So even though the UI loads third-party libraries, none of them can read my disk. The widget holds **no credentials and makes no network calls at runtime** — least privilege by design.

## Tech stack

- **[Electron](https://www.electronjs.org/)** — transparent, frameless, always-on-top window
- **Vanilla JS** + **[jQuery](https://jquery.com/)** + **[clippy.js](https://github.com/smore-inc/clippy.js)** — the authentic Microsoft Clippy with his original animations, vendored locally so it works offline
- **macOS `launchd`** — keeps the data mirror fresh

## Setup

Requires **macOS** and **[Node.js](https://nodejs.org/)** (`brew install node`).

```bash
git clone https://github.com/oscarpenny/clippy-money-widget.git
cd clippy-money-widget
npm install
npm start
```

> **Note:** the widget reads a spend file produced by my private `life-os-bot` project, synced to `~/substrate-clippy` by a `launchd` job that `git pull`s every 5 minutes. Without that feed it'll show a friendly "couldn't read the spend file" message — the app code itself is fully browsable here.

## Usage

| Action | Result |
|---|---|
| **Click** Clippy | Expand / collapse the spend panel |
| **Drag** Clippy | Move the widget around the screen |

The panel colours shift **green → amber → red** as my *projected* end-of-cycle spend climbs toward the $100 cap, and Clippy plays a matching animation.

## Data & privacy

- This repository contains **code only**. No financial data, tokens, or secrets are committed.
- The spend data lives in a **separate** folder (`~/substrate-clippy`) that is not part of this repo, so it never enters the widget's git history.
- The widget is **read-only** — it opens the data file, reads it, and never writes back.

## Roadmap

- [ ] **Budget tripwire notifications** — proactive alerts (macOS banner + Clippy) on projected-overspend, % milestones, daily spike days, and accidental Opus usage.
- [ ] **Package as a `.app`** and add to **Login Items** so Clippy launches automatically at login.
- [ ] **~15-minute freshness** by syncing the cost data more often server-side.

## Acknowledgements

- [clippy.js](https://github.com/smore-inc/clippy.js) by Smore Inc — resurrects the classic Microsoft Office Assistant. Clippy is a Microsoft character; this is a personal, non-commercial project.
- [jQuery](https://jquery.com/).

## License

**No license — all rights reserved.** This repo is public so the code can be read and the project shown; please ask before reusing it. Vendored dependencies (`jquery`, `clippy.js`) keep their own original licenses.
