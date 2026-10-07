#!/usr/bin/env python3
"""Print a made-up Claude Code screen for the README preview (no real data).
README 미리보기용 가짜 Claude Code 화면 (실제 데이터 아님).
  fake-claude.py en|ko
"""
import os, sys, time

lang = sys.argv[1] if len(sys.argv) > 1 else "en"
W = "\x1b[0m"; B = "\x1b[1m"; I = "\x1b[3m"
def fg(r, g, b): return f"\x1b[38;2;{r};{g};{b}m"
def bg(r, g, b): return f"\x1b[48;2;{r};{g};{b}m"
WHITE, GRAY, DIM, BLUE, GREEN, RED, AMBER = fg(235,235,235), fg(150,150,150), fg(110,110,110), fg(122,162,247), fg(120,200,120), fg(230,110,110), fg(245,165,36)
ADD, DEL = bg(26, 58, 34), bg(68, 28, 30)

T = {
 "en": dict(
   ask="the login page drops ?redirectTo after sign-in, users land on / instead",
   think="The redirect target is lost when the session cookie is refreshed.\n"
         f"  I'll keep {BLUE}redirectTo{WHITE} in the form action and send the user back after sign-in.",
   upd="Updated with 6 additions and 2 removals", ask2="Do you want to make this edit to +page.server.ts?",
   o1="Yes", o2="Yes, allow all edits during this session (shift+tab)", o3="No, and tell Claude what to do differently (esc)"),
 "ko": dict(
   ask="로그인하고 나면 ?redirectTo 가 사라져서 항상 / 로 가요",
   think="세션 쿠키를 새로 만들 때 이동할 주소가 사라집니다.\n"
         f"  폼 액션에서 {BLUE}redirectTo{WHITE}를 유지해서 로그인 후 원래 페이지로 보내겠습니다.",
   upd="6줄 추가, 2줄 삭제", ask2="Do you want to make this edit to +page.server.ts?",
   o1="Yes", o2="Yes, allow all edits during this session (shift+tab)", o3="No, and tell Claude what to do differently (esc)"),
}[lang]

out = [
 f"{GRAY}❯ {WHITE}{T['ask']}{W}",
 "",
 f"{WHITE}● {B}Read{W}{WHITE}(src/routes/login/+page.server.ts){W}",
 f"{GRAY}  ⎿  Read 48 lines{W}",
 "",
 f"{WHITE}● {T['think']}{W}",
 "",
 f"{WHITE}● {B}Update{W}{WHITE}(src/routes/login/+page.server.ts){W}",
 f"{GRAY}  ⎿  {T['upd']}{W}",
 f"{DIM}      21   export const actions = {{{W}",
 f"{DIM}      22     default: async ({{ request, cookies, url }}) => {{{W}",
 f"{DEL}{RED}      23 -     throw redirect(303, '/');                                        {W}",
 f"{ADD}{GREEN}      23 +     const to = url.searchParams.get('redirectTo') ?? '/';            {W}",
 f"{ADD}{GREEN}      24 +     throw redirect(303, to.startsWith('/') ? to : '/');              {W}",
 f"{DIM}      25     }}{W}",
 "",
 f"{AMBER}{B} {T['ask2']}{W}",
 f"{WHITE} ❯ 1. {T['o1']}{W}",
 f"{GRAY}   2. {T['o2']}{W}",
 f"{GRAY}   3. {T['o3']}{W}",
 "",
 f"{DIM}{'─' * (os.get_terminal_size().columns - 1)}{W}",
 f"{GRAY}  ⏵⏵ auto mode on (shift+tab to cycle){W}",
]
sys.stdout.write("\x1b[2J\x1b[H\x1b[?25l" + "\r\n".join(out).replace("\n", "\r\n").replace("\r\r\n", "\r\n"))
sys.stdout.flush()
time.sleep(600)
