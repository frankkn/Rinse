// Tough-stain layer rendered on its own canvas above the normal dirt.
// Two tiers:
//   'stubborn' — orange-brown, needs 3 water-brush passes to clear
//   'chemical' — yellow-green, needs 3 passes OR detergent + 1 rinse pass
//
// Blobs are generated deterministically from seed so every replay looks
// the same. A per-blob cooldown prevents one fast swipe from clearing
// a blob in a single frame.

import { mulberry32 } from './rng'
import type { ToughTier } from './types'

interface ToughBlob {
  x: number
  y: number
  radius: number
  type: ToughTier
  stage: number       // 0 = fully dirty … MAX_STAGE = cleaned
  lastBrushed: number // rAF timestamp; throttles stage increments
  hasSoap: boolean
}

const MAX_STAGE = 3
const COOLDOWN_MS = 380

export class ToughDirtSystem {
  private blobs: ToughBlob[] = []
  /** Fraction of combined progress this system contributes (0..1). */
  readonly weight: number

  constructor(w: number, h: number, seed: number, tiers: ToughTier[]) {
    const rand = mulberry32(seed ^ 0xc0ffee42)
    const hasS = tiers.includes('stubborn')
    const hasC = tiers.includes('chemical')

    if (hasS) {
      const n = 4 + Math.floor(rand() * 4) // 4–7
      for (let i = 0; i < n; i++) {
        this.blobs.push({
          x: (0.08 + rand() * 0.84) * w,
          y: (0.08 + rand() * 0.84) * h,
          radius: 28 + rand() * 34,
          type: 'stubborn',
          stage: 0,
          lastBrushed: -Infinity,
          hasSoap: false,
        })
      }
    }

    if (hasC) {
      const n = 2 + Math.floor(rand() * 3) // 2–4
      for (let i = 0; i < n; i++) {
        this.blobs.push({
          x: (0.08 + rand() * 0.84) * w,
          y: (0.08 + rand() * 0.84) * h,
          radius: 34 + rand() * 30,
          type: 'chemical',
          stage: 0,
          lastBrushed: -Infinity,
          hasSoap: false,
        })
      }
    }

    this.weight = (hasS ? 0.12 : 0) + (hasC ? 0.10 : 0)
  }

  /** Water-brush pass at (x,y). Returns true if any blob advanced a stage. */
  applyBrush(x: number, y: number, radius: number, now: number): boolean {
    let changed = false
    for (const b of this.blobs) {
      if (b.stage >= MAX_STAGE) continue
      if (b.type === 'chemical' && !b.hasSoap) continue  // must apply soap first
      if (Math.hypot(x - b.x, y - b.y) > radius + b.radius * 0.6) continue
      if (now - b.lastBrushed < COOLDOWN_MS) continue
      b.stage = b.hasSoap ? MAX_STAGE : b.stage + 1
      b.lastBrushed = now
      changed = true
    }
    return changed
  }

  /** Detergent tap: mark chemical blobs within radius as soaped. */
  applySoap(x: number, y: number, radius: number): boolean {
    let changed = false
    for (const b of this.blobs) {
      if (b.type !== 'chemical' || b.stage >= MAX_STAGE || b.hasSoap) continue
      if (Math.hypot(x - b.x, y - b.y) < radius + b.radius * 0.7) {
        b.hasSoap = true
        changed = true
      }
    }
    return changed
  }

  /** 0 = all dirty, 1 = all cleaned. */
  cleanedFraction(): number {
    if (!this.blobs.length) return 1
    return (
      this.blobs.reduce((s, b) => s + b.stage, 0) /
      (this.blobs.length * MAX_STAGE)
    )
  }

  /** Draw current blob state onto ctx (CSS-px coordinate space). */
  render(ctx: CanvasRenderingContext2D, ts: number): void {
    for (const b of this.blobs) {
      if (b.stage >= MAX_STAGE) continue
      const t = (MAX_STAGE - b.stage) / MAX_STAGE // 1 → dirty, →0 clean
      const alpha = t * 0.84

      if (b.type === 'stubborn') {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius)
        g.addColorStop(0,    `rgba(192, 96, 28, ${alpha})`)
        g.addColorStop(0.65, `rgba(172, 78, 22, ${alpha * 0.85})`)
        g.addColorStop(1,    'rgba(162, 70, 20, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Chemical stain
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius)
        g.addColorStop(0,    `rgba(118, 162, 32, ${alpha})`)
        g.addColorStop(0.65, `rgba(96, 138, 26, ${alpha * 0.85})`)
        g.addColorStop(1,    'rgba(86, 126, 24, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fill()

        if (b.hasSoap) this.renderFoam(ctx, b.x, b.y, b.radius, ts)
      }
    }
  }

  private renderFoam(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, r: number,
    ts: number,
  ): void {
    // Soft white glow
    const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.12)
    fg.addColorStop(0,   'rgba(255,255,255,0.86)')
    fg.addColorStop(0.55,'rgba(240,248,255,0.60)')
    fg.addColorStop(1,   'rgba(220,240,255,0)')
    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.arc(cx, cy, r * 1.12, 0, Math.PI * 2)
    ctx.fill()

    // Animated bubble ring
    const wobble = ts * 0.0008
    const count = 14
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + wobble
      const dist = r * (0.15 + (i % 4) * 0.17)
      const bx = cx + Math.cos(angle) * dist
      const by = cy + Math.sin(angle) * dist
      const br = 2.5 + (i % 3) * 1.5
      ctx.beginPath()
      ctx.arc(bx, by, br, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${0.68 + (i % 2) * 0.22})`
      ctx.fill()
      ctx.strokeStyle = 'rgba(200,230,255,0.45)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  }

  reset(): void {
    for (const b of this.blobs) {
      b.stage = 0
      b.lastBrushed = -Infinity
      b.hasSoap = false
    }
  }
}
