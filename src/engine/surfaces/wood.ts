import type { SurfaceFn } from '../types'
import { mulberry32 } from '../rng'
import { fbm } from '../noise'

/** Clean wooden deck: vertical planks with grain streaks and seams. */
export const wood: SurfaceFn = (ctx, w, h, seed) => {
  const rand = mulberry32(seed)
  const planks = 5 + Math.floor(rand() * 3)
  const pw = w / planks
  const hue = 28 + rand() * 10 // warm timber

  for (let p = 0; p < planks; p++) {
    const x = p * pw
    const base = 40 + rand() * 12
    ctx.fillStyle = `hsl(${hue} 40% ${base}%)`
    ctx.fillRect(x, 0, pw, h)

    // Grain: horizontal-ish streaks modulated by fbm.
    const grainSeed = seed + p * 131
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, 0, pw, h)
    ctx.clip()
    for (let i = 0; i < 26; i++) {
      const gy = rand() * h
      const light = base + (rand() - 0.5) * 22
      ctx.strokeStyle = `hsl(${hue} 38% ${light}% / 0.5)`
      ctx.lineWidth = 0.6 + rand() * 1.6
      ctx.beginPath()
      for (let sx = 0; sx <= pw; sx += 6) {
        const yy = gy + (fbm(sx * 0.03, gy * 0.02, grainSeed) - 0.5) * 14
        if (sx === 0) ctx.moveTo(x + sx, yy)
        else ctx.lineTo(x + sx, yy)
      }
      ctx.stroke()
    }
    ctx.restore()

    // Seam shadow between planks.
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillRect(x, 0, Math.max(1, pw * 0.02), h)
  }
}
