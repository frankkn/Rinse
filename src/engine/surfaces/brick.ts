import type { SurfaceFn } from '../types'
import { mulberry32 } from '../rng'

/** Clean brick wall: offset courses of clay bricks with mortar between. */
export const brick: SurfaceFn = (ctx, w, h, seed) => {
  const rand = mulberry32(seed)

  // Mortar background.
  ctx.fillStyle = '#d8d2c4'
  ctx.fillRect(0, 0, w, h)

  const rows = 7 + Math.floor(rand() * 3)
  const bh = h / rows
  const perRow = 4 + Math.floor(rand() * 2)
  const bw = w / perRow
  const mortar = Math.max(2, bh * 0.12)
  const hue = 12 + rand() * 12 // clay orange-red

  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : -bw / 2
    for (let c = -1; c <= perRow; c++) {
      const x = c * bw + offset + mortar / 2
      const y = r * bh + mortar / 2
      const bwi = bw - mortar
      const bhi = bh - mortar
      const l = 40 + rand() * 16
      const g = ctx.createLinearGradient(x, y, x, y + bhi)
      g.addColorStop(0, `hsl(${hue + rand() * 6} 45% ${l + 6}%)`)
      g.addColorStop(1, `hsl(${hue} 42% ${l - 4}%)`)
      ctx.fillStyle = g
      ctx.fillRect(x, y, bwi, bhi)
      // subtle top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(x, y, bwi, Math.max(1, bhi * 0.14))
    }
  }
}
