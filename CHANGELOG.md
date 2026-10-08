# Changelog

## Unreleased

- Reorder the sidebar: drag a card to move a task within its project, or drag a
  project header to move the project. `prefix Shift+↑/↓` moves the current task
  (and the project at its edge). `Option+N` and the top window list follow the
  sidebar order; project order is saved in `~/.local/share/hivemux/session-order`
- Right click in the sidebar opens a menu: go to, rename, move up/down, new Claude
  in this project, new project (asks for a folder, then opens it like `hm`).
  Double click still renames

## 0.1.2 — 2026-10-08

- Fixed "needs input" turning into "working" on its own while the approval dialog was
  still open. It now clears only when the dialog closes, and becomes "done" (not
  "working") when you choose No
- Fixed the sidebar shrinking and growing back the first time you open each session
  after starting the terminal or a reboot: hidden windows now get the terminal's size
  ahead of time
- Fixed sidebar housekeeping (width restore and others) skipping every other window

## 0.1.1 — 2026-10-08

Run `hivemux setup` again after upgrading: it registers four new Claude Code hooks.

- "Needs input" shows the moment the approval dialog opens (new `PermissionRequest`
  and `PreToolUse` hooks), and the sidebar redraws as soon as any hook fires instead
  of on its next 1-second poll
- "Needs input" clears as soon as you answer, even when the approved tool then runs
  for a long time (the sidebar watches the waiting pane's screen); a denied or
  failed tool also returns to "working"
- Smoother animation at 30 fps that redraws only the rows that changed; CPU use is
  about the same as before. Set `@hivemux-fps` (5–60) to trade smoothness for CPU
- Fixed duplicate sidebars in one window when several hooks created them at once
- Status line shows the session name on a blue badge
- `setup` no longer adds a PATH line to `~/.zshrc` for Homebrew installs in a custom prefix
- Docs: English guide (`docs/guide.en.html`), English and Korean READMEs, preview image

## 0.1.0 — 2026-10-07

First public release.

- Sidebar in every tmux window listing every Claude Code session across all
  tmux sessions: state (working, needs input, done, idle), elapsed time, task name
- Jump with Option+1..9, Option+0 to the oldest waiting session, or click a card
- Rename a task by double/right clicking its card (sends `/rename` to Claude)
- Running cards glow, waiting cards pulse; status bar spinner for running windows
- Survive closing the terminal (tmux) and reboots (tmux-resurrect + per-pane
  `claude --resume`)
- `hm <dir>`: one tmux session per project with a named Claude window
- Option+O: pick a file path from recent output and open it in VS Code at the line
- Draggable sidebar grip; width saved
- Remote Control for every session (optional) to continue from the Claude app
- `hivemux setup | uninstall | doctor`; adds marked blocks, never replaces your config
