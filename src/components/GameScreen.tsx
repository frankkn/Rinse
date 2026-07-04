import { useRef, useState } from 'react'
import { useWashEngine } from '../hooks/useWashEngine'
import type { PlayConfig } from '../play'
import type { ToolMode } from '../engine/WashEngine'
import { Hud } from './Hud'
import { CompleteOverlay } from './CompleteOverlay'

interface GameScreenProps {
  config: PlayConfig
  muted: boolean
  onToggleMute: () => void
  onExit: () => void
  /** Level mode only: */
  bestMs?: number
  hasNext?: boolean
  onComplete?: (timeMs: number) => void
  onNext?: () => void
  /** Zen mode only: */
  onNewSurface?: () => void
}

export function GameScreen(props: GameScreenProps) {
  const { config } = props
  const isLevel = config.mode === 'level'

  const surface = isLevel ? config.level.surface : config.surface
  const dirt    = isLevel ? config.level.dirt    : config.dirt
  const seed    = isLevel ? config.level.seed    : config.seed
  const density = isLevel ? config.level.density : config.density
  const target  = isLevel ? config.level.target  : undefined
  const title   = isLevel ? config.level.name    : '禪模式 · 自由洗'
  const tiers   = isLevel ? config.level.tiers   : config.mode === 'zen' ? config.tiers : undefined

  const hasChemical  = tiers?.includes('chemical') ?? false

  const [progress,  setProgress]  = useState(0)
  const [completed, setCompleted] = useState(false)
  const [timeMs,    setTimeMs]    = useState(0)
  const [tool,      setToolState] = useState<ToolMode>('water')
  const startRef = useRef<number | null>(null)

  const wash = useWashEngine({
    surface, dirt, seed, density,
    targetPercent: target,
    tiers,
    onProgress: (p) => {
      if (startRef.current === null && p > 0) startRef.current = performance.now()
      setProgress(p)
    },
    onComplete: () => {
      const t = startRef.current ? performance.now() - startRef.current : 0
      setTimeMs(t)
      setCompleted(true)
      if (isLevel) props.onComplete?.(t)
    },
  })

  const pct    = Math.round(progress * 100)
  const isBest = props.bestMs === undefined || timeMs < props.bestMs

  const handleSetTool = (t: ToolMode) => {
    setToolState(t)
    wash.setTool(t)
  }

  const replay = () => {
    setProgress(0)
    setCompleted(false)
    setTimeMs(0)
    setToolState('water')
    startRef.current = null
    wash.reset()
  }

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6">
      <Hud
        title={title}
        muted={props.muted}
        onExit={props.onExit}
        onToggleMute={props.onToggleMute}
      />

      <div className="relative">
        <div
          ref={wash.containerRef}
          data-testid="wash-surface"
          className="wash-surface aspect-[3/2] w-full overflow-hidden rounded-2xl bg-black/40 shadow-2xl ring-1 ring-white/10"
        />

        {progress === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/50 px-4 py-2 text-sm text-white/90 backdrop-blur">
              按住拖曳，把它沖乾淨 💦
            </span>
          </div>
        )}

        {completed && isLevel && (
          <CompleteOverlay
            timeMs={timeMs}
            isBest={isBest}
            hasNext={!!props.hasNext}
            onNext={() => props.onNext?.()}
            onReplay={replay}
            onExit={props.onExit}
          />
        )}

        {/* Tool panel — right side, only when chemical stains are present */}
        {hasChemical && (
          <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
            <button
              onClick={() => handleSetTool('water')}
              title="水管"
              className={`rounded-xl p-2.5 text-xl shadow transition active:scale-95 ${
                tool === 'water'
                  ? 'bg-sky-400/85 ring-2 ring-sky-300'
                  : 'bg-black/50 hover:bg-white/15'
              }`}
            >
              🚿
            </button>
            <button
              onClick={() => handleSetTool('soap')}
              title="洗劑（點一下噴一塊）"
              className={`rounded-xl p-2.5 text-xl shadow transition active:scale-95 ${
                tool === 'soap'
                  ? 'bg-green-400/85 ring-2 ring-green-300'
                  : 'bg-black/50 hover:bg-white/15'
              }`}
            >
              🧴
            </button>
          </div>
        )}
      </div>

      {/* Progress row */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="h-2.5 min-w-40 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          data-testid="progress"
          className="w-12 text-right text-sm tabular-nums text-white/80"
        >
          {pct}%
        </span>
        <button
          onClick={replay}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20"
        >
          重來
        </button>
        {!isLevel && (
          <button
            onClick={() => props.onNewSurface?.()}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20"
          >
            換一片
          </button>
        )}
      </div>

      {!isLevel && pct >= 99 && (
        <p className="text-center text-sm text-sky-300/80">
          ✨ 洗乾淨了！要不要「換一片」？
        </p>
      )}

      {/* Legend for tough stains */}
      {tiers?.length && (
        <div className="flex flex-wrap justify-center gap-4 text-xs text-white/50">
          {tiers.includes('stubborn') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500/80" />
              頑強污漬（刷 3 次）
            </span>
          )}
          {tiers.includes('chemical') && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-lime-500/80" />
              化學污漬（🧴 噴劑後沖水）
            </span>
          )}
        </div>
      )}
    </div>
  )
}
