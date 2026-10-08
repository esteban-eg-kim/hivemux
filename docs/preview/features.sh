#!/bin/bash
# Build docs/img/*-{en,ko}.png: the sidebar menu, reordering, the new-project folder browser and
# settings, from a real hivemux tmux screen with made-up projects (fake HOME, no real data).
# 가짜 프로젝트(가짜 HOME, 실제 데이터 없음)로 실제 hivemux tmux 화면을 띄워 사이드바 메뉴, 순서 바꾸기,
# 새 프로젝트 폴더 탐색, 설정 화면을 docs/img/*-{en,ko}.png 로 만든다.
# Needs: tmux, Google Chrome, Ghostty terminfo (for truecolor).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(cd "$(mktemp -d /tmp/hmfeat.XXXX)" && pwd -P)"; trap 'tmux -L hmfeat kill-server 2>/dev/null; tmux -L hmfeat-outer kill-server 2>/dev/null; rm -rf "$TMP"' EXIT
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
COLS=112; ROWS=30
OUT="$ROOT/docs/img"; mkdir -p "$OUT"
export XDG_DATA_HOME="$TMP/data"     # fresh state, no saves into your data / 새 상태, 내 데이터에 저장하지 않음
REAL_HOME="$HOME"
export HOME="$TMP/home"              # the folder browser shows ~/code with made-up projects / 폴더 탐색 창에 가짜 ~/code 가 보인다
mkdir -p "$HOME/code"/{api,docs,web,wayfinder,mobile-app,infra,design-system}
T() { tmux -L hmfeat "$@"; }; O() { tmux -L hmfeat-outer "$@"; }

# mouse event into the attached client, at a sidebar row (1-based line of the sidebar pane)
# 붙어 있는 화면에 마우스 이벤트를 넣는다 (사이드바 칸의 1부터 세는 줄 번호)
mouse() { O send-keys -t 0 -l "$(printf '\033[<%s;%s;%s%s' "$1" "$2" $(( $3 + 1 )) "$4")"; }
sidebar() { T list-panes -t web:login-bug -F '#{pane_id} #{pane_title}' | awk '$2=="hivemux-sidebar"{print $1}'; }
row() { T capture-pane -p -t "$(sidebar)" | grep -n -- "$1" | head -1 | cut -d: -f1; }
shot() { # shot <name> <title>
  O capture-pane -p -e -t 0 > "$TMP/screen.ansi"
  python3 "$ROOT/docs/preview/ansi2html.py" "$TMP/screen.ansi" "$TMP/$1.html" "$2"
  # Chrome sometimes keeps running after it wrote the file: wait for the file, then stop it
  # Chrome 이 파일을 쓴 뒤에도 끝나지 않을 때가 있어, 파일이 생기면 끈다
  rm -f "$TMP/shot.png"
  HOME="$REAL_HOME" "$CHROME" --headless=new --user-data-dir="$TMP/chrome" --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=$((COLS * 9 + 16 + 64)),$((ROWS * 19 + 14 + 34 + 64 + 2)) --virtual-time-budget=4000 \
    --screenshot="$TMP/shot.png" "file://$TMP/$1.html" >/dev/null 2>&1 &
  local pid=$! i
  for i in $(seq 1 120); do [ -s "$TMP/shot.png" ] && sleep 0.5 && break; sleep 0.25; done
  kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true
  [ -s "$TMP/shot.png" ] && mv "$TMP/shot.png" "$OUT/$1.png" && echo "wrote docs/img/$1.png" || echo "FAILED docs/img/$1.png"
}

for L in ${LANGS:-en ko}; do
  if [ "$L" = ko ]; then
    N1="인증 모듈 리팩터링"; N2="API 문서 정리"; N3="결제 페이지 개선"; N4="로그인 리다이렉트 버그 수정"; N5="단계 관리 기능"
    RENAME="이름 바꾸기"
  else
    N1="Refactor auth module"; N2="Write API docs"; N3="Improve checkout page"; N4="Fix login redirect bug"; N5="Stage management"
    RENAME="Rename"
  fi
  cat > "$TMP/demo.conf" <<C
set -g @hivemux-lang $L
source-file "$ROOT/share/hivemux.tmux"
source-file "$ROOT/share/keys.tmux"
set -g default-command "exec /bin/zsh -f"
set -as terminal-features ",xterm-256color:RGB"
C
  T kill-server 2>/dev/null || true; O kill-server 2>/dev/null || true
  T -f "$TMP/demo.conf" new-session -d -s api -n claude -c "$HOME/code/api" "sleep 900"
  T new-session -d -s docs -n claude -c "$HOME/code/docs" "sleep 900"
  T new-session -d -s web -n claude -c "$HOME/code/web" "sleep 900"
  T new-window -t web -n shell -c "$HOME/code/web" "sleep 900"
  T new-window -t web -n login-bug -c "$HOME/code/web" "$ROOT/docs/preview/fake-claude.py $L"
  T new-session -d -s wayfinder -n claude -c "$HOME/code/wayfinder" "sleep 900"
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
    "env -u TMUX TERM=xterm-256color HOME=$HOME XDG_DATA_HOME=$XDG_DATA_HOME tmux -L hmfeat attach -t web:login-bug"
  O set -g status off
  sleep 4

  # 1. task menu, with the mouse over "Rename" / 작업 메뉴, "이름 바꾸기" 위에 마우스
  y=$(row "${N3:0:8}"); mouse 2 6 "$y" M; sleep 0.2; mouse 2 6 "$y" m; sleep 0.6
  y=$(row "$RENAME"); mouse 35 10 "$y" M; sleep 0.6
  shot "menu-$L" "web / login-bug"
  O send-keys -t 0 Escape; sleep 1.2

  # 2. empty-space menu / 빈 곳 메뉴
  y=$(( $(row "⌥0") - 3 )); mouse 2 6 "$y" M; sleep 0.2; mouse 2 6 "$y" m; sleep 0.8
  shot "menu-empty-$L" "web / login-bug"
  O send-keys -t 0 Escape; sleep 1.2

  # 3. dragging a card onto another (released where it started: nothing moves)
  # 3. 카드를 다른 카드 위로 끄는 중 (처음 자리에서 놓아 실제로는 옮기지 않는다)
  y1=$(row "${N4:0:8}"); y2=$(row "${N3:0:8}")   # names can be cut in the sidebar / 사이드바에서 이름이 잘릴 수 있다
  mouse 0 8 "$y1" M; sleep 0.2; mouse 32 8 $(( y1 - 1 )) M; sleep 0.1; mouse 32 8 "$y2" M; sleep 0.8
  shot "reorder-$L" "web / login-bug"
  mouse 32 8 "$y1" M; sleep 0.1; mouse 0 8 "$y1" m; sleep 1

  # 4. new project folder browser / 새 프로젝트 폴더 탐색 창
  y=$(row "${N3:0:8}"); mouse 2 6 "$y" M; sleep 0.2; mouse 2 6 "$y" m; sleep 0.6
  O send-keys -t 0 p; sleep 2
  shot "new-project-$L" "web / login-bug"
  O send-keys -t 0 Escape; sleep 1.5

  # 5. settings / 설정
  y=$(row "${N3:0:8}"); mouse 2 6 "$y" M; sleep 0.2; mouse 2 6 "$y" m; sleep 0.6
  O send-keys -t 0 s; sleep 2
  shot "settings-$L" "web / login-bug"
  O send-keys -t 0 Escape; sleep 1.5
done
