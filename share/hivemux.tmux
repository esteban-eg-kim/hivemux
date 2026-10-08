# hivemux — Claude Code session board for tmux
#
# Load it from ~/.tmux.conf (hivemux setup adds this line for you):
#   source-file /path/to/hivemux/share/hivemux.tmux
#
# Everything below finds the hivemux scripts through @hivemux-bin, so the
# install location does not matter (git clone, Homebrew, anywhere).

run-shell 'tmux set -g @hivemux-bin "#{d:current_file}/../bin"'
run-shell 'tmux set -g @hivemux-data "${XDG_DATA_HOME:-$HOME/.local/share}/hivemux"'

# ── Terminal / Claude Code compatibility ─────────────────────────────────
set -g default-terminal "tmux-256color"
set -as terminal-features ",xterm-ghostty:RGB:extkeys:clipboard:sync:hyperlinks"
set -as terminal-features ",xterm*:extkeys"
set -s extended-keys on          # Shift+Enter newline in Claude Code
set -g allow-passthrough all     # notifications from panes that are not on screen
set -g focus-events on
set -s set-clipboard on
set -sg escape-time 0
set -g mouse on                  # sidebar clicks, grip drag
# Claude Code cannot detect hyperlink support inside tmux: force it (Cmd+click)
set-environment -g FORCE_HYPERLINK 1

# ── Status line (top) ────────────────────────────────────────────────────
set -g status on
set -g status-position top
set -g status-interval 5
set -g status-style "bg=#16181d,fg=#9aa3b2"
set -g status-left-length 40
# session (project) name on a blue badge, as in the README preview
set -g status-left "#[bg=#2f6fb3,fg=#e6e9ef,bold]  #S  #[default]#[bg=#16181d] "
set -g status-right-length 60
# continuum autosave is triggered from status-right (see Persistence below)
set -g status-right "#(#{@hivemux-continuum-save})#{?client_prefix,#[bg=#f5a524 fg=#16181d bold] PREFIX #[default] ,}#[fg=#626a78]%m-%d  %H:%M  "
set -g window-status-separator ""
set -g window-status-format "#[fg=#626a78] #I #[fg=#9aa3b2]#W#{?#{==:#{@claude_state},run}, #[fg=#5aa9ff]#{?@claude_spin,#{@claude_spin},◐},}#{?#{==:#{@claude_state},wait}, #[fg=#f5a524]●,}#{?#{==:#{@claude_state},done}, #[fg=#3ecf8e]✓,} "
set -g window-status-current-format "#[bg=#2a2f3a,fg=#9aa3b2] #I #[fg=#e6e9ef,bold]#W#[nobold]#{?#{==:#{@claude_state},run}, #[fg=#5aa9ff]#{?@claude_spin,#{@claude_spin},◐},}#{?#{==:#{@claude_state},wait}, #[fg=#f5a524]●,}#{?#{==:#{@claude_state},done}, #[fg=#3ecf8e]✓,} #[default]"
set -g pane-border-style "fg=#23262e"
set -g pane-active-border-style "fg=#2c3039"
set -g pane-border-lines single
set -g message-style "bg=#2a2f3a,fg=#e6e9ef"
set -g mode-style "bg=#2a2f3a,fg=#e6e9ef"
# window name ignores the sidebar pane (otherwise it becomes "Python")
set -g automatic-rename-format "#{?#{==:#{pane_title},hivemux-sidebar},#{window_name},#{?pane_in_mode,[tmux],#{pane_current_command}}#{?pane_dead,[dead],}}"

# ── Sidebar ──────────────────────────────────────────────────────────────
# width: saved when you drag the grip/border; 32 columns when nothing is saved
run-shell 'w=$(cat "#{@hivemux-data}/sidebar-width" 2>/dev/null); tmux set -g @hivemux-sidebar-width "${w:-32}"'
# running/waiting animations; set to off to disable
set -gq @hivemux-anim on
# animation frames per second (5-60); lower it to save CPU, e.g. 15
set -gq @hivemux-fps 30
# language and animation chosen in the sidebar menu's Settings (saved files win over the lines above)
# 사이드바 메뉴의 설정에서 고른 언어와 애니메이션 (저장된 파일이 위 줄보다 우선)
run-shell 'v=$(cat "#{@hivemux-data}/lang" 2>/dev/null); [ -n "$v" ] && tmux set -g @hivemux-lang "$v"; v=$(cat "#{@hivemux-data}/anim" 2>/dev/null); [ -n "$v" ] && tmux set -g @hivemux-anim "$v"; true'
set-hook -g after-new-window       'run-shell -b "#{@hivemux-bin}/hivemux-sidebar ensure #{window_id}"'
set-hook -g after-new-session      'run-shell -b "#{@hivemux-bin}/hivemux-sidebar ensure #{window_id}"'
set-hook -g client-session-changed 'run-shell -b "#{@hivemux-bin}/hivemux-sidebar ensure #{window_id}"'
set-hook -g session-window-changed 'run-shell -b "#{@hivemux-bin}/hivemux-sidebar ensure #{window_id}"'
set-hook -g pane-exited            'run-shell -b "#{@hivemux-bin}/hivemux-sidebar reap; #{@hivemux-bin}/hivemux-sidebar ensure"'
set-hook -g after-kill-pane        'run-shell -b "#{@hivemux-bin}/hivemux-sidebar reap"'
set-hook -g window-resized         'run-shell -b "#{@hivemux-bin}/hivemux-sidebar fix"'
set-hook -g client-attached        'run-shell -b "#{@hivemux-bin}/hivemux-sidebar presize #{client_name}"'
set-hook -g client-resized         'run-shell -b "#{@hivemux-bin}/hivemux-sidebar presize #{client_name}"'
run-shell -b "#{@hivemux-bin}/hivemux-sidebar ensure"

# ── Keys ─────────────────────────────────────────────────────────────────
# Option+1..9  jump to that Claude (any session)   Option+0  oldest waiting Claude
bind -n M-1 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 1 '#{client_name}'"
bind -n M-2 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 2 '#{client_name}'"
bind -n M-3 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 3 '#{client_name}'"
bind -n M-4 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 4 '#{client_name}'"
bind -n M-5 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 5 '#{client_name}'"
bind -n M-6 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 6 '#{client_name}'"
bind -n M-7 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 7 '#{client_name}'"
bind -n M-8 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 8 '#{client_name}'"
bind -n M-9 run-shell -b "#{@hivemux-bin}/hivemux-agents jump 9 '#{client_name}'"
bind -n M-0 run-shell -b "#{@hivemux-bin}/hivemux-agents next '#{client_name}'"
bind Space  run-shell -b "#{@hivemux-bin}/hivemux-agents next '#{client_name}'"
# Option+O  pick a file path from this pane's recent output and open it
bind -n M-o run-shell -b "#{@hivemux-bin}/hivemux-open '#{pane_id}' '#{client_name}'"
# prefix C  new named Claude window   prefix R  Remote Control server window
bind C run-shell "#{@hivemux-bin}/hivemux-new-claude '#{pane_current_path}'"
bind R run-shell "#{@hivemux-bin}/hivemux-remote '#{pane_current_path}'"
# prefix b  hide / show sidebars      prefix S  session + window tree
bind b run-shell -b "#{@hivemux-bin}/hivemux-sidebar toggle"
bind S choose-tree -Zw
# prefix Shift+Up/Down  move the current task up/down in the sidebar (at a project's edge, the project moves)
# 사이드바에서 지금 작업을 위/아래로 (프로젝트 끝이면 프로젝트가 움직인다)
bind S-Up   run-shell -b "#{@hivemux-bin}/hivemux-order step up '#{pane_id}'"
bind S-Down run-shell -b "#{@hivemux-bin}/hivemux-order step down '#{pane_id}'"
bind -n MouseDown1Status select-window -t =

# ── Mouse: border and sidebar grip resize ────────────────────────────────
# tmux has no mouse-move events, so feedback starts on press, not on hover.
bind -n MouseDown1Border select-pane -M \; run-shell -b "#{@hivemux-bin}/hivemux-border down '#{client_tty}'"
bind -n MouseDrag1Border resize-pane -M
bind -n MouseDragEnd1Border run-shell -b "#{@hivemux-bin}/hivemux-border up '#{client_tty}' '#{window_id}'"
bind -n MouseUp1Border      run-shell -b "#{@hivemux-bin}/hivemux-border up '#{client_tty}' '#{window_id}'"
# a drag that starts on the sidebar grip column becomes tmux's own resize;
# everything else keeps tmux's default pane mouse behavior
bind -n MouseDown1Pane if -F '#{&&:#{==:#{pane_title},hivemux-sidebar},#{==:#{mouse_x},#{e|-:#{pane_width},1}}}' \
  "set -g @hivemux-grip 1 ; run-shell -b \"#{@hivemux-bin}/hivemux-border down '#{client_tty}'\"" \
  "select-pane -t = ; send-keys -M"
bind -n MouseDrag1Pane if -F '#{@hivemux-grip}' "resize-pane -M" \
  "if-shell -F '#{||:#{pane_in_mode},#{mouse_any_flag}}' 'send-keys -M' 'copy-mode -M'"
bind -n MouseDragEnd1Pane if -F '#{@hivemux-grip}' \
  "set -gu @hivemux-grip ; run-shell -b \"#{@hivemux-bin}/hivemux-border up '#{client_tty}' '#{window_id}'\"" "send-keys -M"
bind -n MouseUp1Pane if -F '#{@hivemux-grip}' \
  "set -gu @hivemux-grip ; run-shell -b \"#{@hivemux-bin}/hivemux-border up '#{client_tty}' '#{window_id}'\"" "send-keys -M"

# ── Persistence: tmux-resurrect + tmux-continuum ─────────────────────────
# Uses your existing copies in ~/.tmux/plugins if present, otherwise the ones
# hivemux setup downloaded into $XDG_DATA_HOME/hivemux/plugins.
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-save-interval '5'
set -g @continuum-restore 'off'       # restore is done by hivemux-attach (waits for it)
run-shell 'tmux set -g @resurrect-hook-post-save-all "#{@hivemux-bin}/hivemux-panes save"'
run-shell 'tmux set -g @resurrect-hook-pre-restore-all "tmux set -g @hivemux-suspend 1"'
run-shell 'tmux set -g @resurrect-hook-post-restore-all "#{@hivemux-bin}/hivemux-panes restore; tmux set -gu @hivemux-suspend; #{@hivemux-bin}/hivemux-sidebar rebuild"'
run-shell '#{@hivemux-bin}/hivemux-plugins load'
