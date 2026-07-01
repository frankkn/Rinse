// All audio is synthesized — no asset files. Spray is looping white noise
// shaped by a band-pass with a slow LFO wobble (reads as moving water rather
// than flat static). Completion plays a soft major triad.

export class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sprayGain: GainNode | null = null
  private lfo: OscillatorNode | null = null
  private muted = false

  setMuted(m: boolean): void {
    this.muted = m
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02)
    }
  }

  get isMuted(): boolean {
    return this.muted
  }

  /** Lazily build the audio graph; must run after a user gesture. */
  private ensure(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : 1
    master.connect(ctx.destination)

    // Continuous white-noise source.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 1600
    bandpass.Q.value = 0.7

    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 500

    const sprayGain = ctx.createGain()
    sprayGain.gain.value = 0 // silent until spraying

    // Slow wobble on the band-pass centre for a "living" water hiss.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 7
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 500
    lfo.connect(lfoGain)
    lfoGain.connect(bandpass.frequency)

    noise.connect(bandpass)
    bandpass.connect(highpass)
    highpass.connect(sprayGain)
    sprayGain.connect(master)

    noise.start()
    lfo.start()

    this.ctx = ctx
    this.master = master
    this.sprayGain = sprayGain
    this.lfo = lfo
  }

  startSpray(): void {
    this.ensure()
    if (!this.ctx || !this.sprayGain) return
    this.sprayGain.gain.setTargetAtTime(0.28, this.ctx.currentTime, 0.03)
  }

  stopSpray(): void {
    if (!this.ctx || !this.sprayGain) return
    this.sprayGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08)
  }

  /** Scale spray loudness/brightness by how much dirt is coming off (0..1). */
  setIntensity(v: number): void {
    if (!this.ctx || !this.sprayGain) return
    const g = 0.14 + Math.min(1, Math.max(0, v)) * 0.2
    this.sprayGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05)
  }

  /** Satisfying resolve when a level hits its target. */
  chime(): void {
    this.ensure()
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const t = now + i * 0.08
      const osc = this.ctx!.createOscillator()
      const g = this.ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.22, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.connect(g)
      g.connect(this.master!)
      osc.start(t)
      osc.stop(t + 1)
    })
  }

  dispose(): void {
    this.lfo?.stop()
    void this.ctx?.close()
    this.ctx = null
  }
}

// Shared singleton so mute state and the audio graph persist across screens.
export const sound = new SoundEngine()
