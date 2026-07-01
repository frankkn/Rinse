import type { DirtFn } from '../types'
import { mulberry32 } from '../rng'
import { fbm } from '../noise'

/** Corrosion: orange-brown rust spots that bleed downward in streaks. */
export const rust: DirtFn = (ctx, w, h, seed, opts) => {
  const density = opts?.density ?? 0.85
  const rand = mulberry32(seed ^ 0x7a1c9e33)
  const ns = seed >>> 0
  ctx.save()

  const spots = Math.floor((w * h) / 5200 * density) + 3
  for (let i = 0; i < spots; i++) {
    const x = rand() * w
    const y = rand() * h * 0.7
    const n = fbm(x * 0.008, y * 0.008, ns, 4, 0.55)
    const r = 12 + rand() * 40 * (0.5 + n)

    // Bleed streak below the spot first (so the core sits on top).
    const len = h * (0.1 + rand() * 0.35)
    const sg = ctx.createLinearGradient(x, y, x, y + len)
    sg.addColorStop(0, `rgba(138, 74, 38, ${0.18 * density})`)
    sg.addColorStop(1, 'rgba(138, 74, 38, 0)')
    ctx.fillStyle = sg
    ctx.fillRect(x - r * 0.35, y, r * 0.7, len)

    // Rust core.
    const a = (0.2 + n * 0.3) * density
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(150, 78, 36, ${a})`)
    g.addColorStop(0.6, `rgba(120, 58, 30, ${a * 0.7})`)
    g.addColorStop(1, 'rgba(120, 58, 30, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()

    // Flaky speckle around the core.
    for (let k = 0; k < 10; k++) {
      const a2 = rand() * Math.PI * 2
      const rr = rand() * r
      ctx.fillStyle = `rgba(92, 44, 22, ${0.15 + rand() * 0.25})`
      ctx.beginPath()
      ctx.arc(x + Math.cos(a2) * rr, y + Math.sin(a2) * rr, 0.6 + rand() * 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}
