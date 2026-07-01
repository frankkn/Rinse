import type { SurfaceFn } from '../types'
import { mulberry32 } from '../rng'
import { fbm } from '../noise'

/** Clean concrete driveway: speckled grey aggregate with expansion joints. */
export const concrete: SurfaceFn = (ctx, w, h, seed) => {
  const rand = mulberry32(seed)

  // Mottled base via coarse fbm blocks.
  const cell = 8
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const n = fbm(x * 0.01, y * 0.01, seed, 3, 0.6)
      const l = 62 + n * 14
      ctx.fillStyle = `hsl(210 6% ${l}%)`
      ctx.fillRect(x, y, cell + 1, cell + 1)
    }
  }

  // Aggregate speckle.
  const specks = Math.floor((w * h) / 260)
  for (let i = 0; i < specks; i++) {
    const x = rand() * w
    const y = rand() * h
    const dark = rand() < 0.5
    ctx.fillStyle = dark
      ? `rgba(70,72,76,${0.2 + rand() * 0.3})`
      : `rgba(240,240,242,${0.15 + rand() * 0.3})`
    ctx.beginPath()
    ctx.arc(x, y, 0.6 + rand() * 1.6, 0, Math.PI * 2)
    ctx.fill()
  }

  // Expansion joints.
  ctx.strokeStyle = 'rgba(40,42,46,0.45)'
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012)
  const gx = w / 2
  ctx.beginPath()
  ctx.moveTo(gx, 0)
  ctx.lineTo(gx, h)
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()
}
