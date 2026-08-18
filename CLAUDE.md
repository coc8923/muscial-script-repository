# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Two unrelated things live side by side in this repo:

1. **The musical *Résistance* (레지스탕스) script material** — the root files `Script`, `character`,
   `Reference`, and `Resrarch` (note the misspelling; keep the existing name unless asked to rename).
   All four are currently **empty placeholders** (1 byte each), so there is no script content in git yet.
   The repo README describes the project simply as "musical Resistance".
2. **MelodyNote** (`app/`) — a self-contained PWA for capturing music ideas (text memos, voice
   recordings, 16-step melody sequences). This is the only code in the repo.

Product copy, UI strings, code comments, and `app/README.md` are written in **Korean**; commit messages
so far are in English.

## MelodyNote (`app/`)

### Commands

There is **no build step, no package manager, no dependencies, and no test suite** — plain
HTML/CSS/JS served statically.

```bash
# Run locally (PWA + mic require http(s), not file://)
cd app && python3 -m http.server 8000     # → http://localhost:8000

# Regenerate app icons (pure stdlib zlib PNG encoder, no Pillow needed)
cd app/icons && python3 generate_icons.py
```

Mic recording only works on `localhost` or HTTPS.

### Architecture

`app.js` (~770 lines) is a single classic script — no modules, no bundler. All state lives in
top-level `let` bindings at the top of the file, and event listeners are attached at load time by
`document.getElementById(...)` against ids hard-coded in `index.html`. Consequence: **`index.html`
ids and `app.js` are tightly coupled** — renaming or removing an element id silently breaks the
handler that binds to it, and there is nothing that catches this.

The file is organized into commented sections (`─── State ───`, `Render`, `Capture Modal`, `Save`,
`Voice Recorder`, `Piano`, `Sequencer`, `Tap Tempo`, `Detail Modal`, `PWA`, `Init`). Follow the
existing section a change belongs to rather than appending to the end.

Persistence is `localStorage` under the single key `melodyNoteIdeas`, holding an array of idea
objects built in the save handler:

- always: `id` (`Date.now()` string), `type` (`text` | `voice` | `melody`), `title`, `moods[]`,
  `genres[]`, `bpm`, `createdAt` (ISO)
- `voice`: `audioData` — the recording **base64-encoded inline**, plus `duration`
- `melody`: `seqData` — an 8×16 boolean matrix (`SEQ_ROWS` = C4–C5, `SEQ_STEPS` = 16)

Because voice memos are stored as base64 in `localStorage`, a handful of recordings can approach the
~5 MB quota. Any change to the idea shape must stay readable against ideas already persisted on a
user's device — there is no migration layer.

Audio (waveform display, synth playback, sequencer clock) runs on a lazily created `AudioContext`
via `getAudioCtx()`; recording uses `MediaRecorder`. On first launch with an empty store, `Init`
seeds two sample ideas.

### Service worker

`sw.js` is cache-first with a hard-coded asset list. Two things must be kept in sync by hand:

- **Bump `CACHE_NAME`** (currently `melodynote-v1`) whenever `app.js`, `style.css`, or `index.html`
  change — otherwise returning users keep getting the cached old build.
- **Add any new file** under `app/` to the `ASSETS` array, or it won't be available offline.

### Deployment

`.github/workflows/deploy-pages.yml` uploads `./app` to GitHub Pages. It triggers **only on pushes to
`main` and the legacy `claude/idea-music-app-concept-ApECx` branch** (plus `workflow_dispatch`), so a
push to any other branch will not deploy — add the branch to the `on.push.branches` list or dispatch
manually if a preview is needed.
