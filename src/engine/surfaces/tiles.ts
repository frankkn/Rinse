import type { SurfaceFn } from '../types'
import { mulberry32 } from '../rng'

/** Clean bathroom/kitchen tiles: a grid of glossy tiles with grout lines. */
export const tiles: SurfaceFn = (ctx, w, h, seed) => {
  const rand = mulberry32(seed)

  // Grout background.
  ctx.fillStyle = '#c8c2b6'
  ctx.fillRect(0, 0, w, h)

  const cols = 5 + Math.floor(rand() * 3)
  const tile = w / cols
  const rows = Math.ceil(h / tile) + 1
  const grout = Math.max(2, tile * 0.06)

  // Slight per-run hue so tiles feel varied but always clean.
  const hue = 180 + rand() * 40 // teal → blue
  const light = 78 + rand() * 8

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile + grout / 2
      const y = r * tile + grout / 2
      const s = tile - grout

      // Base tile with a soft diagonal sheen.
      const g = ctx.createLinearGradient(x, y, x + s, y + s)
      const jitter = (rand() - 0.5) * 5
      g.addColorStop(0, `hsl(${hue + jitter} 28% ${light + 6}%)`)
      g.addColorStop(0.5, `hsl(${hue + jitter} 26% ${light}%)`)
      g.addColorStop(1, `hsl(${hue + jitter} 24% ${light - 6}%)`)
      ctx.fillStyle = g
      ctx.fillRect(x, y, s, s)

      // Glossy highlight streak in a corner.
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + s * 0.4, y)
      ctx.lineTo(x, y + s * 0.4)
      ctx.closePath()
      ctx.fill()
    }
  }
}
