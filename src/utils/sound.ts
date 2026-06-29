
class CausalityAudio {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private enabled: boolean = false;
  private ambientDrone: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;

  constructor() {
    // AudioContext will be initialized lazily on the first user interaction
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.connect(this.ctx.destination);
      this.masterVolume.gain.value = 0.14; // kept extremely soft and ambient
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser environment.", e);
    }
  }

  private startAmbientDrone() {
    if (!this.ctx || !this.masterVolume || this.ambientDrone) return;

    try {
      const currentTime = this.ctx.currentTime;
      this.ambientDrone = this.ctx.createOscillator();
      this.ambientFilter = this.ctx.createBiquadFilter();
      
      const droneGain = this.ctx.createGain();

      this.ambientDrone.type = "sine";
      this.ambientDrone.frequency.setValueAtTime(73.42, currentTime); // D2

      this.ambientFilter.type = "lowpass";
      this.ambientFilter.frequency.setValueAtTime(150, currentTime);
      this.ambientFilter.Q.setValueAtTime(1.0, currentTime);

      // Low frequency oscillator (LFO) to modulate gain and filter cutoff (breathing atmosphere)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.08, currentTime); // Very slow
      
      lfoGain.gain.setValueAtTime(0.035, currentTime);

      droneGain.gain.setValueAtTime(0.065, currentTime);

      // Modulate lowpass cutoff with LFO
      const filterModulator = this.ctx.createGain();
      filterModulator.gain.setValueAtTime(50, currentTime);
      lfo.connect(filterModulator);
      filterModulator.connect(this.ambientFilter.frequency);

      // Modulate volume with LFO
      lfo.connect(lfoGain);
      lfoGain.connect(droneGain.gain);

      this.ambientDrone.connect(this.ambientFilter);
      this.ambientFilter.connect(droneGain);
      droneGain.connect(this.masterVolume);

      lfo.start();
      this.ambientDrone.start();
    } catch (e) {
      console.warn("Could not start ambient space drone", e);
    }
  }

  private stopAmbientDrone() {
    if (this.ambientDrone) {
      try {
        this.ambientDrone.stop();
      } catch (e) {}
      this.ambientDrone = null;
      this.ambientFilter = null;
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && !this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (enabled) {
      this.startAmbientDrone();
    } else {
      this.stopAmbientDrone();
    }
  }

  public stopAll() {
    this.stopAmbientDrone();
    if (this.masterVolume) {
      // Fade out immediately
      this.masterVolume.gain.setTargetAtTime(0, this.ctx?.currentTime || 0, 0.1);
    }
  }

  public restoreVolume() {
    if (this.masterVolume) {
      this.masterVolume.gain.setTargetAtTime(0.14, this.ctx?.currentTime || 0, 1.0);
    }
  }

  public playHover() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    // An ultra-soft, high-frequency crystal pluck
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    // Slight random pitch variance for organic variety
    osc.frequency.setValueAtTime(880 + Math.random() * 220, this.ctx.currentTime);
    
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    // A deep, warm resonant museum bell drone
    const currentTime = this.ctx.currentTime;
    
    // Fundamental frequency: D3 (146.83 Hz) representing cosmic grounding
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(146.83, currentTime);
    gain1.gain.setValueAtTime(0.38, currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 1.8);
    osc1.connect(gain1);

    // Perfect fifth overtone: A3 (220 Hz)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(220.00, currentTime);
    gain2.gain.setValueAtTime(0.12, currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 1.2);
    osc2.connect(gain2);

    // Warm analog lowpass filter sweep
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, currentTime + 1.4);
    
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(this.masterVolume);

    osc1.start();
    osc2.start();
    osc1.stop(currentTime + 1.9);
    osc2.stop(currentTime + 1.9);
  }

  public playTick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    // A tiny, elegant tactile tick for button selections
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(this.masterVolume);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.025);
  }

  public playRipple() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    // A sweeping, warm cinematic resonant wave
    const currentTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(70, currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, currentTime + 2.0);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, currentTime);
    filter.frequency.exponentialRampToValueAtTime(750, currentTime + 1.6);
    filter.Q.setValueAtTime(4.5, currentTime); // highly resonant sweeping filter

    gain.gain.setValueAtTime(0.001, currentTime);
    gain.gain.linearRampToValueAtTime(0.16, currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start();
    osc.stop(currentTime + 2.3);
  }

  public playButterfly() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    // A mysterious, shimmering descending filter chime representing reality rewrite
    const currentTime = this.ctx.currentTime;
    const duration = 2.4;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, currentTime); // C5
    osc1.frequency.linearRampToValueAtTime(130.81, currentTime + duration); // slide down to C3
    gain1.gain.setValueAtTime(0.001, currentTime);
    gain1.gain.linearRampToValueAtTime(0.14, currentTime + 0.5);
    gain1.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1046.50, currentTime); // C6
    osc2.frequency.linearRampToValueAtTime(261.63, currentTime + duration); // slide down to C4
    gain2.gain.setValueAtTime(0.001, currentTime);
    gain2.gain.linearRampToValueAtTime(0.04, currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, currentTime + duration - 0.4);

    osc1.connect(gain1);
    gain1.connect(this.masterVolume);
    osc2.connect(gain2);
    gain2.connect(this.masterVolume);

    osc1.start();
    osc2.start();
    osc1.stop(currentTime + duration);
    osc2.stop(currentTime + duration);
  }

  public playSpatialParticle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    const currentTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Faint high-pitched crystal ping
    osc.frequency.setValueAtTime(1400 + Math.random() * 600, currentTime);

    gain.gain.setValueAtTime(0.003, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.masterVolume);

    osc.start();
    osc.stop(currentTime + 0.04);
  }

  public playSignatureBuildUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterVolume) return;

    // A massive, low-frequency cinematic rumble that accelerates and builds in pitch
    const currentTime = this.ctx.currentTime;
    const duration = 7.0;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(30, currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, currentTime + duration);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(40, currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, currentTime + duration);
    filter.Q.setValueAtTime(3.0, currentTime);

    gain.gain.setValueAtTime(0.001, currentTime);
    // Huge build up
    gain.gain.exponentialRampToValueAtTime(0.8, currentTime + duration - 0.2);
    // Instant drop off
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start();
    osc.stop(currentTime + duration);
  }
}

export const causalityAudio = new CausalityAudio();
