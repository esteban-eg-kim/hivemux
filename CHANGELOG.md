# Changelog

## Unreleased

- "Needs input" shows the moment the approval dialog opens (`PermissionRequest`,
  `PreToolUse` hooks) and the sidebar redraws as soon as a hook fires
- "Needs input" clears as soon as you answer, even if the tool then runs for a long
  time (the sidebar watches the waiting pane's screen)
- Smoother 30 fps animation that redraws only changed rows; fixed duplicate
  sidebars and the sidebar jumping between sessions on its own
- Run `hivemux setup` again to register the new hooks

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
