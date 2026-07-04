import type { SurfaceType, DirtType, ToughTier } from './types'
import { getSurface } from './surfaces'
import { getDirt } from './dirt'
import { eraseSegment } from './brush'
import { ParticleSystem } from './particles'
import { ProgressSampler } from './progress'
import { ToughDirtSystem } from './toughDirt'
import type { SoundEngine } from '../audio/sound'
import { reducedMotion } from '../lib/motion'

export type ToolMode = 'water' | 'soap'

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
  /** Tough-stain tiers to generate. Omit for levels 1–4 and basic zen. */
  tiers?: ToughTier[]
  onProgress?: (pct: number) => void
  onComplete?: () => void
}

const PROGRESS_INTERVAL_MS = 120

/**
 * Owns four stacked canvases (clean → dirt → tough → fx), the render loop,
 * pointer input, erasing, tough-stain tracking, particles, progress sampling
 * and spray sound. Coordinates are CSS px throughout; each context is scaled
 * by devicePixelRatio so the backing store stays crisp on hi-dpi displays.
 */
export class WashEngine {
  private opts: WashEngineOptions
  private clean: HTMLCanvasElement
  private dirt: HTMLCanvasElement
  private tough: HTMLCanvasElement   // stubborn / chemical stain layer
  private fx: HTMLCanvasElement
  private cleanCtx: CanvasRenderingContext2D
  private dirtCtx: CanvasRenderingContext2D
  private toughCtx: CanvasRenderingContext2D
  private fxCtx: CanvasRenderingContext2D

  private particles = new ParticleSystem()
  private sampler = new ProgressSampler()
  private toughDirt: ToughDirtSystem | null = null
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

  private dirtSnapshot: HTMLCanvasElement | null = null
  private flash = 0
  private sprayActivity = 0
  private activityTarget = 0
  private ringAccum = 0

  private spraying = false
  private px = 0
  private py = 0
  private lastPx = 0
  private lastPy = 0

  private tool: ToolMode = 'water'

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
    this.tough = mk()
    this.fx = mk()
    this.fx.style.touchAction = 'none'
    this.fx.style.cursor = 'crosshair'
    this.clean.style.pointerEvents = 'none'
    this.dirt.style.pointerEvents = 'none'
    this.tough.style.pointerEvents = 'none'

    opts.container.style.position = 'relative'
    opts.container.appendChild(this.clean)
    opts.container.appendChild(this.dirt)
    opts.container.appendChild(this.tough)
    opts.container.appendChild(this.fx)

    this.cleanCtx = this.clean.getContext('2d')!
    this.dirtCtx  = this.dirt.getContext('2d')!
    this.toughCtx = this.tough.getContext('2d')!
    this.fxCtx    = this.fx.getContext('2d')!

    this.fx.addEventListener('pointerdown',  this.onDown)
    this.fx.addEventListener('pointermove',  this.onMove)
    this.fx.addEventListener('pointerup',    this.onUp)
    this.fx.addEventListener('pointercancel',this.onUp)
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
    this.dpr  = window.devicePixelRatio || 1
    this.brushRadius =
      this.opts.brushRadius ?? Math.max(26, Math.min(this.cssW, this.cssH) * 0.085)

    for (const [c, ctx] of [
      [this.clean, this.cleanCtx],
      [this.dirt,  this.dirtCtx],
      [this.tough, this.toughCtx],
      [this.fx,    this.fxCtx],
    ] as const) {
      c.width  = Math.round(this.cssW * this.dpr)
      c.height = Math.round(this.cssH * this.dpr)
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    }

    getSurface(this.opts.surface)(this.cleanCtx, this.cssW, this.cssH, this.opts.seed)
    this.paintDirt()
  }

  private paintDirt(): void {
    this.dirtCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.dirtCtx.clearRect(0, 0, this.cssW, this.cssH)

    // Base coat so dirt is visible on any photo texture.
    const baseAlpha = 0.38 + (this.opts.density ?? 0.85) * 0.22
    this.dirtCtx.fillStyle = `rgba(36, 27, 16, ${baseAlpha})`
    this.dirtCtx.fillRect(0, 0, this.cssW, this.cssH)

    this.opts.dirt.forEach((type, i) => {
      getDirt(type)(this.dirtCtx, this.cssW, this.cssH, this.opts.seed + i * 101, {
        density: this.opts.density,
      })
    })

    // Tough-stain system
    const tiers = this.opts.tiers
    if (tiers?.length) {
      if (!this.toughDirt) {
        this.toughDirt = new ToughDirtSystem(this.cssW, this.cssH, this.opts.seed, tiers)
      } else {
        this.toughDirt.reset()
      }
      this.redrawTough(0)
    }

    this.sampler.setBaseline(this.dirt)
    this.snapshotDirt()
    this.cleanedPct = 0
    this.completed  = false
    this.flash      = 0
    this.sprayActivity = 0
    this.opts.onProgress?.(0)
  }

  private snapshotDirt(): void {
    const snap = this.dirtSnapshot ?? document.createElement('canvas')
    snap.width  = this.dirt.width
    snap.height = this.dirt.height
    const ctx = snap.getContext('2d')!
    ctx.clearRect(0, 0, snap.width, snap.height)
    ctx.drawImage(this.dirt,  0, 0)
    ctx.drawImage(this.tough, 0, 0) // include tough blobs in before/after flash
    this.dirtSnapshot = snap
  }

  private redrawTough(ts: number): void {
    this.toughCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.toughCtx.clearRect(0, 0, this.cssW, this.cssH)
    this.toughDirt?.render(this.toughCtx, ts)
  }

  private computeProgress(): number {
    const normalPct = this.sampler.cleaned(this.dirt)
    if (!this.toughDirt) return normalPct
    const tw = this.toughDirt.weight
    return normalPct * (1 - tw) + this.toughDirt.cleanedFraction() * tw
  }

  private handleResize(): void {
    const rect = this.opts.container.getBoundingClientRect()
    if (
      Math.round(rect.width)  === this.cssW &&
      Math.round(rect.height) === this.cssH
    ) return
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

    if (this.tool === 'soap') {
      this.toughDirt?.applySoap(this.px, this.py, this.brushRadius * 1.8)
      this.redrawTough(this.lastTs)
      try { this.fx.releasePointerCapture(e.pointerId) } catch { /* ok */ }
      return
    }

    this.spraying = true
    this.activityTarget = 0.5
    this.opts.sound.startSpray()
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.spraying) return
    ;[this.px, this.py] = this.toLocal(e)
  }

  private onUp = (e: PointerEvent): void => {
    if (!this.spraying) return
    this.spraying = false
    try { this.fx.releasePointerCapture(e.pointerId) } catch { /* ok */ }
    this.opts.sound.stopSpray()
  }

  // --- loop ---

  private tick = (ts: number): void => {
    const dt = this.lastTs ? Math.min(0.05, (ts - this.lastTs) / 1000) : 0
    this.lastTs = ts

    if (this.spraying) {
      eraseSegment(
        this.dirtCtx,
        this.lastPx, this.lastPy,
        this.px,     this.py,
        this.brushRadius,
      )

      // Apply water brush to tough-stain layer
      this.toughDirt?.applyBrush(this.px, this.py, this.brushRadius, ts)

      let dx = this.px - this.lastPx
      let dy = this.py - this.lastPy
      if (Math.hypot(dx, dy) < 0.5) { dx = 0; dy = 1 }
      this.particles.spray(this.px, this.py, dx, dy)

      if (Math.random() < (1 - this.cleanedPct) * 0.5)
        this.particles.runoff(this.px, this.py)

      this.ringAccum += dt
      if (this.ringAccum >= 0.07) {
        this.ringAccum = 0
        this.particles.impact(this.px, this.py, this.brushRadius)
      }

      this.sprayActivity +=
        (this.activityTarget - this.sprayActivity) * Math.min(1, dt * 6)
      this.opts.sound.setIntensity(this.sprayActivity)

      this.lastPx = this.px
      this.lastPy = this.py
    } else {
      this.activityTarget = 0
      this.sprayActivity  = 0
    }

    // Redraw tough dirt every frame (foam bubble animation)
    if (this.toughDirt) this.redrawTough(ts)

    this.particles.update(dt)
    this.fxCtx.clearRect(0, 0, this.cssW, this.cssH)
    this.particles.render(this.fxCtx)

    if (this.flash > 0 && this.dirtSnapshot) {
      this.flash = Math.max(0, this.flash - dt / 0.7)
      this.fxCtx.save()
      this.fxCtx.globalAlpha = this.flash
      this.fxCtx.drawImage(this.dirtSnapshot, 0, 0, this.cssW, this.cssH)
      this.fxCtx.restore()
    }

    this.sinceSample += dt * 1000
    if (this.sinceSample >= PROGRESS_INTERVAL_MS) {
      this.sinceSample = 0
      const pct = this.computeProgress()
      if (pct !== this.cleanedPct) {
        const removed = Math.max(0, pct - this.cleanedPct)
        this.activityTarget = Math.min(1, removed * 60)
        this.cleanedPct = pct
        this.opts.onProgress?.(pct)
      } else {
        this.activityTarget = 0
      }
      if (
        !this.completed &&
        this.opts.targetPercent !== undefined &&
        pct >= this.opts.targetPercent
      ) {
        this.completed = true
        this.flash = reducedMotion() ? 0 : 1
        this.opts.sound.chime()
        this.opts.onComplete?.()
      }
    }

    this.raf = requestAnimationFrame(this.tick)
  }

  // --- public controls ---

  setTool(t: ToolMode): void {
    this.tool = t
    this.fx.style.cursor = t === 'soap' ? 'cell' : 'crosshair'
  }

  get hasChemical(): boolean {
    return this.opts.tiers?.includes('chemical') ?? false
  }

  get hasToughDirt(): boolean {
    return !!this.toughDirt
  }

  setBrushRadius(r: number): void {
    this.brushRadius = r
  }

  reset(): void {
    this.particles.clear()
    this.toughDirt?.reset()
    this.tool = 'water'
    this.fx.style.cursor = 'crosshair'
    this.paintDirt()
  }

  destroy(): void {
    cancelAnimationFrame(this.raf)
    this.resizeObs.disconnect()
    this.fx.removeEventListener('pointerdown',   this.onDown)
    this.fx.removeEventListener('pointermove',   this.onMove)
    this.fx.removeEventListener('pointerup',     this.onUp)
    this.fx.removeEventListener('pointercancel', this.onUp)
    this.fx.removeEventListener('pointerleave',  this.onUp)
    this.opts.sound.stopSpray()
    this.clean.remove()
    this.dirt.remove()
    this.tough.remove()
    this.fx.remove()
  }
}
