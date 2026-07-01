import type { DirtFn, DirtType } from '../types'
import { grime } from './grime'

// Registry of dirt-layer generators. M2 adds more entries here.
export const dirts: Partial<Record<DirtType, DirtFn>> = {
  grime,
}

export function getDirt(type: DirtType): DirtFn {
  return dirts[type] ?? grime
}
