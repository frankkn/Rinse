interface HudProps {
  title: string
  muted: boolean
  onExit: () => void
  onToggleMute: () => void
}

/** Top bar shown above the wash surface: back, level/mode title, mute. */
export function Hud({ title, muted, onExit, onToggleMute }: HudProps) {
  return (
    <header className="flex items-center gap-3">
      <button
        onClick={onExit}
        className="rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
      >
        ← 返回
      </button>
      <h2 className="flex-1 truncate text-lg font-semibold">{title}</h2>
      <button
        onClick={onToggleMute}
        aria-label={muted ? '取消靜音' : '靜音'}
        className="rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </header>
  )
}
