# hivemux

**Claude Code 세션 다섯 개를 동시에 돌려도, 지금 나를 기다리는 게 무엇인지 한눈에 봅니다.**

hivemux는 모든 tmux 창 왼쪽에 사이드바를 붙입니다. 사이드바에는 모든 tmux 세션의 Claude Code 세션이 작업 이름, 상태, 경과 시간과 함께 나옵니다. 상태는 작업 중, 승인 대기, 완료입니다. `Option+3`을 누르면 세 번째 작업으로, `Option+0`을 누르면 가장 오래 기다린 작업으로 바로 갑니다. 터미널을 닫거나 Mac을 재부팅해도 모든 화면이 돌아오고, 각 칸의 Claude가 원래 대화로 다시 열립니다.

[English README](README.md) · [그림 가이드](docs/guide.html)

## 기능

- **모든 세션을 한 판에:** 프로젝트별로 묶인 카드에 실시간 상태와 경과 시간을 보여 줍니다. 작업 중인 카드는 빛 띠가 지나가고, 입력이 필요한 카드는 호박색으로 깜빡입니다.
- **어디로든 바로 이동:** `Option+1`부터 `Option+9`까지, `Option+0`, 카드 클릭으로 이동합니다.
- **작업 이름:** Claude가 정한 대화 제목을 보여 줍니다. 카드를 더블클릭하거나 오른쪽 클릭하면 이름을 바꿀 수 있습니다. 바꾼 이름은 `/rename`으로 Claude에도 전달됩니다.
- **끊기지 않음:** 터미널을 닫아도 tmux가 작업을 살려 둡니다. 재부팅해도 배치가 복원되고 칸마다 `claude --resume`이 실행됩니다.
- **프로젝트:** `hm ~/code/api`로 폴더 하나에 tmux 세션 하나를 만듭니다.
- **경로 열기:** `Option+O`를 누르면 최근 출력에 나온 파일 경로가 목록으로 나옵니다. Enter를 누르면 VS Code에서 그 줄로 열립니다.
- **폰에서:** 모든 세션의 Remote Control을 켜면 Claude 앱에서 같은 세션을 보고 조작할 수 있습니다. 설치할 때 선택합니다.
- **설정을 덮어쓰지 않음:** 기존 설정 파일에 표시된 블록만 추가하고, 제거할 때 그 블록만 지웁니다.

## 필요한 것

- macOS
- tmux 3.3 이상, jq, git, python3 (Xcode Command Line Tools)
- 로그인된 Claude Code
- Ghostty 권장 (다른 터미널에서도 `tmux`를 직접 실행하면 동작)

## 설치

```sh
curl -fsSL https://raw.githubusercontent.com/esteban-eg-kim/hivemux/main/install.sh | bash
```

hivemux를 `~/.local/share/hivemux/src`에 받고 `hivemux setup`을 실행합니다. 같은 명령을 다시 실행하면 업데이트됩니다.

Homebrew (준비 중):

```sh
brew install esteban-eg-kim/tap/hivemux
hivemux setup
```

`hivemux setup`은 세 가지를 묻고, 기본값은 모두 "예"입니다.

| 질문 | 바뀌는 것 |
|---|---|
| 권장 키 사용 | 접두키 `Ctrl+A` (Claude Code가 `Ctrl+B`를 씀), `|` `-` 분할 |
| Ghostty를 tmux에 연결 | Ghostty 설정에 `command = hivemux-attach` |
| 모든 세션 Remote Control | `~/.claude/settings.json`의 `remoteControlAtStartup` |

## 처음 쓰는 순서

1. Ghostty를 엽니다. 이미 tmux 안이고, 왼쪽에 사이드바가 있습니다.
2. `hm ~/code/api`를 입력하면 api 프로젝트가 열리고 1번 창에서 Claude가 실행됩니다.
3. `hm ~/code/web`을 입력하면 두 번째 프로젝트가 열립니다. 첫 번째는 계속 일합니다.
4. 사이드바를 보다가 `Option+0`으로 기다리는 작업으로 갑니다.
5. `prefix` 다음 `Shift+C`로 같은 프로젝트에 이름 붙인 Claude를 추가합니다.
6. Ghostty는 언제 닫아도 됩니다. 다시 열면 보던 곳으로 돌아옵니다.

## 키

| 키 | 동작 |
|---|---|
| `Option+1` … `9` | 그 번호 Claude로 이동 (세션이 달라도) |
| `Option+0` / `prefix Space` | 가장 오래 기다린 Claude, 없으면 안 본 완료 작업 |
| 카드 클릭 | 이동. 더블클릭이나 오른쪽 클릭은 이름 바꾸기 |
| `Option+O` | 최근 출력의 파일 경로 열기 |
| `prefix Shift+C` | 이 폴더에서 이름 붙인 Claude 새 창 |
| `prefix Shift+R` | Remote Control 서버 창 (폰에서 새 세션 시작) |
| `prefix b` | 사이드바 숨기기 / 보이기 |
| 사이드바 핸들 끌기 | 폭 조절, 저장됨 |

## 문제 해결

```sh
hivemux doctor                     # 의존성과 연결 점검
hivemux-panes list                 # 재부팅 후 재개할 칸 목록
tmux set -g @hivemux-anim off      # 애니메이션 끄기
touch ~/tmux_no_auto_restore       # 다음 시작 때 복원 건너뛰기
```

## 제거

```sh
hivemux uninstall
```

`~/.tmux.conf`, Ghostty 설정, `~/.zshrc`에서 hivemux 블록을 지우고, Claude Code 설정에서 hivemux 훅을 지웁니다. 저장된 배치와 백업은 `~/.local/share/hivemux`에 남습니다.

## 라이선스

MIT. hivemux는 독립 프로젝트이며 Anthropic과 관련이 없습니다. "Claude"와 "Claude Code"는 Anthropic의 상표입니다.
