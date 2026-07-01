import { useEffect, useRef } from 'react'
import { WashEngine } from '../engine/WashEngine'
import type { SurfaceType, DirtType } from '../engine/types'
import { sound } from '../audio/sound'

export interface UseWashEngineConfig {
  surface: SurfaceType
  dirt: DirtType[]
  seed: number
  targetPercent?: number
  density?: number
  onProgress?: (pct: number) => void
  onComplete?: () => void
}

/**
 * Mounts a WashEngine into a container div. The engine is recreated only when
 * the surface/dirt/seed/target actually change — callbacks are read through
 * refs so re-renders don't tear it down mid-wash.
 */
export function useWashEngine(config: UseWashEngineConfig) {
  const { surface, dirt, seed, targetPercent, density } = config
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<WashEngine | null>(null)

  const onProgress = useRef(config.onProgress)
  const onComplete = useRef(config.onComplete)
  onProgress.current = config.onProgress
  onComplete.current = config.onComplete

  const dirtKey = dirt.join(',')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const engine = new WashEngine({
      container,
      surface,
      dirt,
      seed,
      targetPercent,
      density,
      sound,
      onProgress: (p) => onProgress.current?.(p),
      onComplete: () => onComplete.current?.(),
    })
    engineRef.current = engine

    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // dirt is captured via dirtKey; other primitives are listed directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, dirtKey, seed, targetPercent, density])

  return {
    containerRef,
    reset: () => engineRef.current?.reset(),
    setBrushRadius: (r: number) => engineRef.current?.setBrushRadius(r),
  }
}
