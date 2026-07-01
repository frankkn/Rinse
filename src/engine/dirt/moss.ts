import type { DirtFn } from '../types'
import { mulberry32 } from '../rng'
import { fbm } from '../noise'

/** Organic green moss: clustered fuzzy growth, heavier toward the bottom. */
export const moss: DirtFn = (ctx, w, h, seed, opts) => {
  const density = opts?.density ?? 0.9
  const rand = mulberry32(seed ^ 0x2f9a11c7)
  const ns = seed >>> 0
  ctx.save()

  // Patchy growth: dense where fbm is high, biased toward the bottom.
  const patches = Math.floor((w * h) / 1800 * density)
  for (let i = 0; i < patches; i++) {
    const x = rand() * w
    const y = rand() * h
    const bottomBias = 0.5 + (y / h) * 0.5 // more moss lower down
    const n = fbm(x * 0.006, y * 0.006, ns, 4, 0.6) * bottomBias
    if (n < 0.3) continue
    const r = 10 + rand() * 42
    const a = (0.12 + n * 0.34) * density
    const warm = rand() < 0.4
    const col = warm ? '96, 120, 48' : '58, 92, 44'
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${col}, ${a})`)
    g.addColorStop(1, `rgba(${col}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Fuzzy specks for texture.
  const specks = Math.floor((w * h) / 500 * density)
  for (let i = 0; i < specks; i++) {
    const x = rand() * w
    const y = rand() * h
    const n = fbm(x * 0.012, y * 0.012, ns + 5, 3, 0.5) * (0.5 + (y / h) * 0.5)
    if (n < 0.4) continue
    ctx.fillStyle = `rgba(52, 84, 38, ${0.15 + rand() * 0.3})`
    ctx.beginPath()
    ctx.arc(x, y, 0.6 + rand() * 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
