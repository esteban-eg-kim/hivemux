# Changelog

## Unreleased

- A Claude waiting on a question or an approval while its background agents
  work no longer looks busy: their tool calls flipped the sidebar card and
  the bee back to work although the question was still open

## 0.1.37 — 2026-10-22

- Why a Claude waits: the sidebar card and the bee office say what it waits
  for: an approval (with Claude's own description of the command, or the
  file), a plan, a question, an MCP server asking or an error; a finished
  card says how many files the turn changed
- Bee office: a waiting bee holds up a big bubble with why; click it and
  answer right there with the same choices as the terminal (approve, plan
  approval, single or multiple choice, several questions, typed answers),
  also for a connected Mac's bees
- Bee office: on a Mac without the Swift compiler (no window app), it opens
  as a web app in Chrome, Edge, Brave, Whale, Vivaldi or Chromium (its own
  window, no tabs or address bar) before falling back to the browser
- Bee office: losing the server no longer leaves the page stuck on "Lost
  hivemux": it says it is reconnecting and keeps trying, the office window
  starts the server again by itself, and a note says when it is back. The
  server also stays up while the office window is open, even minimized or
  hidden (macOS pauses such a page, so it stopped asking and the server
  quit after 90 seconds)

## 0.1.36 — 2026-10-21

- Clock out: it said "already clocked out" after any clock in
- Clock in after a reboot: each Claude resumes in its own pane (tmux numbers
  panes afresh after a reboot, so they could land in another project's);
  clocking in while a Claude was being stopped no longer loses it; Update
  Claude leaves clocked-out panes for clocking in to start
- Bee office: a bee that left and came back is rehired at once (it took a
  server restart); bees sent home stay on the payroll through a reboot;
  bees of a project closed outside the sidebar are let go; honey ranks
  count bee names with spaces
- Bee office: bees at home no longer drop out of the list after a moment;
  a connected Mac missing from one update no longer sends its bees to work;
  one drawing error no longer freezes the page
- The office server shrugs off a broken ledger, roster or remote answer,
  and the installer runs only once fully downloaded
- Bee office: zoomed out at a low angle the fields no longer end in black
  space: they run far past the view, under a sky that follows the clock
  (blue with drifting clouds by day, dusk, deep blue at night), which only
  turns to space as the view pulls out to the planet
- Bee office: Claudes sharing a project read "api #1", "api #2" (in ⌥ order)
  on their tags and in the list, and hovering a bee shows its session name
  right under it

## 0.1.35 — 2026-10-21

- Bee office: turning the view (right-drag, shift-drag or a two-finger turn)
  pivots on the floor point under the pointer instead of the floor's middle
- Bee office: a bee that popped out could stay hidden for good (only its
  laptop on) when the pop-out's fly-back animation never finished, as in a
  hidden window; it now comes back at once
- Clock out and in: the office's 🌙 button or right-click → Clock out stops
  every Claude for the night (busy ones work overtime and go once done); the
  bees clap and walk home to their own houses in a new village past the yard.
  Clock in brings every one back in the same conversation as the bees walk to
  work. A reboot while clocked out leaves them home. The office's button asks
  Mac by Mac (this Mac, each connected Mac, or all; a connected Mac is clocked
  out over its ssh connection), and every Mac's bees live mixed in one village
  of lanes; hover a house to see who lives there. Off work the bees go out
  before bed: a pub at the village gate, the Honey Pot (beer on the terrace, or inside), a
  park (a ball game for two, benches, chatting by the fountain), or home; from
  11 pm they all sleep at home. The pub has a hanging sign (an iron arm, a
  board with a mug of beer and PUB); hover a house or the pub to look in (its
  roof comes off: a bed and its bee, or the bar, the taps, a shelf of bottles
  and the guests, one of them playing darts), click to keep it open; houses and the pub are bigger. Every house differs: six
  styles (a cottage with a porch roof, two storeys, a flat roof with a planter,
  a hipped roof, a barn-style gambrel roof, a smoking chimney) and six kinds of room (cosy
  bedroom, gaming den, books, plants and a hammock, a piano, a big kitchen);
  two-storey houses have stairs to a loft bed
- Bees are hired, leave (closing the project, or closing that Claude: `/exit`
  at once, a closed window after ten minutes; a reboot, clocking out or an
  update is not leaving) and come back (rehired) by project and name, with a house each; a honey ledger ranks them today, this
  week and this month (list drawer → Honey, and a bee of the month on the
  wall); a full comb goes into a jar on a shelf
- Bee office: the office fills the window (no more 1000px column), with the
  buttons floating on top. The session list is a drawer (☰ button or `L`,
  `Esc` closes) grouped by Mac with waiting sessions first; hovering a row rings
  that bee, and the office moves aside while it is open. Right or left side in
  the settings
- Update Claude checks the latest version first: up to date, it says so; with a
  newer one it asks before updating (how many Claudes will restart). `--yes`
  skips the question. Ctrl+C or closing the popup no longer leaves a Claude
  stopped halfway: restarts run in the background
- Bee office 2D is now the same office seen from straight above (the camera
  rises; walls become lines, the Mac plaques lie over the left wall) instead of
  a separate older plan, so it has the same rooms, carpets, list drawer and
  buttons. It turns a quarter at a time; 3D returns to the angle you had
- Bee office: the meeting and boss rooms have real doorways (a frame and a
  door standing open), and bees walk round the rooms' corner instead of
  through the glass. Things keep their order from every angle (bees on the
  sofa, chairs and laptops at desks), the honeycomb is regular from any side,
  and the page draws 60 frames a second only while you handle it (30 while
  bees walk, 20 when still), about 40% less CPU

## 0.1.34 — 2026-10-21

- After a reboot each Claude resumes in the folder it was started in again: a
  compact or `/clear` no longer moves it to wherever a Bash `cd` had gone (a
  worktree deep inside the project)
- Update Claude: right-click → Update Claude (or `hivemux update-claude`)
  updates Claude Code (brew for a Homebrew install, else `claude update`) and
  restarts each pane's Claude still on an old version, resuming the same
  conversation; a finished, unseen task stays so. One working, waiting for you
  or on a screen restarts later, once done and off screen

## 0.1.33 — 2026-10-21

- Remote: a forwarded dev server port no longer shows a notification (they
  came often, e.g. on every dev server restart); `Option+W` lists the ports

## 0.1.32 — 2026-10-21

- Bee office: the name plaques keep their day colors at night (so they match
  the carpets), stay inside the wall when two Macs start in the same row, and
  are all one size, wide enough for the longest name (a name too long still
  shrinks to fit)

## 0.1.31 — 2026-10-21

- Bee office: each Mac's desks sit on a carpet of its color (honey for this
  Mac, lilac for a remote one), and its name is on a plaque on the left wall
  beside the row where its desks start, instead of a sign on legs

## 0.1.30 — 2026-10-21

- Bee office: a server still running from before an upgrade (whose files
  Homebrew removed, so the page said "This page isn't working") is replaced
  by the new one. When the window cannot be built, the reason is shown, with
  how to reinstall the Command Line Tools when they look broken

## 0.1.29 — 2026-10-21

- Bee office: bigger desks (pods of four, two to a row) so a desk no longer
  looks smaller than its bee, and a wooden sign on legs with each Mac's name
  where its desks start; past three rows the office keeps a readable size
  instead of shrinking (drag or zoom out to see the rest); when name tags
  crowd, working bees' tags step aside for waiting and finished ones (hover or
  zoom in to see them)
- `hivemux open <file>` opens files with the default app of the Mac you look
  from: on a `hivemux connect` screen they are copied to that Mac and opened
  there (a screenshot Claude made shows up on the laptop), else on this Mac.
  Tab in the open-path popup (Option+O) does the same on such a screen. Both
  Macs need this version
- Settings has "This Mac's name": the bee office, the ⇄ badge on remote
  screens and the other Mac's sidebar note show it instead of the computer
  name. Each Mac names itself, so nothing is set per connection

## 0.1.28 — 2026-10-20

- The bee office button (🐝, `prefix B`, the menu) on a screen attached from
  another Mac opens the window on that Mac, the one you are looking at, with
  this Mac's sessions in the office next door. It used to only say to open it
  there. Both Macs need this version

## 0.1.27 — 2026-10-20

- A screen from another Mac whose detach went unnoticed no longer keeps the
  status line spinner still, nor freezes the sidebar of a terminal on this Mac
  that later gets the same tty name: only attached screens count, the list is
  pruned on every detach, and a local terminal drops its own name from it.
- When a screen from another Mac is looking at a window, its sidebar says so
  at the right end of the summary line ("⇄ <Mac> viewing · paused"), so cards
  that stand still there no longer look stuck.
- Option+O (open path) finds files Claude mentions by a path relative to a
  folder it `cd`'ed into (a worktree, a sub project). The hook now records the
  folder Claude works in now (`@claude_pwd`), and paths still not found are
  looked up a few folders below.
- The bee office: the 🐝 button at the top of the sidebar (also `prefix B`,
  the right-click menu and `hivemux office`) opens a window where every Claude session
  is a bee in an office seen at an angle (the mouse turns, tilts and zooms it;
  2D switches to a flat plan), among trees by a river; zooming out puts the roof
  on, and further out it becomes a tiny cartoon planet (low-poly grass, shores
  and lakes, trees sticking out all round, clouds and a little plane; a starry
  sky at night): it types at a shared desk while working, runs to the question window in
  the boss room and pops out in front when it needs you, holds up a jar of
  honey when done and stores it in the honeycomb once seen, and rests in the
  cafe, on the sofa, at ping-pong or in the garden. In plan mode it plans at the whiteboard in the meeting room,
  where two office colleagues join it;
  subagents stand by its desk as small helper bees. Click a bee to go to its
  session. Sessions of a Mac you are connected to show in the office next door
  (that Mac needs this version too). The window is a small native app built
  with swiftc (`hivemux setup` builds it ahead; otherwise a popup shows the
  build's progress); without swiftc the page opens in the browser
- The Claude Code hook now counts subagents per pane (`@claude_agents`), marks
  panes in plan mode (`@claude_plan`) and counts tasks finished today
  (`@hivemux-honey`) for the office

## 0.1.26 — 2026-10-20

- `Ctrl+V` in a Claude pane on a `hivemux connect` screen pastes the image on
  the clipboard of the Mac you connect from: it is copied to the other Mac and
  its path pasted, which Claude Code shows as `[Image #1]`. Claude Code reads
  images from the clipboard of the Mac it runs on, so a screenshot taken on the
  laptop did not paste before. Both Macs need this version

## 0.1.25 — 2026-10-19

- `hivemux connect` notices a silent connection (Wi-Fi off on either Mac) in
  about 7 seconds instead of 37 and shows the reconnect box; until then the
  screen just froze with no word of it

## 0.1.24 — 2026-10-19

- When a `hivemux connect` connection drops, the terminal is put back from the
  other Mac's tmux state first (mouse reporting printed escape codes over a
  broken screen), then a box in the middle shows why it dropped and counts
  down to the next try: `Enter` tries now, `Ctrl+C` stops
- Even gaps around the project boxes: one column on the left like the grip
  column on the right, one column between columns of boxes, and half a row
  between boxes and under the rule

## 0.1.23 — 2026-10-17

- While connected to another Mac, dev servers started in its tmux (`npm run
  dev` by Claude or a shell) are forwarded to the same port on this Mac's
  `localhost` over a separate ssh connection, with a notification for each.
  A port taken here goes to the next free one; a stopped server and closing
  the window let them go. `HIVEMUX_PORTS=0` turns it off
- Port list popup: `Option+W` or right-click menu → Ports, on the remote
  screen or on the Mac itself. Enter opens the server in the browser of the
  Mac you connect from, `Ctrl+Y` copies the address. `hivemux connect
  --ports` lists them in a terminal
- The right-click menu has Open path… (`Option+O`) too
- Settings → Editor picks what Enter in Open path uses: VS Code, Cursor, Zed,
  Sublime Text or the text editor. On a screen attached from another Mac,
  VS Code and Cursor open the file on that Mac over Remote-SSH

## 0.1.22 — 2026-10-17

- Reloading the tmux config (`hivemux setup`, `tmux source-file`) no longer
  adds another copy of hivemux's `terminal-features` entries each time; the
  copies piled up by older versions are removed
- Cards of one project sit together with no blank row between them; a thin
  line in the project's color under each card tells them apart

## 0.1.21 — 2026-10-17

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
  going to another window keeps the list where it was. With 11 projects it
  used to go straight to one-line cards without numbers
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
