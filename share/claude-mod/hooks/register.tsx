// hivemux inside Claude Code (share/claude-mod, loaded through CLAUDE_CODE_PLUGIN_DIRS, which hivemux setup adds to
// ~/.claude/settings.json). Outside tmux (no TMUX_PANE) it does nothing.
//
// - After each turn the engine's own figures go to the pane: @claude_ctx_live, @claude_ctx_window, @claude_limit_5h,
//   @claude_limit_7d (percent used), @claude_limit_7d_at; and the account's limits to <data>/limits/<account>.tsv,
//   "<week %>\t<week resets>\t<5h %>\t<5h resets>\t<read at>", so the sidebar and the account popup show every
//   account's, also one no Claude runs on now.
// - What hivemux asks of this Claude (bin/hivemux-team type_in) comes as a file, <data>/mod/<pane>.do, read every
//   second: a slash command runs as one ($.command.run), anything else is sent as the person's prompt. Typed into the
//   pane, it clobbered what the person was typing.
// - Above the prompt, a line with the team role, the context, the limits and the diet under way.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Pane, Reading } from '../types'

const reading = atom({ plugin: 'hivemux', key: 'reading' } as const, null)
const pane = atom({ plugin: 'hivemux', key: 'pane' } as const, null)

type Where = { id?: string; account: string; inbox: string; limits: string }

const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)

async function tmux($: EngineInterface, argv: string[]) {
  return $.process.run(['tmux', ...argv]).catch(() => undefined)
}

// the account by its config folder: an added one is ~/.local/share/hivemux/accounts/<name> (bin/hivemux-account)
async function where($: EngineInterface): Promise<Where> {
  // only a Claude drawn in the pane: a claude -p or Agent SDK run there (bin/hivemux-sdk) leaves the pane to it
  // 칸에 그려지는 Claude 만: 거기서 도는 claude -p 나 Agent SDK (bin/hivemux-sdk) 는 칸을 그것에 맡긴다
  const drawn = (await $.session.surfaces()).includes('terminal') && (await $.env.get('HIVEMUX_SDK')) !== '1'
  const id = drawn ? await $.env.get('TMUX_PANE') : undefined
  const dir = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? ''
  const m = /\/hivemux\/accounts\/([^/]+)\/?$/.exec(dir)
  const xdg = await $.env.get('XDG_DATA_HOME')
  const home = (await $.env.get('HOME')) ?? ''
  const data = `${xdg || `${home}/.local/share`}/hivemux`
  const account = m?.[1] ?? 'default'
  return { id, account, inbox: id ? `${data}/mod/${id.replace('%', '')}.do` : '', limits: `${data}/limits/${account}.tsv` }
}

async function measure($: EngineInterface, w: Where, context: SessionContextUsage, limits: SessionRateLimit[]) {
  const five = limits.find(l => l.kind === 'five_hour')
  const week = limits.find(l => l.kind === 'seven_day')
  const r: Reading = {
    tokens: context.tokens ?? 0,
    window: context.window,
    fiveHour: five?.percentUsed,
    week: week?.percentUsed,
    weekResets: week?.resetsAt,
  }
  await update($, reading, () => r)
  if (!w.id) return
  const opts: [string, string | undefined][] = [
    ['@claude_ctx_live', context.tokens === undefined ? undefined : String(context.tokens)],
    ['@claude_ctx_window', String(context.window)],
    ['@claude_limit_5h', five && String(five.percentUsed)],
    ['@claude_limit_7d', week && String(week.percentUsed)],
    ['@claude_limit_7d_at', week?.resetsAt],
  ]
  const argv: string[] = []
  for (const [name, value] of opts) {
    argv.push(...(value === undefined ? ['set', '-pu', '-t', w.id, name] : ['set', '-p', '-t', w.id, name, value]), ';')
  }
  // an API key has no windows: nothing for the account then / API 키에는 한도 창이 없다
  if (five || week) {
    const at = Math.round((await $.clock.now()) / 1000)
    const row = [week?.percentUsed ?? '', week?.resetsAt ?? '', five?.percentUsed ?? '', five?.resetsAt ?? '', at].join('\t')
    await $.fs.write(w.limits, row + '\n').catch(() => undefined)
  }
  await tmux($, argv.slice(0, -1))
}

// what hivemux keeps on the pane: the team role, the diet under way, the language
async function look($: EngineInterface, w: Where) {
  if (!w.id) return
  const out = await tmux($, ['display', '-p', '-t', w.id, '#{@hivemux-rolename}\t#{@hivemux-diet}\t#{@hivemux-lang}'])
  if (!out || out.exitCode !== 0) return
  const [role = '', diet = '', lang = ''] = out.stdout.replace(/\n$/, '').split('\t')
  const p: Pane = { role, diet, lang }
  await update($, pane, () => p)
}

// one request from hivemux: {"text": "..."}; the file goes before it runs, so it never runs twice
async function inbox($: EngineInterface, w: Where) {
  if (!w.inbox || !(await $.fs.exists(w.inbox))) return
  const raw = await $.fs.read(w.inbox).catch(() => '')
  await $.process.run(['rm', '-f', w.inbox]).catch(() => undefined)
  let text = ''
  try {
    text = String((JSON.parse(raw) as { text?: unknown }).text ?? '')
  } catch {
    return
  }
  const cmd = /^\/([\w:.-]+)(?:\s+([\s\S]*))?$/.exec(text.trim())
  if (cmd?.[1]) await $.command.run({ command: cmd[1], args: cmd[2] ?? '' })
  else if (text.trim()) await $.prompt.submit({ text, asUser: true })
}

export const register: Register = on => {
  let w: Where = { account: 'default', inbox: '', limits: '' }
  let busy = false

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    w = await where($)
    if (!w.id) return r
    await $.process.run(['mkdir', '-p', w.limits.replace(/\/[^/]+$/, ''), w.inbox.replace(/\/[^/]+$/, '')]).catch(() => undefined)
    await tmux($, ['set', '-p', '-t', w.id, '@hivemux-mod', '1', ';', 'set', '-p', '-t', w.id, '@hivemux-mod-account', w.account])
    const u = await $.session.usage()
    await measure($, w, u.context, u.rateLimits)
    await look($, w)
    $.clock.every(1000, async () => {
      if (busy) return
      busy = true
      try {
        await inbox($, w)
      } finally {
        busy = false
      }
    })
    return r
  })

  // a /clear ends the session and goes on in this one: the pane keeps the mod
  on('session.end', async ($, e, next) => {
    if (w.id && e.reason !== 'clear') await tmux($, ['set', '-pu', '-t', w.id, '@hivemux-mod'])
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await measure($, w, e.context, e.rateLimits)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await look($, w)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, reading)
    const p = await read($, pane)
    if (!w.id || !r || e.props.hasSurvey) return next(e)
    const ko = (p?.lang || 'ko').startsWith('ko')
    const { Box, Text } = $.ui.resolve(e)
    const pct = r.window ? Math.round((r.tokens / r.window) * 100) : 0
    const diet = p?.diet
      ? ko
        ? { pending: '다이어트 대기', notes: '노트 정리 중', clear: '새로 시작하는 중', after: '새로 시작함', compacting: '줄이는 중' }[p.diet] ?? p.diet
        : { pending: 'diet waiting', notes: 'writing notes', clear: 'starting fresh', after: 'fresh start', compacting: 'compacting' }[p.diet] ?? p.diet
      : ''
    const limit = (label: string, v?: number) =>
      v === undefined ? null : (
        <Text color={v >= 90 ? 'red' : v >= 70 ? 'yellow' : undefined} dimColor={v < 70}>{` · ${label} ${Math.round(v)}%`}</Text>
      )
    return (
      <Box>
        <Text color="yellow">hivemux</Text>
        {p?.role ? <Text>{` · ${p.role}`}</Text> : null}
        <Text dimColor>{` · ${ko ? '컨텍스트' : 'context'} ${k(r.tokens)}/${k(r.window)} (${pct}%)`}</Text>
        {limit(ko ? '5시간' : '5h', r.fiveHour)}
        {limit(ko ? `${w.account === 'default' ? '' : w.account + ' '}주간` : `${w.account === 'default' ? '' : w.account + ' '}week`, r.week)}
        {diet ? <Text color="cyan">{` · ${diet}`}</Text> : null}
      </Box>
    )
  })
}
