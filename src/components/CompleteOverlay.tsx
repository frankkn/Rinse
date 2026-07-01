interface CompleteOverlayProps {
  timeMs: number
  isBest: boolean
  hasNext: boolean
  onNext: () => void
  onReplay: () => void
  onExit: () => void
}

function fmt(ms: number): string {
  const s = ms / 1000
  return s < 60
    ? `${s.toFixed(1)}s`
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function CompleteOverlay({
  timeMs,
  isBest,
  hasNext,
  onNext,
  onReplay,
  onExit,
}: CompleteOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/55 backdrop-blur-sm">
      <div className="animate-pop text-center">
        <div className="text-4xl font-bold">✨ 乾淨溜溜 ✨</div>
        <div className="mt-2 text-white/80">
          用時 {fmt(timeMs)}
          {isBest && <span className="ml-2 text-sky-300">🏆 最佳紀錄！</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasNext ? (
          <button
            onClick={onNext}
            className="rounded-full bg-sky-400 px-6 py-2.5 font-semibold text-sky-950 hover:bg-sky-300 active:scale-95"
          >
            下一關 →
          </button>
        ) : (
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
            🎉 全部關卡完成！
          </span>
        )}
        <button
          onClick={onReplay}
          className="rounded-full bg-white/10 px-5 py-2.5 hover:bg-white/20 active:scale-95"
        >
          再玩一次
        </button>
        <button
          onClick={onExit}
          className="rounded-full bg-white/10 px-5 py-2.5 hover:bg-white/20 active:scale-95"
        >
          選關
        </button>
      </div>
    </div>
  )
}
