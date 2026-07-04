// Loads real surface photos from /public/surfaces/{type}/{type}_{n}.jpg.
// Images are cached by URL; callers await preloadSurface() before drawing.

const COUNTS: Record<string, number> = {
  tiles: 3,
  brick: 3,
  wood: 3,
  metal: 3,
  glass: 3,
  concrete: 3,
}

const cache = new Map<string, HTMLImageElement>()

function imgSrc(type: string, seed: number): string {
  const count = COUNTS[type] ?? 1
  const n = (Math.abs(seed) % count) + 1
  return `/surfaces/${type}/${type}_${n}.jpg`
}

/** Start loading the photo for this surface+seed combo; resolves when ready
 *  (or immediately if already cached). Resolves even on 404 so the engine
 *  falls back to procedural rather than hanging. */
export function preloadSurface(type: string, seed: number): Promise<void> {
  const src = imgSrc(type, seed)
  if (cache.has(src)) return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      cache.set(src, img)
      resolve()
    }
    img.onerror = () => resolve() // missing photo → procedural fallback
    img.src = src
  })
}

/** Draw the cached photo scaled to cover (w×h). Returns false if not cached. */
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  type: string,
): boolean {
  const src = imgSrc(type, seed)
  const img = cache.get(src)
  if (!img) return false
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  return true
}
