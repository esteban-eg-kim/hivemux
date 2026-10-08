# Changelog

## Unreleased

- Fixed the right-click menu staying on screen behind a popup it opened
  (Settings, Rename, New project): the menu is now cleared before the popup opens
- A popup open on one tmux server no longer pauses the sidebars of another

## 0.1.4 — 2026-10-08

- Settings popup from the sidebar right-click menu ("Settings…"): language
  (한국어 / English), animation on/off, sidebar width. Changes apply at once and
  are saved in `~/.local/share/hivemux` (`lang`, `anim`, `sidebar-width`)
- A sidebar that starts or restarts shows "Getting ready…" at once instead of an
  empty pane, and draws its first frame even in a hidden window, so it is ready
  when you switch to it

## 0.1.3 — 2026-10-08

- Reorder the sidebar: drag a card to move a task within its project, or drag a
  project header to move the project. `prefix Shift+↑/↓` moves the current task
  (and the project at its edge). `Option+N` and the top window list follow the
  sidebar order; project order is saved in `~/.local/share/hivemux/session-order`
- Right click in the sidebar opens a menu. On a task: go to, rename, move up/down,
  new Claude in this project, new project. On a project name: new Claude, new
  project. On empty space: new project. Double click still renames
- "New project" opens a folder browser in the middle of the screen: move with
  the arrow keys or the mouse, type to filter, `Enter` starts the project in the
  selected folder (like `hm`), `Ctrl+N` makes a new folder
- Fixed menus and popups getting garbled lines and borders while Claude prints
  Korean (or other double-width) text under them, a tmux 3.7 drawing bug. The
  right-click menu is now drawn inside the sidebar (hover, click, `↑↓` `Enter`,
  item letters, `Esc`), and popups (rename, new project, `Option+O`) open over a
  still copy of the screen

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
