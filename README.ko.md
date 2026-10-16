# hivemux

[English](README.md) · **한국어**

**Claude Code 세션 다섯 개를 동시에 돌려도, 지금 나를 기다리는 작업이 무엇인지 한눈에 봅니다.**

hivemux는 모든 tmux 창 왼쪽에 사이드바를 붙입니다. 사이드바에는 모든 tmux 세션의 Claude Code 세션이 나옵니다. 각 세션이 무슨 작업을 하는지, 작업 중인지, 승인을 기다리는지, 끝났는지, 얼마나 지났는지 보입니다. `Option+3`을 누르면 세 번째 작업으로, `Option+0`을 누르면 가장 오래 기다린 작업으로 바로 갑니다. 터미널을 닫거나 Mac을 재부팅해도 모든 화면이 돌아오고, 각 칸의 Claude가 원래 대화로 다시 열립니다.

<p align="center">
  <img src="docs/preview-ko.png" alt="hivemux 사이드바 미리보기" width="880">
</p>

## 기능

- **모든 세션을 한 판에:** 프로젝트별로 묶인 카드에 실시간 상태와 경과 시간을 보여 줍니다. 작업 중인 카드는 빛 띠가 지나가고, 입력이 필요한 카드는 호박색으로 깜빡입니다.
- **알림:** 작업이 입력을 기다리거나 끝나면 macOS 알림이 뜹니다. 지금 보고 있는 작업은 빼고 알립니다. 설정에서 끌 수 있습니다.
- **어디로든 바로 이동:** `Option+1`부터 `Option+9`까지, `Option+0`(가장 오래 기다린 작업), 카드 클릭으로 이동합니다.
- **호출판:** 푸드코트 전광판처럼, 맨 윗줄의 프로젝트 이름 다음에 입력이 필요한 작업(호박색)과 끝났지만 아직 안 본 작업(초록)이 프로젝트와 상관없이 모두 뜹니다. 입력이 필요한 작업은 답할 때까지, 끝난 작업은 처음 10초 동안 깜빡입니다. 누르면 그 작업으로 가고, 끝난 작업은 한 번 보면 사라집니다.
- **작업 이름:** Claude가 정한 대화 제목을 보여 줍니다. 카드를 더블클릭하거나 오른쪽 클릭 메뉴의 "이름 바꾸기"로 이름을 바꿀 수 있습니다. 바꾼 이름은 `/rename`으로 Claude에 전달되고, Claude가 작업 중이면 끝날 때까지 기다렸다가 보냅니다.
- **원하는 순서:** 카드를 끌어 작업 순서를, 프로젝트 이름 줄을 끌어 프로젝트 순서를 바꿉니다. `Option+숫자` 번호와 맨 위 창 목록도 같은 순서를 따릅니다.
- **끊기지 않음:** 터미널을 닫아도 tmux가 세션을 살려 둡니다. 재부팅하면 tmux-resurrect가 배치를 복원하고, hivemux가 알맞은 칸에서 `claude --resume <id>`를 실행합니다.
- **프로젝트:** `hm ~/code/api`로 폴더 하나에 tmux 세션 하나를 엽니다. 이름 붙인 Claude 창과 셸 창이 함께 생깁니다.
- **Claude가 말한 경로 열기:** `Option+O`를 누르면 그 칸의 최근 출력에 나온 파일 경로가 목록으로 나옵니다. Enter를 누르면 VS Code에서 그 줄로 열립니다.
- **폰에서:** 원하면 모든 세션의 Remote Control을 켭니다. Claude 앱에서 같은 세션을 보고 조작할 수 있습니다.
- **설정을 덮어쓰지 않는 설치:** 기존 설정 파일에 표시된 블록만 추가하고, `hivemux uninstall`로 그 블록만 정확히 지웁니다.

## 필요한 것

- macOS (Linux도 동작할 가능성이 높지만 시험하지 않음)
- tmux 3.3 이상, jq, git, python3 (Xcode Command Line Tools)
- 로그인된 [Claude Code](https://code.claude.com)
- [Ghostty](https://ghostty.org) 권장 (다른 터미널에서도 `tmux`를 직접 실행하면 동작)

## 설치

```sh
curl -fsSL https://raw.githubusercontent.com/esteban-eg-kim/hivemux/main/install.sh | bash
```

hivemux를 `~/.local/share/hivemux/src`에 받고 `hivemux setup`을 실행합니다.

Homebrew:

```sh
brew install esteban-eg-kim/tap/hivemux
hivemux setup
```

`hivemux setup`은 세 가지를 묻고, 기본값은 모두 "예"입니다.

| 질문 | 바뀌는 것 |
|---|---|
| 권장 키 사용 | 접두키 `Ctrl+A` (Claude Code가 `Ctrl+B`를 씀), `\|` `-` 분할 |
| Ghostty를 tmux에 연결 | Ghostty 설정에 `command = hivemux-attach` |
| 모든 세션 Remote Control | `~/.claude/settings.json`의 `remoteControlAtStartup` |

tmux-resurrect와 tmux-continuum도 받아 옵니다. 이미 `~/.tmux/plugins`에 있으면 그것을 씁니다. Claude Code 훅 열한 개도 등록합니다. `hivemux doctor`로 전체를 점검할 수 있습니다. `--yes`는 기본값으로 진행하고, `--no-keys`, `--no-ghostty`, `--no-remote`는 해당 부분을 건너뜁니다. 화면 언어는 셸 언어로 정해지고, `--lang=en` 또는 `--lang=ko`로 바꿀 수 있습니다. 설치한 뒤에는 사이드바 오른쪽 클릭 메뉴의 "설정"에서 바꿉니다.

### 업데이트

```sh
brew upgrade hivemux && hivemux setup    # Homebrew
curl -fsSL https://raw.githubusercontent.com/esteban-eg-kim/hivemux/main/install.sh | bash   # git 설치: 같은 명령
```

`hivemux setup`은 다시 실행해도 안전합니다. 자기가 넣은 블록과 훅만 바꾸고(새 버전에서 훅이 늘 수 있음), 실행 중인 tmux 설정을 다시 읽고 사이드바를 다시 띄웁니다. 쓰던 세션은 그대로입니다. 업데이트 전에 시작한 Claude는 다시 시작해야 새 훅을 씁니다. 설치된 버전은 `hivemux version`으로, 바뀐 내용은 [CHANGELOG.md](CHANGELOG.md)에서 확인합니다.

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
| 카드 / 프로젝트 이름 클릭 | 이동. 카드 더블클릭은 이름 바꾸기. Claude 창을 모두 닫은 프로젝트도 닫을 때까지 목록에 남음 ("Claude 없음") |
| 오른쪽 클릭 | 메뉴. 작업 카드: 이동, 이름 바꾸기, 위/아래로 옮기기, 새 Claude, 새 프로젝트. 프로젝트 이름 줄: 이름 바꾸기, 프로젝트 닫기, 새 Claude, 새 프로젝트. 빈 곳: 새 프로젝트. 모든 메뉴 맨 아래에 원격 연결과 설정. 마우스나 `↑↓` `Enter`, 괄호 안 글자로 고르고 `Esc`로 닫기 |
| 메뉴 → 새 프로젝트 | 가운데 폴더 탐색 창: `Enter`는 고른 폴더에서 시작 (`hm`과 같음), `→` / `←`는 폴더 안 / 상위로, 글자를 치면 걸러 보기, `Ctrl+N`은 새 폴더 |
| 메뉴 → 설정 | 언어 (한국어 / English), 애니메이션, 알림, 사이드바 폭. 바로 적용되고 저장됨 |
| 카드 / 프로젝트 이름 줄 끌기 | 작업 순서 / 프로젝트 순서 바꾸기 |
| `prefix Shift+↑` / `↓` | 지금 작업을 위 / 아래로 (프로젝트 끝이면 프로젝트가 움직임) |
| `Option+O` | 최근 출력의 파일 경로 열기 (Enter VS Code, Tab 기본 앱, ^F Finder, ^Y 복사) |
| `prefix Shift+C` | 이 폴더에서 이름 붙인 Claude 새 창 |
| 메뉴 → 원격 연결 | 다른 Mac의 hivemux를 새 Ghostty 창으로 (`hivemux connect --add`로 등록한 호스트) |
| `prefix Shift+H` | 마지막 원격 호스트에 다시 연결 |
| `prefix Shift+R` | Remote Control 서버 창 (폰에서 새 세션 시작) |
| `prefix b` | 사이드바 숨기기 / 보이기 |
| `prefix s` / `prefix Shift+S` | 세션 목록 / 전체 트리 |
| 사이드바 핸들 끌기 | 폭 조절, 저장됨 |

권장 키를 쓰면 `prefix`는 `Ctrl+A`이고, 아니면 tmux 기본값 `Ctrl+B`입니다.

<p align="center">
  <img src="docs/img/menu-ko.png" alt="작업 카드 오른쪽 클릭 메뉴" width="430">
  <img src="docs/img/reorder-ko.png" alt="카드를 끌어서 순서 바꾸기" width="430">
  <img src="docs/img/new-project-ko.png" alt="새 프로젝트 폴더 탐색 창" width="430">
  <img src="docs/img/settings-ko.png" alt="설정 창" width="430">
</p>

## 다른 Mac에서 이어서 작업

작업은 한 Mac(예: 사무실 Mac)에서 계속 돌리고, 다른 Mac(예: 노트북)에서 이어서 할 수 있습니다. 노트북이 ssh로 그 Mac의 tmux에 붙어 같은 사이드바와 세션을 봅니다. 연결이 끊겨도 작업은 계속됩니다. 노트북의 로컬 작업은 그대로 두고, 원격은 따로 창을 엽니다.

**붙는 대상 Mac**에서는 hivemux를 설치하고, 시스템 설정 → 일반 → 공유 → **원격 로그인**을 켜고, 자동으로 잠들지 않게 해 둡니다.

**붙는 쪽 Mac**에서는:

```sh
hivemux connect --add me@work-mac.local    # 확인하고 등록 (mosh를 쓰려면 --mosh)
hivemux connect me@work-mac.local          # 또는 오른쪽 클릭 → 원격 연결, prefix Shift+H
```

처음 등록할 때는 `--add`(또는 원격 연결 목록의 "+ 호스트 추가…")가 호스트를 믿을지와 상대 Mac의 로그인 비밀번호를 한 번 묻고, 이 Mac의 ssh 키를 상대에 등록합니다. 키가 없으면 새로 만듭니다. 그다음부터는 비밀번호를 묻지 않습니다.

호스트에는 `ssh`에 쓰는 것이면 무엇이든 넣습니다. `~/.ssh/config`의 `Host`, `사용자@주소`, VPN 안의 기기 이름 모두 됩니다. 같은 네트워크에서는 `이름.local`로 붙고, 밖에서는 [Tailscale](https://tailscale.com) 같은 VPN을 두 Mac에 설치하는 방법이 간단합니다. 공유기 포트 포워딩으로 ssh를 인터넷에 여는 것은 권하지 않습니다.

- 원격 창은 상태줄 왼쪽에 `⇄ Mac 이름`이 표시됩니다.
- 연결이 끊기면 저절로 다시 연결합니다(`Ctrl+C`로 그만). `prefix d`로 떼면 창이 닫힙니다.
- 원격 작업의 알림도 이 Mac에 뜹니다.
- `--mosh`로 등록하거나 메뉴 → 원격 연결… 목록에서 `m`을 누르면 잠자기와 네트워크 변경을 스스로 견딥니다. 대신 알림이 mosh를 지나가지 못하며, 목록에는 "mosh · 알림 없음"으로 표시됩니다. 두 Mac 모두 `brew install mosh`가 필요합니다. "Nothing received from server on UDP port"에서 멈추면 상대 Mac의 방화벽에서 `mosh-server`의 수신 연결을 허용하세요.
- 두 화면에서 같은 프로젝트를 보면 화면을 같이 씁니다. 한쪽에서 창을 바꾸면 다른 쪽도 바뀝니다.
- 원격 화면이 보고 있는 창에서는 사이드바가 움직이지 않습니다 (카드 깜빡임, 상태줄 스피너 없음). 애니메이션 한 장면 한 장면이 모두 네트워크로 가기 때문입니다.

## 동작 원리

| 층 | 역할 |
|---|---|
| Ghostty | 화면을 그립니다. 모든 창이 `hivemux-attach`를 실행해 tmux에 붙습니다 |
| tmux | 터미널을 닫아도 프로세스를 살려 둡니다 |
| tmux-resurrect + continuum | 5분마다 배치를 저장하고, 처음 시작할 때 복원합니다 |
| Claude Code 훅 | 세션 ID와 상태를 tmux 칸에 기록합니다 (`hivemux-hook`) |
| 사이드바 | 그 상태를 1초마다 읽어 상태판을 그립니다 (`hivemux-sidebar-view`) |

복원할 때 `hivemux-panes`가 저장된 칸과 Claude 세션 ID를 짝지어, 칸마다 `claude --resume <id>`를 입력합니다. `/exit`로 직접 끝낸 세션은 재개하지 않습니다.

## 문제 해결

```sh
hivemux doctor                     # 의존성과 연결 점검
hivemux-panes list                 # 재부팅 후 재개할 칸 목록
tmux set -g @hivemux-anim off      # 애니메이션 끄기 (계속 끄려면 메뉴 → 설정)
tmux set -g @hivemux-fps 15        # 애니메이션 프레임 줄이기, CPU 절약 (기본 30)
hivemux-sidebar respawn            # 모든 사이드바 다시 띄우기
touch ~/tmux_no_auto_restore       # 다음 시작 때 복원 건너뛰기
```

자세한 내용은 그림 가이드 [`docs/guide.html`](docs/guide.html)([English](docs/guide.en.html))에 있습니다. 내려받아 브라우저로 여세요.

## 제거

```sh
hivemux uninstall
```

`~/.tmux.conf`, Ghostty 설정, `~/.zshrc`에서 hivemux 블록을 지우고, Claude Code 설정에서 hivemux 훅을 지웁니다. 저장된 배치와 백업은 `~/.local/share/hivemux`에 남습니다.

## 라이선스

MIT. hivemux는 독립 프로젝트이며 Anthropic과 관련이 없고 Anthropic의 보증을 받지 않았습니다. "Claude"와 "Claude Code"는 Anthropic의 상표입니다.
