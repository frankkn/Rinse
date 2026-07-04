import type { SurfaceType, DirtType, ToughTier } from './engine/types'
import type { Level } from './data/levels'
import { SURFACE_POOL, DIRT_POOL } from './data/levels'

export type PlayConfig =
  | { mode: 'level'; level: Level }
  | {
      mode: 'zen'
      surface: SurfaceType
      dirt: DirtType[]
      seed: number
      density: number
      tiers?: ToughTier[]
    }

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** A fresh random surface + 1–2 dirt layers (and occasionally tough stains). */
export function randomZen(): Extract<PlayConfig, { mode: 'zen' }> {
  const surface = pick(SURFACE_POOL)
  const first   = pick(DIRT_POOL)
  const dirt: DirtType[] = [first]
  if (Math.random() < 0.5) {
    const second = pick(DIRT_POOL.filter((d) => d !== first))
    dirt.push(second)
  }

  const tiers: ToughTier[] = []
  if (Math.random() < 0.35) tiers.push('stubborn')
  if (tiers.length > 0 && Math.random() < 0.3) tiers.push('chemical')

  return {
    mode: 'zen',
    surface,
    dirt,
    seed: Math.floor(Math.random() * 1e9),
    density: 0.85 + Math.random() * 0.15,
    ...(tiers.length > 0 ? { tiers } : {}),
  }
}
