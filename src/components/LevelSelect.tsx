import type { Level } from '../data/levels'

interface LevelSelectProps {
  levels: Level[]
  maxUnlocked: number
  bestTimes: Record<number, number>
  onPick: (level: Level) => void
  onBack: () => void
}

function fmt(ms: number): string {
  const s = ms / 1000
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function LevelSelect({
  levels,
  maxUnlocked,
  bestTimes,
  onPick,
  onBack,
}: LevelSelectProps) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          ← 返回
        </button>
        <h2 className="text-xl font-semibold">選擇關卡</h2>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {levels.map((lv) => {
          const locked = lv.id > maxUnlocked
          const best = bestTimes[lv.id]
          return (
            <button
              key={lv.id}
              disabled={locked}
              onClick={() => onPick(lv)}
              className={
                locked
                  ? 'flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-white/5 text-white/30 ring-1 ring-white/10'
                  : 'flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.97]'
              }
            >
              <span className="text-2xl">{locked ? '🔒' : '💦'}</span>
              <span className="px-1 text-center text-sm font-medium leading-tight">
                {locked ? `第 ${lv.id + 1} 關` : lv.name}
              </span>
              {best !== undefined && (
                <span className="text-xs text-sky-300/80">最佳 {fmt(best)}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
