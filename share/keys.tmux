# hivemux recommended keys (optional; hivemux setup asks before adding it)
#
# Claude Code uses Ctrl+B for background tasks, so the prefix moves to Ctrl+A.
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# splits and new windows keep the current directory
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind c new-window -c "#{pane_current_path}"
bind r source-file ~/.tmux.conf \; display "tmux.conf reloaded"

set -g history-limit 100000
set -g set-titles on
set -g set-titles-string "#S / #W"
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on
setw -g monitor-bell on
set -g bell-action other
