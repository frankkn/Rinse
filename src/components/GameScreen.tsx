import { useRef, useState } from 'react'
import { useWashEngine } from '../hooks/useWashEngine'
import type { PlayConfig } from '../play'
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
  const dirt = isLevel ? config.level.dirt : config.dirt
  const seed = isLevel ? config.level.seed : config.seed
  const density = isLevel ? config.level.density : config.density
  const target = isLevel ? config.level.target : undefined
  const title = isLevel ? config.level.name : '禪模式 · 自由洗'

  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [timeMs, setTimeMs] = useState(0)
  const startRef = useRef<number | null>(null)

  const wash = useWashEngine({
    surface,
    dirt,
    seed,
    density,
    targetPercent: target,
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

  const pct = Math.round(progress * 100)
  const isBest = props.bestMs === undefined || timeMs < props.bestMs

  const replay = () => {
    setProgress(0)
    setCompleted(false)
    setTimeMs(0)
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
    </div>
  )
}
