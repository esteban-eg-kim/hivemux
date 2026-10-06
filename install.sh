#!/bin/bash
# Idempotent installer. Backs up anything it replaces to ./backups/<timestamp>/
set -euo pipefail
R="$(cd "$(dirname "$0")" && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"; BK="$R/backups/$TS"
backup() { [ -e "$1" ] || [ -L "$1" ] || return 0; mkdir -p "$BK"; cp -P "$1" "$BK/$(echo "$1" | sed "s|$HOME/||; s|/|__|g")"; echo "  backup $1"; }
link() { # link <src> <dst>
  if [ "$(readlink "$2" 2>/dev/null)" = "$1" ]; then echo "  ok     $2"; return; fi
  backup "$2"; mkdir -p "$(dirname "$2")"; ln -sfn "$1" "$2"; echo "  link   $2 -> $1"
}

echo "[1] tmux plugins"
mkdir -p ~/.tmux/plugins
for p in tpm tmux-resurrect tmux-continuum; do
  [ -d ~/.tmux/plugins/$p ] || git clone -q --depth 1 https://github.com/tmux-plugins/$p ~/.tmux/plugins/$p
  echo "  ok     $p"
done

echo "[2] config links"
link "$R/tmux/tmux.conf" "$HOME/.tmux.conf"
link "$R/ghostty/config" "$HOME/.config/ghostty/config"

echo "[3] Claude Code settings (hooks + Remote Control for all sessions)"
S="$HOME/.claude/settings.json"; [ -f "$S" ] || echo '{}' > "$S"
backup "$S"
H="$R/bin/claude-tmux-hook"
tmp="$(mktemp)"
jq --arg h "$H" '
  def entry($ev): {hooks: [{type: "command", command: ($h + " " + $ev), timeout: 5}]};
  .remoteControlAtStartup = true
  | .hooks = (.hooks // {})
  | reduce ("SessionStart","UserPromptSubmit","PostToolUse","Notification","Stop","SessionEnd") as $ev (.;
      .hooks[$ev] = (((.hooks[$ev] // []) | map(select((.hooks // []) | all(.command | contains("claude-tmux-hook") | not)))) + [entry($ev)]))
' "$S" > "$tmp" && jq empty "$tmp" && mv "$tmp" "$S"
echo "  ok     $S"

echo "[4] ~/.zshrc PATH block"
Z="$HOME/.zshrc"; MARK="# >>> ghostty-tumx >>>"
if grep -qF "$MARK" "$Z" 2>/dev/null; then echo "  ok     already present"; else
  backup "$Z"
  printf '\n%s\nexport PATH="%s/bin:$PATH"\n# <<< ghostty-tumx <<<\n' "$MARK" "$R" >> "$Z"
  echo "  added  PATH block"
fi

echo "[5] reload running tmux server (if any)"
if tmux has-session 2>/dev/null; then tmux source-file ~/.tmux.conf && echo "  reloaded"; else echo "  none running"; fi
echo "done."
