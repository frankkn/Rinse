import type { DirtFn } from '../types'
import { mulberry32 } from '../rng'
import { fbm } from '../noise'

/** Heavy mud splatter: brown blobs, downward drips, and fine spatter. */
export const mud: DirtFn = (ctx, w, h, seed, opts) => {
  const density = opts?.density ?? 0.9
  const rand = mulberry32(seed ^ 0x51ed270b)
  const ns = seed >>> 0
  ctx.save()

  // Splatter blobs.
  const blobs = Math.floor((w * h) / 2200 * density)
  for (let i = 0; i < blobs; i++) {
    const x = rand() * w
    const y = rand() * h
    const n = fbm(x * 0.007, y * 0.007, ns, 4, 0.55)
    if (n < 0.32) continue
    const r = 16 + rand() * 60
    const a = (0.1 + n * 0.3) * density
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(84, 58, 34, ${a})`)
    g.addColorStop(1, 'rgba(84, 58, 34, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Drips running down from some blobs.
  const drips = Math.floor((w / 40) * density)
  for (let i = 0; i < drips; i++) {
    const x = rand() * w
    const top = rand() * h * 0.5
    const len = h * (0.15 + rand() * 0.4)
    const dw = 3 + rand() * 8
    const a = 0.12 + rand() * 0.16
    const g = ctx.createLinearGradient(x, top, x, top + len)
    g.addColorStop(0, `rgba(72, 48, 28, ${a})`)
    g.addColorStop(1, 'rgba(72, 48, 28, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x - dw / 2, top, dw, len)
  }

  // Fine spatter.
  const spatter = Math.floor((w * h) / 700 * density)
  for (let i = 0; i < spatter; i++) {
    const x = rand() * w
    const y = rand() * h
    ctx.fillStyle = `rgba(58, 40, 24, ${0.15 + rand() * 0.3})`
    ctx.beginPath()
    ctx.arc(x, y, 0.6 + rand() * 2.2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
