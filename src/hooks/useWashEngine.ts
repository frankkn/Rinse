import { useEffect, useRef, useState } from 'react'
import { WashEngine, type ToolMode } from '../engine/WashEngine'
import type { SurfaceType, DirtType, ToughTier } from '../engine/types'
import { preloadSurface } from '../engine/surfaces'
import { sound } from '../audio/sound'

export interface UseWashEngineConfig {
  surface: SurfaceType
  dirt: DirtType[]
  seed: number
  targetPercent?: number
  density?: number
  tiers?: ToughTier[]
  onProgress?: (pct: number) => void
  onComplete?: () => void
}

/**
 * Mounts a WashEngine into a container div. The engine is recreated only when
 * the surface/dirt/seed/target actually change — callbacks are read through
 * refs so re-renders don't tear it down mid-wash.
 */
export function useWashEngine(config: UseWashEngineConfig) {
  const { surface, dirt, seed, targetPercent, density, tiers } = config
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef    = useRef<WashEngine | null>(null)
  const [photoReady, setPhotoReady] = useState(false)

  const onProgress = useRef(config.onProgress)
  const onComplete = useRef(config.onComplete)
  onProgress.current = config.onProgress
  onComplete.current = config.onComplete

  const dirtKey  = dirt.join(',')
  const tiersKey = tiers?.join(',') ?? ''

  // Preload the surface photo before the engine calls getSurface().
  useEffect(() => {
    setPhotoReady(false)
    void preloadSurface(surface, seed).then(() => setPhotoReady(true))
  }, [surface, seed])

  useEffect(() => {
    if (!photoReady) return
    const container = containerRef.current
    if (!container) return

    const engine = new WashEngine({
      container,
      surface,
      dirt,
      seed,
      targetPercent,
      density,
      tiers,
      sound,
      onProgress: (p) => onProgress.current?.(p),
      onComplete: () => onComplete.current?.(),
    })
    engineRef.current = engine

    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, dirtKey, seed, targetPercent, density, tiersKey, photoReady])

  return {
    containerRef,
    reset:          ()               => engineRef.current?.reset(),
    setBrushRadius: (r: number)      => engineRef.current?.setBrushRadius(r),
    setTool:        (t: ToolMode)    => engineRef.current?.setTool(t),
  }
}
