import type { SurfaceType, DirtType } from './engine/types'
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
    }

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** A fresh random surface + 1–2 dirt layers for endless zen washing. */
export function randomZen(): Extract<PlayConfig, { mode: 'zen' }> {
  const surface = pick(SURFACE_POOL)
  const first = pick(DIRT_POOL)
  const dirt: DirtType[] = [first]
  if (Math.random() < 0.5) {
    const second = pick(DIRT_POOL.filter((d) => d !== first))
    dirt.push(second)
  }
  return {
    mode: 'zen',
    surface,
    dirt,
    seed: Math.floor(Math.random() * 1e9),
    density: 0.85 + Math.random() * 0.15,
  }
}
