export type Reading = {
  tokens: number
  window: number
  fiveHour?: number
  week?: number
  weekResets?: string
}

export type Pane = {
  role: string
  diet: string
  lang: string
}

declare module 'claude-code' {
  interface PluginState {
    hivemux: { reading: Reading | null; pane: Pane | null }
  }
}
