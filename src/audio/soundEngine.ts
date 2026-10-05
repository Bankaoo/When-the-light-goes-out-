/**
 * Atmospheric Web Audio Engine for "When the Lights Go Out"
 * Synthesizes all music, machinery, electrical hums, wind, crickets, night birds, leaves, and SFX in real-time.
 * No external audio files needed; guarantees 100% reliable offline playback.
 */

export interface SoundLayerVolumes {
  wind: number;
  insects: number;
  nightBird: number;
  leaves: number;
  music: number;
  machinery: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Individual Layer Gain Nodes
  private musicGain: GainNode | null = null;
  private machineryGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private insectsGain: GainNode | null = null;
  private leavesGain: GainNode | null = null;
  private nightBirdGain: GainNode | null = null;

  // Active sources & intervals
  private waltzInterval: number | null = null;
  private waltzStep: number = 0;
  private waltzTempo: number = 320; // ms per beat (3/4 time)
  private isWaltzRunning: boolean = false;

  private windNode: AudioNode | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private cricketsInterval: number | null = null;
  private leavesInterval: number | null = null;
  private birdInterval: number | null = null;
  private coasterClankInterval: number | null = null;

  // Layer Volume Cache (0.0 to 1.0)
  public layerVolumes: SoundLayerVolumes = {
    wind: 0.15,
    insects: 0.25,
    nightBird: 0.4,
    leaves: 0.3,
    music: 0.5,
    machinery: 0.4,
  };

  public isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Layer Gains
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.machineryGain = this.ctx.createGain();
      this.machineryGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.machineryGain.connect(this.masterGain);

      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      this.crowdGain.connect(this.masterGain);

      // Natural sounds: subtle and sparse initially
      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.015, this.ctx.currentTime); // very low gentle whisper
      this.windGain.connect(this.masterGain);

      this.insectsGain = this.ctx.createGain();
      this.insectsGain.gain.setValueAtTime(0.01, this.ctx.currentTime); // almost imperceptible at start
      this.insectsGain.connect(this.masterGain);

      this.leavesGain = this.ctx.createGain();
      this.leavesGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.leavesGain.connect(this.masterGain);

      this.nightBirdGain = this.ctx.createGain();
      this.nightBirdGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      this.nightBirdGain.connect(this.masterGain);

      // Start continuous generators
      this.startSubtleWind();
      this.startElectricalHum();
      this.startCrickets();
      this.startRustlingLeaves();
      this.startNightBird();
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

  // --- NATURAL SOUND LAYER: REDUCED DRAMATICALLY SUBTLE WIND ---

  private startSubtleWind() {
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
      output[i] = (b0 + b1 + b2) * 0.06; // reduced amplitude
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Soft lowpass filter for gentle nocturnal breeze
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);

    // Very slow gentle LFO for subtle breathing of the night air
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12-second cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(60, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(this.windGain);

    whiteNoise.start();
    lfo.start();
    this.windNode = whiteNoise;
  }

  // --- NATURAL SOUND LAYER: RUSTLING LEAVES ---

  private startRustlingLeaves() {
    if (this.leavesInterval) return;

    // Occasional gentle rustle of leaves when breeze stirs the branches
    const triggerLeafRustle = () => {
      if (!this.ctx || !this.leavesGain || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Soft high-pass filtered noise burst
      const rustleLen = 0.8 + Math.random() * 0.6;
      const bufferSize = Math.floor(this.ctx.sampleRate * rustleLen);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400 + Math.random() * 400, now);
      bandpass.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + rustleLen * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + rustleLen);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.leavesGain);

      noise.start(now);
    };

    // Trigger every 8-16 seconds
    this.leavesInterval = window.setInterval(() => {
      if (Math.random() < 0.65) {
        triggerLeafRustle();
      }
    }, 7000);
  }

  // --- NATURAL SOUND LAYER: DISTANT NIGHT BIRD / OWL ---

  private startNightBird() {
    if (this.birdInterval) return;

    // Sparse, tranquil nocturnal bird call: soft distant owl / nightjar coo
    const playNightBirdCall = () => {
      if (!this.ctx || !this.nightBirdGain || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Two-part gentle flute coo: "Hoo... hu-hoo"
      const notes = [
        { f: 480, start: 0, dur: 0.5, vol: 0.12 },
        { f: 450, start: 0.8, dur: 0.3, vol: 0.1 },
        { f: 460, start: 1.25, dur: 0.65, vol: 0.14 },
      ];

      notes.forEach((note) => {
        if (!this.ctx || !this.nightBirdGain) return;
        const t = now + note.start;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Warm slight portamento/inflection
        osc.frequency.setValueAtTime(note.f - 15, t);
        osc.frequency.linearRampToValueAtTime(note.f, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(note.f - 25, t + note.dur);

        // Soft bell-like envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(note.vol, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + note.dur);

        osc.connect(gain);
        gain.connect(this.nightBirdGain);

        osc.start(t);
        osc.stop(t + note.dur + 0.05);
      });
    };

    // Very sparse: every 18-28 seconds
    this.birdInterval = window.setInterval(() => {
      if (Math.random() < 0.55) {
        playNightBirdCall();
      }
    }, 14000);
  }

  // --- CRICKETS: SPARSE AND SUBTLE ---

  private startCrickets() {
    if (this.cricketsInterval) return;

    const playCricketTrill = () => {
      if (!this.ctx || !this.insectsGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      const baseFreq = 4500 + (Math.random() * 300 - 150);

      // Sparse gentle micro-trill
      const bursts = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < bursts; i++) {
        const startTime = now + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 200, startTime + 0.03);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);

        osc.connect(gain);
        gain.connect(this.insectsGain);

        osc.start(startTime);
        osc.stop(startTime + 0.04);
      }
    };

    this.cricketsInterval = window.setInterval(() => {
      if (Math.random() < 0.6) {
        playCricketTrill();
      }
    }, 2800);
  }

  // --- ARTIFICIAL SOUND LAYER: ELECTRICAL HUM ---

  private startElectricalHum() {
    if (!this.ctx || !this.crowdGain) return;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, this.ctx.currentTime);

    const humSubGain = this.ctx.createGain();
    humSubGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(humSubGain);
    humSubGain.connect(this.crowdGain);

    osc1.start();
    osc2.start();
    this.humOsc1 = osc1;
    this.humOsc2 = osc2;
  }

  // --- CAROUSEL WALTZ SYNTHESIZER ---

  public startCarouselWaltz() {
    if (this.isWaltzRunning) return;
    this.isWaltzRunning = true;
    this.waltzTempo = 320;

    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
    }

    const notes: Record<string, number> = {
      C3: 130.81, G3: 196.0, A3: 220.0, F3: 174.61, E3: 164.81,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
    };

    const pattern: Array<{ m?: string; b?: string; c?: string[] }> = [
      { m: 'E5', b: 'C3' },
      { m: 'D5', c: ['G4', 'C5'] },
      { m: 'C5', c: ['G4', 'C5'] },
      { m: 'G4', b: 'C3' },
      { c: ['G4', 'C5'] },
      { c: ['G4', 'C5'] },
      { m: 'A4', b: 'F3' },
      { m: 'C5', c: ['A4', 'C5'] },
      { m: 'F5', c: ['A4', 'C5'] },
      { m: 'E5', b: 'C3' },
      { c: ['G4', 'C5'] },
      { c: ['G4', 'C5'] },
      { m: 'D5', b: 'G3' },
      { m: 'E5', c: ['B4', 'D5'] },
      { m: 'D5', c: ['B4', 'D5'] },
      { m: 'C5', b: 'C3' },
      { m: 'B4', c: ['G4', 'C5'] },
      { m: 'A4', c: ['G4', 'C5'] },
      { m: 'G4', b: 'G3' },
      { m: 'A4', c: ['B4', 'D5'] },
      { m: 'B4', c: ['B4', 'D5'] },
      { m: 'C5', b: 'C3' },
      { c: ['G4', 'C5'] },
      { c: ['G4', 'C5'] },
    ];

    const stepTick = () => {
      if (!this.isWaltzRunning || !this.ctx || !this.musicGain) return;

      const item = pattern[this.waltzStep % pattern.length];

      if (item.b && notes[item.b]) {
        this.playOrganTone(notes[item.b], 0.28, 0.14, 'triangle');
      }

      if (item.c) {
        item.c.forEach((ch) => {
          if (notes[ch]) {
            this.playOrganTone(notes[ch], 0.18, 0.05, 'sine');
          }
        });
      }

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

  // --- CAROUSEL SHUTDOWN ---
  public shutDownCarousel(onComplete?: () => void) {
    if (!this.ctx || !this.musicGain) {
      if (onComplete) onComplete();
      return;
    }

    const now = this.ctx.currentTime;
    // Gradually slow down tempo
    const intervalSlowdown = setInterval(() => {
      this.waltzTempo = Math.min(1100, this.waltzTempo + 80);
    }, 350);

    // Fade out music gain to EXACTLY ZERO
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0.0, now + 4.0);

    setTimeout(() => {
      clearInterval(intervalSlowdown);
      this.isWaltzRunning = false;
      if (this.waltzInterval) {
        clearTimeout(this.waltzInterval);
        this.waltzInterval = null;
      }
      this.playRelayClick();
      this.updateAtmosphereAfterCarousel();
      if (onComplete) onComplete();
    }, 4200);
  }

  // --- ROLLER COASTER SOUNDS ---

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

  // --- BREAKER SWITCH & SFX ---

  public playBreakerThunk() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

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

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- TRANSITIONS: HIGHLY PRONOUNCED ARTIFICIAL -> NATURAL ---

  public updateAtmosphereAfterCarousel() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Music is completely 0.0
    if (this.musicGain) {
      this.musicGain.gain.linearRampToValueAtTime(0.0, now + 1);
    }
    // Crowd and electrical hum slightly reduced
    if (this.crowdGain) {
      this.crowdGain.gain.linearRampToValueAtTime(0.08, now + 2);
    }
    // Natural sounds begin to appear, subtle and sparse
    if (this.insectsGain) {
      this.insectsGain.gain.linearRampToValueAtTime(0.03, now + 2);
    }
    if (this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(0.02, now + 2);
    }
    if (this.leavesGain) {
      this.leavesGain.gain.linearRampToValueAtTime(0.02, now + 2);
    }
  }

  public updateAtmosphereAfterCoaster() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Machinery hum drops completely to 0.0!
    if (this.machineryGain) {
      this.machineryGain.gain.linearRampToValueAtTime(0.0, now + 1.5);
    }
    // Crowd murmur drops completely to 0.0!
    if (this.crowdGain) {
      this.crowdGain.gain.linearRampToValueAtTime(0.02, now + 1.5);
    }
    // Natural sounds become gently audible
    if (this.insectsGain) {
      this.insectsGain.gain.linearRampToValueAtTime(0.06, now + 2);
    }
    if (this.leavesGain) {
      this.leavesGain.gain.linearRampToValueAtTime(0.04, now + 2);
    }
    if (this.nightBirdGain) {
      this.nightBirdGain.gain.linearRampToValueAtTime(0.06, now + 2);
    }
    if (this.windGain) {
      // Keep wind very gentle and subtle (0.028 max)
      this.windGain.gain.linearRampToValueAtTime(0.028, now + 2);
    }
  }

  public updateAtmosphereAfterFerris() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // ALL artificial sounds are COMPLETELY ZERO
    if (this.machineryGain) {
      this.machineryGain.gain.linearRampToValueAtTime(0.0, now + 2);
    }
    if (this.crowdGain) {
      this.crowdGain.gain.linearRampToValueAtTime(0.0, now + 2);
    }
    if (this.musicGain) {
      this.musicGain.gain.linearRampToValueAtTime(0.0, now + 1);
    }

    // Natural soundscape takes center stage: tranquil, sparse, delicate
    // Notice: wind is dramatically reduced (0.035), not overwhelming!
    if (this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(0.035, now + 3);
    }
    if (this.insectsGain) {
      this.insectsGain.gain.linearRampToValueAtTime(0.09, now + 3);
    }
    if (this.leavesGain) {
      this.leavesGain.gain.linearRampToValueAtTime(0.07, now + 3);
    }
    if (this.nightBirdGain) {
      this.nightBirdGain.gain.linearRampToValueAtTime(0.12, now + 3);
    }
  }

  // --- USER SOUND MIXER ADJUSTMENT IN FINAL SCENE ---

  public setLayerVolume(layer: keyof SoundLayerVolumes, value: number) {
    this.layerVolumes[layer] = value;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (layer) {
      case 'wind':
        if (this.windGain) {
          // Max wind capped low for gentle whisper
          this.windGain.gain.linearRampToValueAtTime(value * 0.08, now + 0.1);
        }
        break;

      case 'insects':
        if (this.insectsGain) {
          this.insectsGain.gain.linearRampToValueAtTime(value * 0.16, now + 0.1);
        }
        break;

      case 'nightBird':
        if (this.nightBirdGain) {
          this.nightBirdGain.gain.linearRampToValueAtTime(value * 0.22, now + 0.1);
        }
        break;

      case 'leaves':
        if (this.leavesGain) {
          this.leavesGain.gain.linearRampToValueAtTime(value * 0.14, now + 0.1);
        }
        break;

      case 'music':
        if (this.musicGain) {
          this.musicGain.gain.linearRampToValueAtTime(value * 0.35, now + 0.1);
          if (value > 0.01 && !this.isWaltzRunning) {
            this.startCarouselWaltz();
          } else if (value <= 0.01 && this.isWaltzRunning) {
            // Mute music
            this.musicGain.gain.setValueAtTime(0, now);
          }
        }
        break;

      case 'machinery':
        if (this.machineryGain) {
          this.machineryGain.gain.linearRampToValueAtTime(value * 0.25, now + 0.1);
        }
        if (this.crowdGain) {
          this.crowdGain.gain.linearRampToValueAtTime(value * 0.15, now + 0.1);
        }
        break;
    }
  }

  public playQuietNightChime() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const freqs = [880, 1174.66, 1760];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.12);
      gain.gain.setValueAtTime(0.06, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 2.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 2.6);
    });
  }
}

export const soundEngine = new SoundEngine();
