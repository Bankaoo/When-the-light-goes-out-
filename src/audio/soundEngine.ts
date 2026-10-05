/**
 * Atmospheric Web Audio Engine for "When the Lights Go Out"
 * Synthesizes all music, machinery, electrical hums, wind, crickets, and SFX in real-time.
 * No external audio files needed; guarantees 100% reliable offline playback.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Layer Gain Nodes
  private musicGain: GainNode | null = null;
  private machineryGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private insectsGain: GainNode | null = null;

  // Active sources & intervals
  private waltzInterval: number | null = null;
  private waltzStep: number = 0;
  private waltzTempo: number = 320; // ms per beat (3/4 time)
  private isWaltzRunning: boolean = false;

  private windNode: AudioNode | null = null;
  private humNode: AudioNode | null = null;
  private cricketsInterval: number | null = null;
  private coasterClankInterval: number | null = null;

  public isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Layer Gains
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.machineryGain = this.ctx.createGain();
      this.machineryGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.machineryGain.connect(this.masterGain);

      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.crowdGain.connect(this.masterGain);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.windGain.connect(this.masterGain);

      this.insectsGain = this.ctx.createGain();
      this.insectsGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.insectsGain.connect(this.masterGain);

      // Start continuous ambient generators
      this.startWind();
      this.startElectricalHum();
      this.startCrickets();
      this.startCarouselWaltz();

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- AMBIENT SOUND GENERATORS ---

  private startWind() {
    if (!this.ctx || !this.windGain) return;

    // Pink / Brown noise buffer
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.11;
      b2 = 0.86 * b2 + white * 0.25;
      output[i] = (b0 + b1 + b2) * 0.2;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Bandpass filter for wind howl & rustle
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // LFO for slow gusts of wind
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second gust cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(160, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(this.windGain);

    whiteNoise.start();
    lfo.start();
    this.windNode = whiteNoise;
  }

  private startElectricalHum() {
    if (!this.ctx || !this.crowdGain) return;

    // 60Hz and 120Hz harmonics of vintage carnival neon / transformer hum
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);

    const humSubGain = this.ctx.createGain();
    humSubGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(humSubGain);
    humSubGain.connect(this.crowdGain);

    osc1.start();
    osc2.start();
    this.humNode = osc1;
  }

  private startCrickets() {
    if (this.cricketsInterval) return;

    // Periodic gentle nocturnal cricket trills
    const playCricketTrill = () => {
      if (!this.ctx || !this.insectsGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const baseFreq = 4200 + (Math.random() * 400 - 200);

      // Short rapid burst of 3-5 chirps
      const bursts = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < bursts; i++) {
        const startTime = now + i * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 350, startTime + 0.035);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

        osc.connect(gain);
        gain.connect(this.insectsGain);

        osc.start(startTime);
        osc.stop(startTime + 0.045);
      }
    };

    this.cricketsInterval = window.setInterval(() => {
      if (Math.random() < 0.75) {
        playCricketTrill();
      }
    }, 1800);
  }

  // --- CAROUSEL WALTZ SYNTHESIZER ---
  // Nostalgic music box / calliope 3/4 waltz: "Over the Waves" / nostalgic carousel waltz melody

  public startCarouselWaltz() {
    if (this.isWaltzRunning) return;
    this.isWaltzRunning = true;

    // Melody notes in Hz (C major / A minor nostalgic carousel waltz)
    // 3/4 meter: Bass note on beat 1, Chord chimes on beats 2 and 3, melody floating over
    const notes: Record<string, number> = {
      C3: 130.81, G3: 196.0, A3: 220.0, F3: 174.61, E3: 164.81,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99
    };

    // 16-measure sequence of (Melody, Bass, Chord)
    const pattern: Array<{ m?: string; b?: string; c?: string[] }> = [
      // Meas 1
      { m: 'E5', b: 'C3' },
      { m: 'D5', c: ['G4', 'C5'] },
      { m: 'C5', c: ['G4', 'C5'] },
      // Meas 2
      { m: 'G4', b: 'C3' },
      { c: ['G4', 'C5'] },
      { c: ['G4', 'C5'] },
      // Meas 3
      { m: 'A4', b: 'F3' },
      { m: 'C5', c: ['A4', 'C5'] },
      { m: 'F5', c: ['A4', 'C5'] },
      // Meas 4
      { m: 'E5', b: 'C3' },
      { c: ['G4', 'C5'] },
      { c: ['G4', 'C5'] },
      // Meas 5
      { m: 'D5', b: 'G3' },
      { m: 'E5', c: ['B4', 'D5'] },
      { m: 'D5', c: ['B4', 'D5'] },
      // Meas 6
      { m: 'C5', b: 'C3' },
      { m: 'B4', c: ['G4', 'C5'] },
      { m: 'A4', c: ['G4', 'C5'] },
      // Meas 7
      { m: 'G4', b: 'G3' },
      { m: 'A4', c: ['B4', 'D5'] },
      { m: 'B4', c: ['B4', 'D5'] },
      // Meas 8
      { m: 'C5', b: 'C3' },
      { c: ['G4', 'C5'] },
      { c: ['G4', 'C5'] },
    ];

    const stepTick = () => {
      if (!this.isWaltzRunning || !this.ctx || !this.musicGain) return;

      const item = pattern[this.waltzStep % pattern.length];
      const now = this.ctx.currentTime;

      // Play bass note
      if (item.b && notes[item.b]) {
        this.playOrganTone(notes[item.b], 0.28, 0.14, 'triangle');
      }

      // Play soft accompaniment chord
      if (item.c) {
        item.c.forEach((ch) => {
          if (notes[ch]) {
            this.playOrganTone(notes[ch], 0.18, 0.05, 'sine');
          }
        });
      }

      // Play melody note
      if (item.m && notes[item.m]) {
        this.playMusicBoxTone(notes[item.m], 0.45, 0.18);
      }

      this.waltzStep++;
      if (this.isWaltzRunning) {
        this.waltzInterval = window.setTimeout(stepTick, this.waltzTempo);
      }
    };

    this.waltzInterval = window.setTimeout(stepTick, this.waltzTempo);
  }

  private playOrganTone(freq: number, duration: number, vol: number, wave: OscillatorType = 'triangle') {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration + 0.05);
  }

  private playMusicBoxTone(freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    // Layered bell chime: Sine + soft harmonic overtone for genuine antique carousel calliope bell
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.01, this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(this.ctx.currentTime);
    osc2.start(this.ctx.currentTime);
    osc1.stop(this.ctx.currentTime + duration + 0.05);
    osc2.stop(this.ctx.currentTime + duration + 0.05);
  }

  // --- SHUTDOWN OF CAROUSEL ---
  public shutDownCarousel(onComplete?: () => void) {
    if (!this.ctx || !this.musicGain) {
      if (onComplete) onComplete();
      return;
    }

    const now = this.ctx.currentTime;
    // Gradually slow down tempo over 4 seconds
    const intervalSlowdown = setInterval(() => {
      this.waltzTempo = Math.min(1000, this.waltzTempo + 70);
    }, 350);

    // Gently fade out music gain
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0, now + 4.2);

    setTimeout(() => {
      clearInterval(intervalSlowdown);
      this.isWaltzRunning = false;
      if (this.waltzInterval) {
        clearTimeout(this.waltzInterval);
        this.waltzInterval = null;
      }
      this.playRelayClick();
      // Increase natural presence slightly
      this.updateAtmosphereAfterCarousel();
      if (onComplete) onComplete();
    }, 4500);
  }

  // --- ROLLER COASTER SOUND EFFECTS ---

  public startCoasterClanking() {
    if (this.coasterClankInterval) return;
    let clankCount = 0;

    const playClick = () => {
      if (!this.ctx || !this.machineryGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(140 + (clankCount % 2) * 40, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.machineryGain);

      osc.start(now);
      osc.stop(now + 0.07);
      clankCount++;
    };

    this.coasterClankInterval = window.setInterval(playClick, 240);
  }

  public stopCoasterClanking() {
    if (this.coasterClankInterval) {
      clearInterval(this.coasterClankInterval);
      this.coasterClankInterval = null;
    }
  }

  public playCoasterDropRush() {
    if (!this.ctx || !this.machineryGain) return;
    const now = this.ctx.currentTime;

    // Wind roar + track rumble
    const bufferSize = this.ctx.sampleRate * 3.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(400, now + 3.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.machineryGain);

    noise.start(now);
  }

  // --- SOUND EFFECTS: BREAKER SWITCH, BUTTONS, AMBIENCE ---

  public playBreakerThunk() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Heavy iron switch clunk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);

    this.playRelayClick(now + 0.05);
  }

  public playRelayClick(time?: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = time ?? this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(950, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playButtonChime() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- EMOTIONAL PROGRESSION AUDIO TRANSITIONS ---

  public updateAtmosphereAfterCarousel() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Music is dead.
    // Crowd and electrical hum slightly reduced.
    if (this.crowdGain) {
      this.crowdGain.gain.linearRampToValueAtTime(0.11, now + 2);
    }
    // Crickets and wind become gently noticeable
    if (this.insectsGain) {
      this.insectsGain.gain.linearRampToValueAtTime(0.14, now + 2);
    }
    if (this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(0.15, now + 2);
    }
  }

  public updateAtmosphereAfterCoaster() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Machinery hum drops drastically
    if (this.machineryGain) {
      this.machineryGain.gain.linearRampToValueAtTime(0.04, now + 2);
    }
    if (this.crowdGain) {
      this.crowdGain.gain.linearRampToValueAtTime(0.05, now + 2);
    }
    // Wind and leaves become more distinct
    if (this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(0.24, now + 2);
    }
    if (this.insectsGain) {
      this.insectsGain.gain.linearRampToValueAtTime(0.25, now + 2);
    }
  }

  public updateAtmosphereAfterFerris() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // All artificial hums extinguished
    if (this.machineryGain) {
      this.machineryGain.gain.linearRampToValueAtTime(0.0, now + 3);
    }
    if (this.crowdGain) {
      this.crowdGain.gain.linearRampToValueAtTime(0.0, now + 3);
    }
    if (this.musicGain) {
      this.musicGain.gain.linearRampToValueAtTime(0.0, now + 1);
    }
    // Natural soundscape becomes the main voice: gentle wind & rich nocturnal insects
    if (this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(0.32, now + 3);
    }
    if (this.insectsGain) {
      this.insectsGain.gain.linearRampToValueAtTime(0.35, now + 3);
    }
  }

  public playQuietNightChime() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    // A single, ethereal glass chime under the night sky
    const freqs = [880, 1174.66, 1760];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.12);
      gain.gain.setValueAtTime(0.07, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 2.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 2.6);
    });
  }
}

export const soundEngine = new SoundEngine();
