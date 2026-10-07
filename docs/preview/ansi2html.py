#!/usr/bin/env python3
"""Render a tmux capture (capture-pane -p -e) as a terminal-window HTML page.
tmux 캡처(capture-pane -p -e)를 터미널 창 모양의 HTML 로 그린다.

Every cell has a fixed width (wide/CJK characters take two), and block/line
characters are drawn with CSS so they join like in a real terminal.
칸마다 폭을 고정하고(한글 등은 두 칸), 블록/선 문자는 CSS 로 그려 실제 터미널처럼 이어지게 한다.

  ansi2html.py capture.ansi out.html "window title"
"""
import html, re, sys, unicodedata

CW, LH, FS = 9, 19, 15                  # cell width, line height, font size (px)
DEF_FG, DEF_BG = (225, 228, 232), (40, 44, 52)

def pal256(n):
    base = [(0,0,0),(205,49,49),(13,188,121),(229,229,16),(36,114,200),(188,63,188),(17,168,205),(229,229,229),
            (102,102,102),(241,76,76),(35,209,139),(245,245,67),(59,142,234),(214,112,214),(41,184,219),(255,255,255)]
    if n < 16: return base[n]
    if n < 232:
        n -= 16; v = [0, 95, 135, 175, 215, 255]
        return (v[n // 36], v[(n // 6) % 6], v[n % 6])
    g = 8 + (n - 232) * 10; return (g, g, g)

def width(ch):
    if unicodedata.combining(ch): return 0
    return 2 if unicodedata.east_asian_width(ch) in "WF" else 1

def css(c): return "#%02x%02x%02x" % c

# block/line characters drawn as backgrounds so rows join without gaps
def block(ch, fg, bg):
    f, b = css(fg), css(bg)
    shapes = {
        "▌": f"linear-gradient(90deg,{f} 50%,{b} 50%)",
        "▎": f"linear-gradient(90deg,{f} 25%,{b} 25%)",
        "▍": f"linear-gradient(90deg,{f} 37%,{b} 37%)",
        "▐": f"linear-gradient(90deg,{b} 50%,{f} 50%)",
        "▄": f"linear-gradient(180deg,{b} 50%,{f} 50%)",
        "▀": f"linear-gradient(180deg,{f} 50%,{b} 50%)",
        "█": f"linear-gradient({f},{f})",
        "│": f"linear-gradient(90deg,{b} calc(50% - .5px),{f} calc(50% - .5px),{f} calc(50% + .5px),{b} calc(50% + .5px))",
        "─": f"linear-gradient(180deg,{b} calc(50% - .5px),{f} calc(50% - .5px),{f} calc(50% + .5px),{b} calc(50% + .5px))",
        "┃": f"linear-gradient(90deg,{b} calc(50% - 1px),{f} calc(50% - 1px),{f} calc(50% + 1px),{b} calc(50% + 1px))",
        # circles: fonts draw these two cells wide, so draw them as shapes
        # 원 기호: 글꼴이 두 칸 폭으로 그려서 도형으로 그린다
        "●": f"radial-gradient(circle at 50% 54%,{f} 0 3.4px,{b} 3.9px)",
        "○": f"radial-gradient(circle at 50% 54%,{b} 0 2.4px,{f} 2.9px 3.6px,{b} 4.1px)",
        "◐": f"radial-gradient(circle at 50% 54%,{f} 0 3.6px,{b} 4.1px) left/50% 100% no-repeat,"
             f"radial-gradient(circle at 50% 54%,{b} 0 2.4px,{f} 2.9px 3.6px,{b} 4.1px)",
    }
    return shapes.get(ch)

def parse(text):
    rows = []
    for line in text.split("\n"):
        st = dict(fg=None, bg=None, bold=False, dim=False, it=False, ul=False, rev=False)
        cells = []
        for tok in re.split(r"(\x1b\[[0-9;:]*m)", line):
            if tok.startswith("\x1b["):
                ps = [int(x) if x.isdigit() else 0 for x in tok[2:-1].replace(":", ";").split(";")] or [0]
                i = 0
                while i < len(ps):
                    p = ps[i]
                    if p == 0: st.update(fg=None, bg=None, bold=False, dim=False, it=False, ul=False, rev=False)
                    elif p == 1: st["bold"] = True
                    elif p == 2: st["dim"] = True
                    elif p == 3: st["it"] = True
                    elif p == 4: st["ul"] = True
                    elif p == 7: st["rev"] = True
                    elif p == 22: st["bold"] = st["dim"] = False
                    elif p == 23: st["it"] = False
                    elif p == 24: st["ul"] = False
                    elif p == 27: st["rev"] = False
                    elif 30 <= p <= 37: st["fg"] = pal256(p - 30)
                    elif 90 <= p <= 97: st["fg"] = pal256(p - 90 + 8)
                    elif 40 <= p <= 47: st["bg"] = pal256(p - 40)
                    elif 100 <= p <= 107: st["bg"] = pal256(p - 100 + 8)
                    elif p == 39: st["fg"] = None
                    elif p == 49: st["bg"] = None
                    elif p in (38, 48):
                        key = "fg" if p == 38 else "bg"
                        if i + 1 < len(ps) and ps[i + 1] == 5: st[key] = pal256(ps[i + 2]); i += 2
                        elif i + 1 < len(ps) and ps[i + 1] == 2: st[key] = tuple(ps[i + 2:i + 5]); i += 4
                    i += 1
                continue
            for ch in tok:
                if ch == "\r": continue
                cells.append((ch, dict(st)))
        rows.append(cells)
    return rows

def render(rows, cols, title):
    out = []
    for cells in rows:
        spans, col = [], 0
        for ch, s in cells:
            w = width(ch)
            if w == 0: continue
            fg, bg = s["fg"] or DEF_FG, s["bg"] or DEF_BG
            if s["rev"]: fg, bg = bg, fg
            if s["dim"]: fg = tuple(int(c * 0.6 + b * 0.4) for c, b in zip(fg, bg))
            shape = block(ch, fg, bg)
            style = [f"width:{w * CW}px"]
            if shape:
                style.append(f"background:{shape}"); txt = ""
            else:
                style.append(f"background:{css(bg)};color:{css(fg)}")
                if s["bold"]: style.append("font-weight:700")
                if s["it"]: style.append("font-style:italic")
                if s["ul"]: style.append("text-decoration:underline")
                # symbols (●○◐✓⠿❯⎿ …) from Menlo: web fonts draw some of them two cells wide
                # 기호는 Menlo 로: 웹 글꼴은 일부 기호를 두 칸 폭으로 그려 반쪽만 보인다
                if ord(ch) > 127 and w == 1 and not ("\uac00" <= ch <= "\ud7a3"):
                    style.append('font-family:Menlo,"Apple Symbols",monospace')
                if "\uac00" <= ch <= "\ud7a3" or "\u3131" <= ch <= "\u318e":
                    # Hangul fills its two cells like in a terminal / 한글이 두 칸을 채우도록
                    style.append("font-size:17px;text-align:center;letter-spacing:0")
                txt = html.escape(ch) if ch != " " else "&nbsp;"
            spans.append(f'<span style="{";".join(style)}">{txt}</span>')
            col += w
        if col < cols:
            spans.append(f'<span style="width:{(cols - col) * CW}px;background:{css(DEF_BG)}"></span>')
        out.append('<div class="r">' + "".join(spans) + "</div>")
    W = cols * CW
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>hivemux</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Nanum+Gothic+Coding:wght@400;700&family=Inter:wght@600&display=swap">
<style>
html,body{{margin:0;background:#0e1013}}
body{{padding:32px}}
.win{{width:{W + 16}px;border-radius:12px;overflow:hidden;border:1px solid #3a3d44;box-shadow:0 24px 70px rgba(0,0,0,.55);background:{css(DEF_BG)}}}
.bar{{height:34px;display:flex;align-items:center;gap:8px;padding:0 14px;background:#202227;font:600 13px Inter,system-ui,sans-serif;color:#b8bcc4}}
.bar i{{width:12px;height:12px;border-radius:50%;display:inline-block}}
.bar b{{margin-left:14px;font-weight:600}}
.term{{padding:6px 8px 8px;font:{FS}px/{LH}px "JetBrains Mono","Nanum Gothic Coding",monospace}}
.r{{display:flex;height:{LH}px;white-space:pre}}
.r span{{display:inline-block;height:{LH}px;overflow:visible;flex:none}}
</style></head><body><div class="win">
<div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><b>{html.escape(title)}</b></div>
<div class="term">{"".join(out)}</div></div></body></html>'''

if __name__ == "__main__":
    src, dst, title = sys.argv[1], sys.argv[2], sys.argv[3]
    text = open(src, encoding="utf-8", errors="replace").read().rstrip("\n")
    rows = parse(text)
    cols = max(sum(width(c) for c, _ in r) for r in rows)
    open(dst, "w").write(render(rows, cols, title))
    print(f"{len(rows)} rows x {cols} cols -> {dst}  ({cols * CW + 16 + 64} x {len(rows) * LH + 14 + 34 + 64} px)")
