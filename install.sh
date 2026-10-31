#!/bin/bash
# hivemux installer (git based). Homebrew users: brew install esteban-eg-kim/tap/hivemux && hivemux setup
#   curl -fsSL https://hivemux.dev/install.sh | bash
# Options are passed to "hivemux setup" (e.g. bash -s -- --no-keys).
set -euo pipefail
REPO="${HIVEMUX_REPO:-https://github.com/esteban-eg-kim/hivemux.git}"
DIR="${HIVEMUX_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/hivemux/src}"
# all in a function, so a download cut short runs nothing / 모두 함수 안에: 받다가 끊기면 아무것도 실행되지 않는다
main() {
  command -v git >/dev/null || {
    echo "hivemux: git is required (macOS: xcode-select --install; Ubuntu/Debian: sudo apt-get install git;" >&2
    echo "         Fedora: sudo dnf install git; Arch: sudo pacman -S git)" >&2; exit 1; }
  if [ -d "$DIR/.git" ]; then
    echo "Updating $DIR"; git -C "$DIR" pull -q --ff-only
  else
    # only what runs: the README's pictures and videos (docs/) stay on GitHub
    # 실행에 필요한 것만: README 의 그림과 영상(docs/)은 GitHub 에 둔다
    echo "Cloning into $DIR"; mkdir -p "$(dirname "$DIR")"
    git clone -q --depth 1 --filter=blob:none --sparse "$REPO" "$DIR"
    git -C "$DIR" sparse-checkout set bin share examples
  fi
  # curl | bash: stdin is the script, so read answers from the terminal when there is one
  if [ -t 1 ] && { : </dev/tty; } 2>/dev/null; then
    exec "$DIR/bin/hivemux" setup "$@" </dev/tty
  else
    exec "$DIR/bin/hivemux" setup --yes "$@"
  fi
}
main "$@"
