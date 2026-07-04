import type { SurfaceFn, SurfaceType } from '../types'
import { tiles } from './tiles'
import { brick } from './brick'
import { wood } from './wood'
import { metal } from './metal'
import { glass } from './glass'
import { concrete } from './concrete'
import { drawPhoto, preloadSurface } from './photoLoader'

// Registry of procedural fallback generators.
const surfaces: Record<SurfaceType, SurfaceFn> = {
  tiles,
  brick,
  wood,
  metal,
  glass,
  concrete,
}

/** Try photo first; fall back to procedural if the image wasn't preloaded. */
export function getSurface(type: SurfaceType): SurfaceFn {
  const fallback = surfaces[type] ?? tiles
  return (ctx, w, h, seed) => {
    if (!drawPhoto(ctx, w, h, seed, type)) fallback(ctx, w, h, seed)
  }
}

export { preloadSurface }
