import type { SurfaceType, DirtType } from './types'
import { getSurface } from './surfaces'
import { getDirt } from './dirt'
import { eraseSegment } from './brush'
import { ParticleSystem } from './particles'
import { ProgressSampler } from './progress'
import type { SoundEngine } from '../audio/sound'

export interface WashEngineOptions {
  container: HTMLElement
  surface: SurfaceType
  dirt: DirtType[]
  seed: number
  sound: SoundEngine
  /** Completion threshold 0..1. Omit for zen mode (never "completes"). */
  targetPercent?: number
  /** Brush radius in CSS px. Defaults to a fraction of the surface size. */
  brushRadius?: number
  density?: number
  onProgress?: (pct: number) => void
  onComplete?: () => void
}

const PROGRESS_INTERVAL_MS = 120

/**
 * Owns three stacked canvases (clean → dirt → fx), the render loop, pointer
 * input, erasing, particles, progress sampling and spray sound. Coordinates
 * are CSS px throughout; each context is scaled by devicePixelRatio so the
 * backing store stays crisp on hi-dpi displays.
 */
export class WashEngine {
  private opts: WashEngineOptions
  private clean: HTMLCanvasElement
  private dirt: HTMLCanvasElement
  private fx: HTMLCanvasElement
  private cleanCtx: CanvasRenderingContext2D
  private dirtCtx: CanvasRenderingContext2D
  private fxCtx: CanvasRenderingContext2D

  private particles = new ParticleSystem()
  private sampler = new ProgressSampler()
  private resizeObs: ResizeObserver

  private cssW = 0
  private cssH = 0
  private dpr = 1
  private brushRadius = 30

  private raf = 0
  private lastTs = 0
  private sinceSample = 0
  private cleanedPct = 0
  private completed = false

  private spraying = false
  private px = 0
  private py = 0
  private lastPx = 0
  private lastPy = 0

  constructor(opts: WashEngineOptions) {
    this.opts = opts
    const mk = () => {
      const c = document.createElement('canvas')
      c.style.position = 'absolute'
      c.style.inset = '0'
      c.style.width = '100%'
      c.style.height = '100%'
      return c
    }
    this.clean = mk()
    this.dirt = mk()
    this.fx = mk()
    this.fx.style.touchAction = 'none'
    this.fx.style.cursor = 'crosshair'
    // Only the top canvas receives pointer events.
    this.clean.style.pointerEvents = 'none'
    this.dirt.style.pointerEvents = 'none'

    opts.container.style.position = 'relative'
    opts.container.appendChild(this.clean)
    opts.container.appendChild(this.dirt)
    opts.container.appendChild(this.fx)

    this.cleanCtx = this.clean.getContext('2d')!
    this.dirtCtx = this.dirt.getContext('2d')!
    this.fxCtx = this.fx.getContext('2d')!

    this.fx.addEventListener('pointerdown', this.onDown)
    this.fx.addEventListener('pointermove', this.onMove)
    this.fx.addEventListener('pointerup', this.onUp)
    this.fx.addEventListener('pointercancel', this.onUp)
    this.fx.addEventListener('pointerleave', this.onUp)

    this.resizeObs = new ResizeObserver(() => this.handleResize())
    this.resizeObs.observe(opts.container)

    this.build()
    this.raf = requestAnimationFrame(this.tick)
  }

  // --- sizing + generation ---

  private build(): void {
    const rect = this.opts.container.getBoundingClientRect()
    this.cssW = Math.max(1, Math.round(rect.width))
    this.cssH = Math.max(1, Math.round(rect.height))
    this.dpr = window.devicePixelRatio || 1
    this.brushRadius =
      this.opts.brushRadius ?? Math.max(26, Math.min(this.cssW, this.cssH) * 0.085)

    for (const [c, ctx] of [
      [this.clean, this.cleanCtx],
      [this.dirt, this.dirtCtx],
      [this.fx, this.fxCtx],
    ] as const) {
      c.width = Math.round(this.cssW * this.dpr)
      c.height = Math.round(this.cssH * this.dpr)
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    }

    getSurface(this.opts.surface)(this.cleanCtx, this.cssW, this.cssH, this.opts.seed)
    this.paintDirt()
  }

  private paintDirt(): void {
    this.dirtCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.dirtCtx.clearRect(0, 0, this.cssW, this.cssH)
    this.opts.dirt.forEach((type, i) => {
      getDirt(type)(this.dirtCtx, this.cssW, this.cssH, this.opts.seed + i * 101, {
        density: this.opts.density,
      })
    })
    this.sampler.setBaseline(this.dirt)
    this.cleanedPct = 0
    this.completed = false
    this.opts.onProgress?.(0)
  }

  private handleResize(): void {
    const rect = this.opts.container.getBoundingClientRect()
    if (
      Math.round(rect.width) === this.cssW &&
      Math.round(rect.height) === this.cssH
    ) {
      return
    }
    // Regenerate at the new size (progress resets — acceptable trade-off).
    this.particles.clear()
    this.build()
  }

  // --- pointer ---

  private toLocal(e: PointerEvent): [number, number] {
    const rect = this.fx.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  private onDown = (e: PointerEvent): void => {
    e.preventDefault()
    this.fx.setPointerCapture(e.pointerId)
    ;[this.px, this.py] = this.toLocal(e)
    this.lastPx = this.px
    this.lastPy = this.py
    this.spraying = true
    this.opts.sound.startSpray()
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.spraying) return
    ;[this.px, this.py] = this.toLocal(e)
  }

  private onUp = (e: PointerEvent): void => {
    if (!this.spraying) return
    this.spraying = false
    try {
      this.fx.releasePointerCapture(e.pointerId)
    } catch {
      /* pointer may already be released */
    }
    this.opts.sound.stopSpray()
  }

  // --- loop ---

  private tick = (ts: number): void => {
    const dt = this.lastTs ? Math.min(0.05, (ts - this.lastTs) / 1000) : 0
    this.lastTs = ts

    if (this.spraying) {
      // Erase the stroke since the last frame (interpolated inside).
      eraseSegment(
        this.dirtCtx,
        this.lastPx,
        this.lastPy,
        this.px,
        this.py,
        this.brushRadius,
      )

      // Spray particles fly out along the direction of motion (or down if still).
      let dx = this.px - this.lastPx
      let dy = this.py - this.lastPy
      if (Math.hypot(dx, dy) < 0.5) {
        dx = 0
        dy = 1
      }
      this.particles.spray(this.px, this.py, dx, dy)

      // Grime runoff, proportional to how much dirt is still there.
      if (Math.random() < (1 - this.cleanedPct) * 0.5) {
        this.particles.runoff(this.px, this.py)
      }

      this.lastPx = this.px
      this.lastPy = this.py
    }

    this.particles.update(dt)
    this.fxCtx.clearRect(0, 0, this.cssW, this.cssH)
    this.particles.render(this.fxCtx)

    // Throttled progress sampling.
    this.sinceSample += dt * 1000
    if (this.sinceSample >= PROGRESS_INTERVAL_MS) {
      this.sinceSample = 0
      const pct = this.sampler.cleaned(this.dirt)
      if (pct !== this.cleanedPct) {
        this.cleanedPct = pct
        this.opts.onProgress?.(pct)
      }
      if (
        !this.completed &&
        this.opts.targetPercent !== undefined &&
        pct >= this.opts.targetPercent
      ) {
        this.completed = true
        this.opts.sound.chime()
        this.opts.onComplete?.()
      }
    }

    this.raf = requestAnimationFrame(this.tick)
  }

  // --- public controls ---

  setBrushRadius(r: number): void {
    this.brushRadius = r
  }

  /** Re-dirty the surface with the same seed and start over. */
  reset(): void {
    this.particles.clear()
    this.paintDirt()
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    this.resizeObs.disconnect()
    this.fx.removeEventListener('pointerdown', this.onDown)
    this.fx.removeEventListener('pointermove', this.onMove)
    this.fx.removeEventListener('pointerup', this.onUp)
    this.fx.removeEventListener('pointercancel', this.onUp)
    this.fx.removeEventListener('pointerleave', this.onUp)
    this.opts.sound.stopSpray()
    this.clean.remove()
    this.dirt.remove()
    this.fx.remove()
  }
}
