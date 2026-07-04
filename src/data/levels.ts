import type { SurfaceType, DirtType } from '../engine/types'

export interface Level {
  id: number
  name: string
  surface: SurfaceType
  dirt: DirtType[]
  seed: number
  target: number
  density?: number
}

// Curated progression, Mix theme: light films first, heavier/layered grime
// later. Seeds are fixed so a level always looks the same.
export const LEVELS: Level[] = [
  { id: 0, name: '起霧的窗', surface: 'glass', dirt: ['dust'], seed: 4021, target: 0.99, density: 0.7 },
  { id: 1, name: '灰塵磁磚', surface: 'tiles', dirt: ['dust'], seed: 7731, target: 0.99, density: 0.8 },
  { id: 2, name: '油膩廚房', surface: 'tiles', dirt: ['grime'], seed: 1187, target: 0.99, density: 0.9 },
  { id: 3, name: '塵封木桌', surface: 'wood', dirt: ['dust', 'grime'], seed: 9043, target: 0.99, density: 0.85 },
  { id: 4, name: '泥濘後院', surface: 'concrete', dirt: ['mud'], seed: 3360, target: 0.99, density: 0.95 },
  { id: 5, name: '生苔石階', surface: 'brick', dirt: ['moss'], seed: 5528, target: 0.99, density: 0.95 },
  { id: 6, name: '鏽蝕鐵板', surface: 'metal', dirt: ['rust'], seed: 6614, target: 0.99, density: 0.9 },
  { id: 7, name: '髒污磚牆', surface: 'brick', dirt: ['grime', 'mud'], seed: 2205, target: 0.99, density: 0.95 },
  { id: 8, name: '潮濕浴室', surface: 'tiles', dirt: ['moss', 'grime'], seed: 8890, target: 0.99, density: 0.95 },
  { id: 9, name: '廢棄車道', surface: 'concrete', dirt: ['mud', 'moss'], seed: 1449, target: 0.99, density: 1 },
  { id: 10, name: '海邊鐵窗', surface: 'metal', dirt: ['rust', 'grime'], seed: 7052, target: 0.99, density: 1 },
  { id: 11, name: '荒廢玻璃屋', surface: 'glass', dirt: ['moss', 'dust'], seed: 3987, target: 0.99, density: 0.95 },
]

export const SURFACE_POOL: SurfaceType[] = [
  'tiles',
  'brick',
  'wood',
  'metal',
  'glass',
  'concrete',
]
export const DIRT_POOL: DirtType[] = ['grime', 'mud', 'moss', 'dust', 'rust']
