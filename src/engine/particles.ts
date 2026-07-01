// Water FX drawn on the top (fx) canvas, cleared and redrawn each frame.
// Three kinds: fast water 'drop's with motion-blur streaks, soft 'mist',
// and 'runoff' — tinted droplets that slide down to sell "dirt washing away".

type Kind = 'drop' | 'mist' | 'runoff'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  kind: Kind
}

const MAX_PARTICLES = 900

export class ParticleSystem {
  private items: Particle[] = []

  get count(): number {
    return this.items.length
  }

  /** Emit a burst of water at (x,y) travelling roughly along (dirX,dirY). */
  spray(x: number, y: number, dirX: number, dirY: number): void {
    const angle = Math.atan2(dirY, dirX)
    const drops = 6
    for (let i = 0; i < drops; i++) {
      if (this.items.length >= MAX_PARTICLES) break
      const spread = (Math.random() - 0.5) * 0.9
      const a = angle + spread
      const speed = 320 + Math.random() * 380
      this.items.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0,
        maxLife: 0.18 + Math.random() * 0.16,
        size: 1.2 + Math.random() * 2.2,
        kind: 'drop',
      })
    }
    // Occasional soft mist puff.
    if (Math.random() < 0.5 && this.items.length < MAX_PARTICLES) {
      this.items.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 30,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 10 + Math.random() * 18,
        kind: 'mist',
      })
    }
  }

  /** Emit tinted droplets that fall — the grime being rinsed off. */
  runoff(x: number, y: number): void {
    const n = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < n; i++) {
      if (this.items.length >= MAX_PARTICLES) break
      this.items.push({
        x: x + (Math.random() - 0.5) * 12,
        y,
        vx: (Math.random() - 0.5) * 30,
        vy: 40 + Math.random() * 60,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2,
        kind: 'runoff',
      })
    }
  }

  update(dt: number): void {
    const gravity = 900
    const kept: Particle[] = []
    for (const p of this.items) {
      p.life += dt
      if (p.life >= p.maxLife) continue
      if (p.kind === 'drop') p.vy += gravity * dt
      else if (p.kind === 'runoff') p.vy += gravity * 1.4 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      kept.push(p)
    }
    this.items = kept
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.items) {
      const t = p.life / p.maxLife
      if (p.kind === 'drop') {
        const a = 0.85 * (1 - t)
        ctx.strokeStyle = `rgba(210, 236, 255, ${a})`
        ctx.lineWidth = p.size
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 0.012, p.y - p.vy * 0.012)
        ctx.stroke()
      } else if (p.kind === 'mist') {
        const a = 0.16 * (1 - t)
        const r = p.size * (1 + t * 1.6)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `rgba(230, 245, 255, ${a})`)
        g.addColorStop(1, 'rgba(230, 245, 255, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      } else {
        const a = 0.7 * (1 - t)
        ctx.fillStyle = `rgba(96, 82, 58, ${a})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  clear(): void {
    this.items.length = 0
  }
}
