import type { DirtFn } from '../types'
import { mulberry32 } from '../rng'
import { fbm } from '../noise'

/**
 * Generic grime / soap-scum / water-staining. Built from three translucent
 * layers so the reveal underneath feels organic rather than a flat wipe:
 *   1. an uneven base wash (fbm-modulated soft blobs)
 *   2. vertical run-down streaks
 *   3. fine dark speckle
 * All drawn with vector ops so it lives in the same CSS-px space as erasing.
 */
export const grime: DirtFn = (ctx, w, h, seed, opts) => {
  const density = opts?.density ?? 0.85
  const rand = mulberry32(seed ^ 0x9e3779b9)
  const noiseSeed = seed >>> 0

  ctx.save()

  // --- Layer 1: uneven base wash via overlapping soft blobs ---
  const area = w * h
  const blobCount = Math.floor((area / 2600) * density)
  const scale = 0.006 // noise frequency across the surface
  for (let i = 0; i < blobCount; i++) {
    const x = rand() * w
    const y = rand() * h
    const n = fbm(x * scale, y * scale, noiseSeed, 4, 0.55) // 0..1 coverage
    if (n < 0.35) continue // leave some patches lighter
    const radius = 18 + rand() * 70
    const alpha = (0.05 + n * 0.22) * density
    // Grimy palette: muddy brown ↔ olive-grey, chosen by noise.
    const warm = n > 0.55
    const col = warm ? '92, 78, 54' : '66, 72, 58'
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
    g.addColorStop(0, `rgba(${col}, ${alpha})`)
    g.addColorStop(1, `rgba(${col}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // --- Layer 2: vertical run-down streaks (water stains) ---
  const streaks = Math.floor((w / 60) * density)
  for (let i = 0; i < streaks; i++) {
    const x = rand() * w
    const sw = 6 + rand() * 22
    const top = rand() * h * 0.4
    const bottom = top + h * (0.4 + rand() * 0.6)
    const a = 0.04 + rand() * 0.08
    const g = ctx.createLinearGradient(x, top, x, bottom)
    g.addColorStop(0, 'rgba(50, 44, 32, 0)')
    g.addColorStop(0.5, `rgba(50, 44, 32, ${a})`)
    g.addColorStop(1, 'rgba(50, 44, 32, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x - sw / 2, top, sw, bottom - top)
  }

  // --- Layer 3: fine dark speckle (mold / dirt specks) ---
  const specks = Math.floor((area / 900) * density)
  for (let i = 0; i < specks; i++) {
    const x = rand() * w
    const y = rand() * h
    const n = fbm(x * scale * 2, y * scale * 2, noiseSeed + 7, 3, 0.5)
    if (n < 0.45) continue
    const r = 0.5 + rand() * 1.8
    ctx.fillStyle = `rgba(34, 30, 24, ${0.12 + rand() * 0.25})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
