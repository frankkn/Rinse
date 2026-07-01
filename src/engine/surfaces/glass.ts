import type { SurfaceFn } from '../types'
import { mulberry32 } from '../rng'

/** Clean window: a pleasant view behind glass, a frame, and a reflection
 *  streak — so wiping it clear actually reveals something nice. */
export const glass: SurfaceFn = (ctx, w, h, seed) => {
  const rand = mulberry32(seed)

  // Sky gradient (view beyond the glass).
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  const dusk = rand() < 0.5
  if (dusk) {
    sky.addColorStop(0, '#3a5a8c')
    sky.addColorStop(0.6, '#e8a06a')
    sky.addColorStop(1, '#f6d9a0')
  } else {
    sky.addColorStop(0, '#7ec8f2')
    sky.addColorStop(1, '#dff2fb')
  }
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Sun / moon.
  ctx.fillStyle = dusk ? 'rgba(255,240,210,0.95)' : 'rgba(255,255,240,0.9)'
  ctx.beginPath()
  ctx.arc(w * (0.2 + rand() * 0.6), h * (0.22 + rand() * 0.2), Math.min(w, h) * 0.09, 0, Math.PI * 2)
  ctx.fill()

  // Rolling hills.
  const hills = ['#5c8f5a', '#4a7d55', '#3c6b4d']
  hills.forEach((c, i) => {
    const baseY = h * (0.62 + i * 0.13)
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, baseY)
    for (let x = 0; x <= w; x += w / 6) {
      ctx.quadraticCurveTo(
        x + w / 12,
        baseY - 20 - rand() * 40,
        x + w / 6,
        baseY,
      )
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
  })

  // Diagonal reflection streak on the glass.
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.beginPath()
  ctx.moveTo(w * 0.1, 0)
  ctx.lineTo(w * 0.35, 0)
  ctx.lineTo(w * 0.15, h)
  ctx.lineTo(-w * 0.1, h)
  ctx.closePath()
  ctx.fill()

  // Window frame (cross muntins).
  ctx.fillStyle = '#e9edf0'
  const b = Math.min(w, h) * 0.05
  ctx.fillRect(0, 0, w, b)
  ctx.fillRect(0, h - b, w, b)
  ctx.fillRect(0, 0, b, h)
  ctx.fillRect(w - b, 0, b, h)
  ctx.fillRect(w / 2 - b / 2, 0, b, h)
  ctx.fillRect(0, h / 2 - b / 2, w, b)
}
