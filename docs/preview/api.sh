#!/bin/bash
# Build docs/img/{api,account,ports-phone}-{en,ko}.png: a Claude going on with the API at a usage limit (bin/hivemux-sdk,
# answered by fake-sdk: no API call), the account popup, and a dev server's QR code, with made-up data.
# 사용 한도에서 API 로 이어 가는 Claude (bin/hivemux-sdk 를 fake-sdk 가 각본대로 답함: API 호출 없음), 계정 팝업, 개발 서버의
# QR 코드 화면을 가짜 데이터로 docs/img/{api,account,ports-phone}-{en,ko}.png 로 만든다.
# Needs: tmux, Google Chrome, qrencode, hivemux-sdk's Python (bin/hivemux-sdk install).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(cd "$(mktemp -d /tmp/hmapi.XXXX)" && pwd -P)"; trap 'tmux -L hmapi kill-server 2>/dev/null; tmux -L hmapi-outer kill-server 2>/dev/null; rm -rf "$TMP"' EXIT
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
COLS=136; ROWS=34
OUT="$ROOT/docs/img"; mkdir -p "$OUT"
REAL_HOME="$HOME"; REAL_PY="${XDG_DATA_HOME:-$HOME/.local/share}/hivemux/sdk/venv/bin/python"
export XDG_DATA_HOME="$TMP/data" HOME="$TMP/home"
D="$XDG_DATA_HOME/hivemux"
mkdir -p "$HOME/code"/{api,docs,web} "$D/accounts"/{api,work} "$D/sdk/venv/bin"
printf '#!/bin/sh\nexport PYTHONPATH="%s"\nexec "%s" "$@"\n' "$ROOT/docs/preview/fake-sdk" "$REAL_PY" > "$D/sdk/venv/bin/python"
chmod +x "$D/sdk/venv/bin/python"
echo '{"oauthAccount":{"emailAddress":"me@example.com","planDisplayName":"Ultra"}}' > "$HOME/.claude.json"
echo '{"oauthAccount":{"emailAddress":"work@example.com","planDisplayName":"Max"}}' > "$D/accounts/work/.claude.json"
echo 'demo-x7Qa' > "$D/accounts/api/api-key"; echo api > "$D/account-fallback"
T() { tmux -L hmapi "$@"; }; O() { tmux -L hmapi-outer "$@"; }
shot() { # shot <name> <title>
  python3 -c 'import time; time.sleep((0.3 - time.time()) % 1)'
  O capture-pane -p -e -t 0 > "$TMP/screen.ansi"
  python3 "$ROOT/docs/preview/ansi2html.py" "$TMP/screen.ansi" "$TMP/$1.html" "$2" >/dev/null
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
  if [ "$L" = ko ]; then N1="인증 모듈 리팩터링"; N2="API 문서 정리"; N3="결제 페이지 개선"; ASK="로그인 화면에서 만료된 세션도 처리해 줘"
  else N1="Refactor auth module"; N2="Write API docs"; N3="Improve checkout page"; ASK="Handle an expired session on the login screen too"; fi
  cat > "$TMP/demo.conf" <<C
set -g @hivemux-lang $L
source-file "$ROOT/share/hivemux.tmux"
source-file "$ROOT/share/keys.tmux"
set -g default-command "exec /bin/zsh -f"
set -as terminal-features ",xterm-256color:RGB"
C
  T kill-server 2>/dev/null || true; O kill-server 2>/dev/null || true
  # the subscription is at its limit for two hours / 구독은 두 시간 동안 한도에 걸려 있다
  printf 'default\t%s\n' "$(( $(date +%s) + 7200 ))" > "$D/account-limited"
  T -f "$TMP/demo.conf" new-session -d -s api -n claude -c "$HOME/code/api" "sleep 900"
  T new-session -d -s docs -n claude -c "$HOME/code/docs" "sleep 900"
  T new-session -d -s web -n claude -c "$HOME/code/web" "sleep 900"
  sleep 3
  now=$(date +%s)
  pane() { T list-panes -t "$1" -F '#{pane_id} #{pane_title}' | awk '$2!="hivemux-sidebar"{print $1; exit}'; }
  st() { local p; p="$(pane "$1")"
    T set -p -t "$p" @claude_session "demo-$p"; T set -p -t "$p" @claude_state "$2"; T set -w -t "$p" @claude_state "$2"
    T set -p -t "$p" @claude_state_at "$((now - $3))"; T set -p -t "$p" @claude_name "$4"; }
  st api:claude run 95 "$N1"; st docs:claude done 60 "$N2"; st web:claude run 40 "$N3"
  for s in api docs web; do T set -t "=$s:" @hivemux-account api; done
  T set -p -t "$(pane web:claude)" @claude_ctx 88000
  T set -g @hivemux-mac-name "Mac Studio"
  T set -p -t "$(pane api:claude)" @hivemux-continue 1
  T respawn-pane -k -t "$(pane api:claude)" -c "$HOME/code/api" \
    "exec env HIVEMUX_LANG=$L HIVEMUX_SDK_ACCOUNT=default HIVEMUX_SDK_PROJECT=api HIVEMUX_SDK_KEY_ACCOUNT=api HOME=$HOME XDG_DATA_HOME=$XDG_DATA_HOME python3 $ROOT/bin/hivemux-sdk --model opus --effort high"
  O -f /dev/null new-session -d -x $COLS -y $ROWS \
    "env -u TMUX TERM=xterm-256color HOME=$HOME XDG_DATA_HOME=$XDG_DATA_HOME tmux -L hmapi attach -t api:claude"
  O set -g status off
  sleep 9
  T send-keys -t "$(pane api:claude)" -l "$ASK"; sleep 0.5; T send-keys -t "$(pane api:claude)" Enter
  sleep 4; st api:claude run 110 "$N1"; sleep 2
  shot "api-$L" "api / claude"

  # the account popup / 계정 팝업
  T run-shell -b "env HOME=$HOME XDG_DATA_HOME=$XDG_DATA_HOME HIVEMUX_LANG=$L $ROOT/bin/hivemux-account --popup \"\$(tmux -L hmapi list-clients -F '##{client_name}' | head -1)\""
  sleep 3
  shot "account-$L" "api / claude"
  O send-keys -t 0 Escape; sleep 1.2

  # a dev server on a phone: its address and QR code / 휴대폰으로 여는 개발 서버: 주소와 QR 코드
  T set -g @hivemux-seen-MacBook-Air "$(date +%s)"
  T set -g @hivemux-ports-MacBook-Air "$(printf '5173 5173 node\n8000 8000 Python')"
  T set -g @hivemux-lanip-MacBook-Air "192.168.0.12 5173"
  O send-keys -t 0 M-w; sleep 2
  O send-keys -t 0 p; sleep 2
  shot "ports-phone-$L" "api / claude"
  O send-keys -t 0 Escape; sleep 1
done
