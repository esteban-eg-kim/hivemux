# ghostty-tumx

Ghostty + tmux + Claude Code 세션 영속화 + 폰 원격 제어.

| 층 | 역할 |
|---|---|
| Ghostty | 화면. 모든 창/탭이 `bin/tmx`로 tmux에 붙는다 |
| tmux | 프로세스 유지. 창을 닫아도 Claude가 계속 돈다 |
| resurrect + continuum | 5분마다 레이아웃 저장, 재부팅 후 복원 |
| Claude 훅 | tmux 창 ↔ Claude 세션 ID 기록, 복원 시 `claude --resume` 자동 실행 |
| Remote Control | 모든 Claude 세션이 Claude 앱(폰)에 자동 등록 |

## 설치 / 재설치
```bash
./install.sh      # 반복 실행 안전. 바꾼 파일은 backups/<시각>/ 에 백업
```
설치 내용: `~/.tmux.conf`, `~/.config/ghostty/config` 심볼릭 링크,
`~/.claude/settings.json`에 훅 6개와 `remoteControlAtStartup: true`, `~/.zshrc`에 PATH 블록.

## 처음 쓰는 순서
1. Ghostty 실행. 아래 상태줄이 보이면 tmux 안이다.
2. `tp ~/project/foo` → 세션 `foo` 생성. 1:claude 창(`claude -n foo`), 2:shell 창.
3. 다른 프로젝트도 `tp ~/project/bar`. 이전 프로젝트는 뒤에서 계속 실행.
4. 프로젝트 이동: `prefix s` 목록 또는 `tp 폴더` 다시 입력. 창 이동: `prefix 1`, `prefix 2`.
5. 같은 프로젝트에 Claude 추가: `prefix Shift+C` → 이름 입력.
   작업 이름 바꾸기: 사이드바 카드 더블클릭/오른쪽 클릭, 또는 그 Claude 입력창에서 `/rename 새 이름`.
6. 모든 창 왼쪽 사이드바 = 모든 프로젝트의 Claude 상태판(프로젝트별 색 타일, 지금 보는 작업은 흰 타일 + ▶). `Option+번호`로 바로 이동, `Option+0`은 가장 오래 기다린 작업.

자세한 그림 가이드: `docs/guide.html`

## 키 (prefix = Ctrl+A)
| 키 | 동작 |
|---|---|
| `prefix c` | 현재 폴더에서 셸 새 창 |
| `prefix Shift+C` | 이름을 묻고 현재 폴더에서 Claude 새 창 (`claude -n <이름>`) |
| `prefix s` | 세션(프로젝트) 목록 |
| `prefix Shift+R` | Remote Control 서버 창 (폰에서 새 세션 시작용) |
| `prefix Shift+S` | 세션/창 트리 |
| `prefix \|` / `prefix -` | 좌우 / 상하 분할 (현재 폴더 유지) |
| `prefix Ctrl+S` / `prefix Ctrl+R` | 지금 저장 / 수동 복원 |
| `prefix d` | 분리 (작업은 계속 돈다) |

- 왼쪽 사이드바 (`bin/claude-sidebar`, `bin/claude-sidebar-view`): 모든 창 왼쪽 32칸. 모든 세션의 Claude를 프로젝트별로 묶어 번호 붙은 두 줄 타일로 표시.
  작업 이름(Claude 대화 제목) 카드. 왼쪽 선 색 = 상태(파랑 작업 중, 초록 완료·안 봄, 회색 대기), 입력 필요는 카드 전체 호박색. ▶ 밝은 카드 = 지금 보는 작업. 오른쪽에 경과 시간.
  작업 중 카드는 빛 띠가 훑고 스피너가 돌며, 입력 필요 카드는 깜빡인다(`tmux set -g @sidebar-anim off`로 끔). `prefix b` 숨기기/보이기. 폭: 경계선을 마우스로 끌면 모든 창에 맞추고 `~/.local/share/tmux/claude-sidebar-width`에 저장(끄는 동안 포인터 ↔, 경계선 강조). 명령: `tmux set -g @sidebar-width 40; claude-sidebar fix`. 복원 중에는 생성을 멈추고 복원 뒤 다시 만든다.
- 맨 위 상태줄 (현재 세션 창 목록): `⚙` 작업 중, `⏳` 입력/승인 필요, `✓` 끝남.

| 키 | 동작 |
|---|---|
| `Option+1`…`9` | 그 번호 Claude로 이동 (세션이 달라도) |
| `Option+0` / `prefix Space` | 가장 오래 기다린 Claude, 없으면 안 본 완료 작업 |
| 사이드바 타일 클릭 / 사이드바에서 숫자 | 그 Claude로 이동 |
| `prefix b` | 사이드바 숨기기 / 보이기 |
| `Option+O` | 지금 칸 출력에서 파일 경로 골라 열기 (Enter VS Code 줄 번호, Tab 기본 앱, ^F Finder, ^Y 복사) |
| `⌘+클릭` | Claude가 링크로 낸 경로/주소 열기 (tmux hyperlinks + `FORCE_HYPERLINK=1`) |

## 폰에서 쓰기
- **이미 돌고 있는 세션**: Claude 앱 → Code 탭에 자동으로 보인다. 터미널에서 `/remote-control` 로 QR 표시 가능.
- **폰에서 새 세션 시작**: 해당 폴더에서 `prefix Shift+R` (또는 `claude-rc <dir>`). git 저장소면 세션마다 worktree로 분리.
- **푸시 알림**: Claude Code에서 `/config` → *Push when actions required* 켜기.
- Mac이 잠들면 오프라인이 된다. 덮개를 닫는 노트북이면 전원 연결 + 외부 디스플레이 또는 `caffeinate -dis` 필요.

## 글꼴
`ghostty/config`에 추가 후 Ghostty에서 `⌘+Shift+,` (설정 다시 읽기).
```
font-family = "D2Coding"
font-size = 15
```
설치된 글꼴: `/Applications/Ghostty.app/Contents/MacOS/ghostty +list-fonts`

## 문제 해결
```bash
claude-panes list                         # 현재 기억 중인 창 ↔ 세션
cat ~/.local/share/tmux/claude-panes.log  # 재개 기록
touch ~/tmux_no_auto_restore              # 다음 시작 때 복원 끄기 (지우면 다시 켜짐)
tmux set-environment -g CLAUDE_PANES_NO_RESUME 1   # 레이아웃만 복원, Claude 재개 안 함
```
- `/exit`나 Ctrl+D로 끝낸 세션은 재개 대상에서 빠진다. 강제 종료/재부팅은 재개된다.
- 마지막 저장 이후 5분 이내에 시작한 세션은 복원 목록에 없을 수 있다. 중요하면 `prefix Ctrl+S`.

## 파일
- `bin/tmx` Ghostty 진입점. 서버 없으면 복원 후 마지막으로 보던 세션에, 있으면 가장 최근에 본 분리된 세션에 붙음
- `bin/claude-tmux-hook` Claude 훅 → tmux 창 옵션(@claude_session, @claude_state)
- `bin/claude-panes` resurrect 저장/복원 훅. 매핑 저장, 복원 시 `claude --resume`
- `bin/claude-sidebar` 사이드바 칸 생성/폭 유지/정리/복원 후 재생성
- `bin/claude-sidebar-view` 사이드바 화면 (타일, 클릭, 숫자 키)
- `bin/claude-rename-ui` 이름 바꾸기 팝업 화면
- `bin/claude-rename` 사이드바에서 이름 변경 → `/rename` 전송 (작업 중이면 Stop 때 전송)
- `bin/claude-open`, `bin/claude-open-ui` Option+O 경로 열기 팝업
- `bin/claude-border` 경계선 끌기 피드백, 사이드바 폭 저장
- `bin/claude-agents` 번호 이동, 기다리는 작업 이동 (`claude-agents list`로 글자 목록)
- `bin/tp` 프로젝트 폴더 하나 = tmux 세션 하나. 만들거나 이동
- `bin/claude-win` `prefix Shift+C`. 이름을 받아 Claude 창을 연다
- `bin/claude-rc` Remote Control 서버 모드 창
