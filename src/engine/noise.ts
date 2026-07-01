import { hash2 } from './rng'

// Smoothstep fade for value-noise interpolation.
function fade(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** 2D value noise in [0, 1], smoothly interpolated between hashed lattice points. */
export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi

  const tl = hash2(xi, yi, seed)
  const tr = hash2(xi + 1, yi, seed)
  const bl = hash2(xi, yi + 1, seed)
  const br = hash2(xi + 1, yi + 1, seed)

  const u = fade(xf)
  const v = fade(yf)
  return lerp(lerp(tl, tr, u), lerp(bl, br, u), v)
}

/**
 * Fractal Brownian Motion: layered value noise for natural-looking grime.
 * Higher octaves add finer detail; persistence controls how much each adds.
 */
export function fbm(
  x: number,
  y: number,
  seed: number,
  octaves = 4,
  persistence = 0.5,
  lacunarity = 2,
): number {
  let amplitude = 1
  let frequency = 1
  let sum = 0
  let max = 0
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 1013)
    max += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }
  return sum / max
}
