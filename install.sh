#!/bin/bash
# hivemux installer (git based). Homebrew users: brew install OWNER/tap/hivemux && hivemux setup
#   curl -fsSL https://raw.githubusercontent.com/OWNER/hivemux/main/install.sh | bash
# Options are passed to "hivemux setup" (e.g. bash -s -- --no-keys).
set -euo pipefail
REPO="${HIVEMUX_REPO:-https://github.com/OWNER/hivemux.git}"
DIR="${HIVEMUX_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/hivemux/src}"
command -v git >/dev/null || { echo "hivemux: git is required" >&2; exit 1; }
if [ -d "$DIR/.git" ]; then
  echo "Updating $DIR"; git -C "$DIR" pull -q --ff-only
else
  echo "Cloning into $DIR"; mkdir -p "$(dirname "$DIR")"; git clone -q --depth 1 "$REPO" "$DIR"
fi
# curl | bash: stdin is the script, so read answers from the terminal when there is one
if [ -t 1 ] && { : </dev/tty; } 2>/dev/null; then
  exec "$DIR/bin/hivemux" setup "$@" </dev/tty
else
  exec "$DIR/bin/hivemux" setup --yes "$@"
fi
