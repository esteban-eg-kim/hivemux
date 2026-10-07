#!/bin/bash
# Build docs/preview-{en,ko}.png from a real hivemux tmux screen with made-up data.
# 가짜 데이터로 실제 hivemux tmux 화면을 띄워 docs/preview-{en,ko}.png 를 만든다.
# Needs: tmux, Google Chrome, Ghostty terminfo (for truecolor).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d /tmp/hmprev.XXXX)"; trap 'tmux -L hmdemo kill-server 2>/dev/null; tmux -L hmdemo-outer kill-server 2>/dev/null; rm -rf "$TMP"' EXIT
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
COLS=150; ROWS=40
export XDG_DATA_HOME="$TMP/data"     # fresh state: default sidebar width, no saves into your data
T() { tmux -L hmdemo "$@"; }; O() { tmux -L hmdemo-outer "$@"; }

for L in en ko; do
  if [ "$L" = ko ]; then
    N1="인증 모듈 리팩터링"; N2="API 문서 정리"; N3="결제 페이지 개선"; N4="로그인 리다이렉트 버그 수정"; N5="단계 관리 기능"
  else
    N1="Refactor auth module"; N2="Write API docs"; N3="Improve checkout page"; N4="Fix login redirect bug"; N5="Stage management"
  fi
  cat > "$TMP/demo.conf" <<C
set -g @hivemux-lang $L
source-file "$ROOT/share/hivemux.tmux"
source-file "$ROOT/share/keys.tmux"
set -g default-command "exec /bin/zsh -f"
C
  T kill-server 2>/dev/null || true; O kill-server 2>/dev/null || true
  T -f "$TMP/demo.conf" new-session -d -s api -n claude -c /tmp "sleep 900"
  T new-session -d -s docs -n claude -c /tmp "sleep 900"
  T new-session -d -s web -n claude -c /tmp "sleep 900"
  T new-window -t web -n shell -c /tmp "sleep 900"
  T new-window -t web -n login-bug -c /tmp "$ROOT/docs/preview/fake-claude.py $L"
  T new-session -d -s wayfinder -n claude -c /tmp "sleep 900"
  sleep 3
  now=$(date +%s)
  st() { # st <target> <state> <seconds ago> <name>
    local p; p="$(T list-panes -t "$1" -F '#{pane_id} #{pane_title}' | awk '$2!="hivemux-sidebar"{print $1; exit}')"
    T set -p -t "$p" @claude_session "demo-$p"; T set -p -t "$p" @claude_state "$2"; T set -w -t "$p" @claude_state "$2"
    T set -p -t "$p" @claude_state_at "$((now - $3))"; T set -p -t "$p" @claude_name "$4"
  }
  st api:claude run 240 "$N1"; st docs:claude done 60 "$N2"; st web:claude wait 120 "$N3"
  st web:login-bug wait 40 "$N4"; st wayfinder:claude idle 0 "$N5"
  O -f /dev/null new-session -d -x $COLS -y $ROWS \
    "env -u TMUX TERM=xterm-ghostty TERMINFO_DIRS=/Applications/Ghostty.app/Contents/Resources/terminfo XDG_DATA_HOME=$XDG_DATA_HOME tmux -L hmdemo attach -t web:login-bug"
  sleep 4
  O capture-pane -p -e -t 0 > "$TMP/screen.ansi"
  python3 "$ROOT/docs/preview/ansi2html.py" "$TMP/screen.ansi" "$TMP/$L.html" "web / login-bug"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=$((COLS * 9 + 16 + 64)),$((ROWS * 19 + 14 + 34 + 64 + 2)) --virtual-time-budget=4000 \
    --screenshot="$ROOT/docs/preview-$L.png" "file://$TMP/$L.html" 2>/dev/null
  echo "wrote docs/preview-$L.png"
done
