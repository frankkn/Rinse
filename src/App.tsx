import { useState } from 'react'
import { useWashEngine } from './hooks/useWashEngine'
import { sound } from './audio/sound'

const TARGET = 0.96

export default function App() {
  const [seed, setSeed] = useState(12345)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [muted, setMuted] = useState(sound.isMuted)

  const wash = useWashEngine({
    surface: 'tiles',
    dirt: ['grime'],
    seed,
    targetPercent: TARGET,
    onProgress: setProgress,
    onComplete: () => setCompleted(true),
  })

  const pct = Math.round(progress * 100)

  const newSurface = () => {
    setProgress(0)
    setCompleted(false)
    setSeed(Math.floor(Math.random() * 1e9))
  }

  const reset = () => {
    setProgress(0)
    setCompleted(false)
    wash.reset()
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    sound.setMuted(next)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4 px-4 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Rinse <span className="text-base text-sky-300/70">洗到爽</span>
        </h1>
        <button
          onClick={toggleMute}
          className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          aria-label={muted ? '取消靜音' : '靜音'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {/* Wash surface */}
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

        {completed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/55 backdrop-blur-sm">
            <div className="text-3xl font-semibold">✨ 乾淨溜溜 ✨</div>
            <button
              onClick={newSurface}
              className="rounded-full bg-sky-400 px-5 py-2 font-medium text-sky-950 hover:bg-sky-300"
            >
              再洗一片
            </button>
          </div>
        )}
      </div>

      {/* HUD */}
      <div className="flex items-center gap-4">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
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
          onClick={reset}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20"
        >
          重置
        </button>
        <button
          onClick={newSurface}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20"
        >
          換一片
        </button>
      </div>
    </div>
  )
}
