import type { SurfaceFn } from '../types'
import { mulberry32 } from '../rng'

/** Clean brushed-metal panel: cool grey with fine horizontal brush lines
 *  and a row of rivets. */
export const metal: SurfaceFn = (ctx, w, h, seed) => {
  const rand = mulberry32(seed)

  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#b9c0c7')
  g.addColorStop(0.5, '#9aa2ab')
  g.addColorStop(1, '#aab1b8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Brushed texture: many faint horizontal lines.
  for (let i = 0; i < h * 1.2; i++) {
    const y = rand() * h
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + rand() * 0.05})`
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y + (rand() - 0.5) * 2)
    ctx.stroke()
  }

  // Rivets around the border.
  const drawRivet = (x: number, y: number) => {
    const rg = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, 5)
    rg.addColorStop(0, '#e7ebee')
    rg.addColorStop(1, '#6f767d')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  const margin = Math.min(w, h) * 0.08
  const cols = 6
  for (let i = 0; i <= cols; i++) {
    const x = margin + (i * (w - 2 * margin)) / cols
    drawRivet(x, margin)
    drawRivet(x, h - margin)
  }
}
