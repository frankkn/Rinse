export type SurfaceType =
  | 'tiles'
  | 'brick'
  | 'wood'
  | 'metal'
  | 'glass'
  | 'concrete'

export type DirtType = 'grime' | 'mud' | 'moss' | 'dust' | 'rust'

/** Tiers of tough stains that resist normal washing. */
export type ToughTier = 'stubborn' | 'chemical'

/** Draws an opaque clean surface filling w×h (coordinates in CSS px). */
export type SurfaceFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
) => void

export interface DirtOptions {
  /** 0..1 — how heavy the grime is. */
  density?: number
}

/** Draws a semi-transparent dirt layer over the whole area. */
export type DirtFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  opts?: DirtOptions,
) => void
