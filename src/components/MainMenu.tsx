import type { ReactNode } from 'react'

interface MainMenuProps {
  muted: boolean
  onToggleMute: () => void
  onPlayLevels: () => void
  onPlayZen: () => void
  loginSlot?: ReactNode
}

export function MainMenu({
  muted,
  onToggleMute,
  onPlayLevels,
  onPlayZen,
  loginSlot,
}: MainMenuProps) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <div>
        <h1 className="bg-gradient-to-b from-sky-200 to-cyan-400 bg-clip-text text-6xl font-bold tracking-tight text-transparent">
          Rinse
        </h1>
        <p className="mt-2 text-white/60">洗到爽 · 壓力清洗</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          onClick={onPlayLevels}
          className="rounded-2xl bg-sky-400 px-6 py-4 text-lg font-semibold text-sky-950 shadow-lg transition hover:bg-sky-300 active:scale-[0.98]"
        >
          🧽 關卡模式
        </button>
        <button
          onClick={onPlayZen}
          className="rounded-2xl bg-white/10 px-6 py-4 text-lg font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.98]"
        >
          🌊 禪模式 · 自由洗
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onToggleMute}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20"
        >
          {muted ? '🔇 靜音中' : '🔊 音效開'}
        </button>
        {loginSlot}
      </div>
    </div>
  )
}
