// Erasing the dirt layer. Uses destination-out so the clean canvas beneath
// shows through. A soft radial falloff means edges need a little extra
// scrubbing, which feels more like real washing than an instant wipe.

function stamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength: number,
): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, `rgba(0,0,0,${strength})`)
  g.addColorStop(0.6, `rgba(0,0,0,${strength * 0.7})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Erase a stroke from (x0,y0) to (x1,y1), stamping repeatedly along the way.
 * Returns nothing; mutates the dirt canvas in place.
 */
export function eraseSegment(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  strength = 0.8,
): void {
  const prev = ctx.globalCompositeOperation
  ctx.globalCompositeOperation = 'destination-out'

  const dist = Math.hypot(x1 - x0, y1 - y0)
  const step = Math.max(1, radius * 0.3)
  const steps = Math.max(1, Math.ceil(dist / step))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    stamp(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, strength)
  }

  ctx.globalCompositeOperation = prev
}
