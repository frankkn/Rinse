import type { SurfaceFn, SurfaceType } from '../types'
import { tiles } from './tiles'
import { brick } from './brick'
import { wood } from './wood'
import { metal } from './metal'
import { glass } from './glass'
import { concrete } from './concrete'

// Registry of clean-surface generators.
export const surfaces: Record<SurfaceType, SurfaceFn> = {
  tiles,
  brick,
  wood,
  metal,
  glass,
  concrete,
}

export function getSurface(type: SurfaceType): SurfaceFn {
  return surfaces[type] ?? tiles
}
