import type { DirtFn } from '../types'
import { mulberry32 } from '../rng'
import { fbm } from '../noise'

/** Light even dust film: broad pale wash with gentle unevenness and speckle.
 *  The easiest dirt — a satisfying quick wipe. */
export const dust: DirtFn = (ctx, w, h, seed, opts) => {
  const density = opts?.density ?? 0.8
  const rand = mulberry32(seed ^ 0x1b56c4d9)
  const ns = seed >>> 0
  ctx.save()

  // Broad, mostly-uniform film built from many large faint blobs.
  const blobs = Math.floor((w * h) / 3200 * density)
  for (let i = 0; i < blobs; i++) {
    const x = rand() * w
    const y = rand() * h
    const n = fbm(x * 0.004, y * 0.004, ns, 3, 0.5)
    const r = 40 + rand() * 90
    const a = (0.05 + n * 0.12) * density
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(198, 190, 172, ${a})`)
    g.addColorStop(1, 'rgba(198, 190, 172, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Fine light speckle.
  const specks = Math.floor((w * h) / 1400 * density)
  for (let i = 0; i < specks; i++) {
    ctx.fillStyle = `rgba(210, 204, 188, ${0.08 + rand() * 0.16})`
    ctx.beginPath()
    ctx.arc(rand() * w, rand() * h, 0.5 + rand() * 1.4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
