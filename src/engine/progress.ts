// Cheap "% cleaned" estimate: downscale the dirt canvas into a tiny buffer,
// sum the alpha channel, and compare against the initial baseline. Measuring
// against baseline (not absolute) means a level reads 100% when all the dirt
// that was actually there has been removed — grime intentionally leaves some
// light patches, and we don't want those to cap progress below 100%.

const SAMPLE = 128

export class ProgressSampler {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private baseline = 1

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = SAMPLE
    this.canvas.height = SAMPLE
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
  }

  private totalAlpha(dirtCanvas: HTMLCanvasElement): number {
    this.ctx.clearRect(0, 0, SAMPLE, SAMPLE)
    this.ctx.drawImage(dirtCanvas, 0, 0, SAMPLE, SAMPLE)
    const data = this.ctx.getImageData(0, 0, SAMPLE, SAMPLE).data
    let sum = 0
    for (let i = 3; i < data.length; i += 4) sum += data[i]
    return sum
  }

  /** Record the freshly-generated dirt as "0% cleaned". */
  setBaseline(dirtCanvas: HTMLCanvasElement): void {
    this.baseline = Math.max(1, this.totalAlpha(dirtCanvas))
  }

  /** Fraction of the original dirt removed, clamped to [0, 1]. */
  cleaned(dirtCanvas: HTMLCanvasElement): number {
    const remaining = this.totalAlpha(dirtCanvas)
    const pct = 1 - remaining / this.baseline
    return pct < 0 ? 0 : pct > 1 ? 1 : pct
  }
}
