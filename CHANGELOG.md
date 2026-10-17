# Changelog

## Unreleased

- The card of the window you are in stands out more: a lighter background and a
  bright line on both sides
- The sidebar shows each project as a box with a header band in the project's
  color, its Claude cards inside. Widen the sidebar (drag the grip) and the
  boxes go into 2 or 3 columns, each box in the shortest column. Click, drag
  and right-click work on any column
- When the boxes do not fit, the sidebar drops the blank rows between cards
  in a box and then scrolls (mouse wheel). Cards stay two lines and projects
  stay apart; arrows on the rules show more above or below, and each window's
  sidebar starts scrolled to its own card. The scroll position is shared, so
  going to another window keeps the list where it was. With 11 projects it used to go
  straight to one-line cards without numbers
- A finished task stays "done" until you look at it on the screen that has the
  keyboard focus. A screen that was only attached (another Ghostty window,
  another Mac) used to turn it idle at once, so the "done" mark vanished
- Only the screen that got the keyboard focus last decides window sizes, also
  while you are in another app. A window shown on two screens of different
  sizes (this Mac's Ghostty and another Mac over ssh) used to shrink and grow
  each time you went to it, redrawing Claude and the sidebar
- tmux client hooks (attach, resize, detach) act on the right screen. With two
  screens attached they could get the other one, so a detach removed the wrong
  screen from the remote list and a resize used the other screen's size

## 0.1.20 — 2026-10-17

- Popups from the sidebar menu (rename, new project, close project, new
  Claude, connect, settings) open on the screen that clicked. With another Mac
  attached to the same project they used to open on the first screen in the
  list, often the Mac you were not looking at

## 0.1.19 — 2026-10-16

- The pickup board shows round number badges instead of names: the task's
  `Option` number in an amber (needs input) or green (finished, not seen yet)
  badge, so it takes little room. A waiting one blinks until answered, a
  finished one for its first 10 seconds; still with animation off or while
  another Mac is attached
- The project name in the status line is as wide as the sidebar, so the window
  list starts above the work area, not above the sidebar. A terminal attached
  from another Mac shows "⇄ <Mac name>" at the right, before the clock
- Loading the config resets tmux's status line layout, so a server that ran
  another layout shows the window list again

## 0.1.18 — 2026-10-16

- Pickup board: like the order board at a food court, the right of the top
  status line lists every task, in any project, that needs input (amber
  "● ⌥3 name") or finished and is not seen yet (green "✓ ⌥2 name"), waiting
  ones first. Click a chip to go there; a finished one leaves once you look at
  it. Up to 5 chips, then "+N"

## 0.1.17 — 2026-10-16

- Docs: the README and the guide describe the "mosh · no notifications" label,
  what to do when mosh stops at "Nothing received from server on UDP port"
  (allow `mosh-server` in the other Mac's firewall), and that adding a host asks
  to trust it and for the password the first time

## 0.1.16 — 2026-10-16

- Fix: a mosh host opened from the Connect to… list failed with "mosh: not
  found". The new Ghostty window starts with login's plain PATH; hivemux
  connect now adds where brew puts mosh and sets a UTF-8 locale when there is
  none (mosh requires one)
- When mosh fails, the window stays open until Enter so the error can be read
- mosh says what it costs: the Connect to… list marks a mosh host "mosh · no
  notifications", switching to mosh says the remote work's notifications do not
  reach this Mac, and so does the line shown when a mosh connection starts

## 0.1.15 — 2026-10-16

- First connection to another Mac: adding a host no longer stops at "Host key
  verification failed". `hivemux connect --add` and "+ Add a host…" now ask to
  trust the host and for the login password there once, then add this Mac's ssh
  key there (making one if there is none); later connections need no password.
  A host key that changed is not accepted silently: it says to run
  `ssh-keygen -R <host>` if it is the same Mac
- The Connect to… popup is a little larger, so ssh's questions fit

## 0.1.14 — 2026-10-15

- A session named "0" gets its sidebar again: only hivemux's bootstrap session
  is left without one, and only while it restores (a server left on "0" by the
  0.1.12 restore bug never showed a sidebar)
- `hivemux setup` also adds a sidebar to windows that have none

## 0.1.13 — 2026-10-15

- Fix: starting Ghostty with no tmux server (after a reboot, or when the server
  had ended) could end the server in the middle of the restore and leave an
  empty session "0" instead of your projects. Redrawing the sidebars sent USR1
  to every pane titled as a sidebar, and right after a restore those are still
  plain shells, which USR1 ends; the windows closed and with them the server
- Several Ghostty windows starting at once take turns: one starts tmux and
  restores, the others wait for it and say so ("Restoring your last work…")
  instead of a blank screen
- A tmux server that started without restoring no longer autosaves: it would
  replace the snapshot and the pane → Claude map with an empty one (hivemux
  doctor says so)
- After a restore, a saved sidebar is never removed when it is the last pane of
  its window

## 0.1.12 — 2026-10-15

- Still cards (a remote screen, or `@hivemux-anim off`) are told apart by color:
  a running card gets a blue background and a waiting one a stronger amber one,
  instead of looking like an idle card with a colored bar

## 0.1.11 — 2026-10-15

- Menu → Connect to…: `m` switches the chosen host between ssh and mosh; it
  checks first that mosh is on both Macs (`--add --mosh` checks the other Mac
  too now)
- A screen attached from another Mac no longer gets the sidebar animation: while
  it looks at a window, the cards keep still, and the status line spinner stops
  while it is attached (a running task sent about 40 KB/s to every screen, which
  made typing over a slow link lag)

## 0.1.10 — 2026-10-13

- Opening Ghostty when every session is already on a screen (Ghostty restoring
  several windows, a second window) joins the last used session instead of
  creating an empty numbered one ("8") that now shows in the sidebar
- The still copy behind popups (settings, new project, rename, close) now
  matches the screen: the sidebar background, its bottom rule and the grip
  were lost on most rows
- A project whose Claude windows are all closed (only shells left) stays in the
  sidebar as "no Claude · N windows" instead of disappearing; click a project
  name to go to it
- A Claude that quits leaves the sidebar at once (a shell in front of its pane
  means it ended; its SessionEnd hook comes a second or two later, or never
  after a kill), and closing a window updates the counts at once
- Right-click a project name → Close project: a popup in the middle says what
  closes (windows, Claude tasks) and asks; "Cancel" is chosen first
- Sidebars in other windows redraw when a project or window closes, so
  switching there never shows a closed project for a moment; Close project
  takes it off every sidebar first, then closes it
- Closing the last window of the project you are on no longer closes Ghostty:
  you move to another project (`detach-on-destroy off`)

## 0.1.9 — 2026-10-12

- Work from another Mac: `hivemux connect <host>` attaches to that Mac's
  hivemux over ssh and reconnects when the connection drops (`--mosh` to use
  mosh). `hivemux connect --add <host>` checks and remembers a host; the sidebar
  menu "Connect to…" lists them and opens a new Ghostty window, and
  `prefix Shift+H` connects to the last one. A terminal attached from another
  Mac shows `⇄ <Mac name>` in the status line, and notifications reach it.
  `hivemux doctor` checks Remote Login, sleep and the remembered hosts
- Desktop notifications: a macOS notification when a task needs input or
  finishes, except the one you are looking at (window on screen, terminal
  focused). Sent by the sidebar through tmux as OSC 777, so it also reaches a
  terminal attached over ssh. Turn it off in Settings (saved in `notify`)
- Screenshots updated for the new Settings row

## 0.1.8 — 2026-10-12

- Rename a project from the sidebar: right-click a project name → Rename. It
  keeps its place in the sidebar order and is saved for restore under the new
  name; `hm <folder>` still finds a renamed project by its folder, and the
  new-project browser marks it as open
- `hivemux setup` also restarts the running sidebars, so an update takes
  effect at once
- README and guide: how to update (`brew upgrade hivemux && hivemux setup`, or
  the install command again); hook count corrected to eleven

## 0.1.7 — 2026-10-09

- Fixed a task staying "running" after you stop Claude with Esc (Claude sends
  no hook then): the sidebar sees that Claude's "esc to interrupt" footer and
  progress line are gone and marks the task idle
- A turn that ends on an API error (rate limit, overload, auth) now shows
  "needs input" instead of staying "running" (new `StopFailure` hook; run
  `hivemux setup` again to add it, `hivemux doctor` shows 11 hooks)

## 0.1.6 — 2026-10-09

- Screenshots of the right-click menu, reordering, the new-project folder
  browser and settings in the README and the guide (`docs/img`, made by
  `docs/preview/features.sh` from made-up projects)
- The folder browser shows your home as `~` also when the path goes through a
  symlink

## 0.1.5 — 2026-10-08

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
