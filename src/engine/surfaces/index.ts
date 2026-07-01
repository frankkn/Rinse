import type { SurfaceFn, SurfaceType } from '../types'
import { tiles } from './tiles'

// Registry of clean-surface generators. M2 adds more entries here.
export const surfaces: Partial<Record<SurfaceType, SurfaceFn>> = {
  tiles,
}

export function getSurface(type: SurfaceType): SurfaceFn {
  return surfaces[type] ?? tiles
}
