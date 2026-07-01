import type { DirtFn, DirtType } from '../types'
import { grime } from './grime'
import { mud } from './mud'
import { moss } from './moss'
import { dust } from './dust'
import { rust } from './rust'

// Registry of dirt-layer generators.
export const dirts: Record<DirtType, DirtFn> = {
  grime,
  mud,
  moss,
  dust,
  rust,
}

export function getDirt(type: DirtType): DirtFn {
  return dirts[type] ?? grime
}
