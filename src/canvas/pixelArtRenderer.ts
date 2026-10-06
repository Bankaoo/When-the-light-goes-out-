/**
 * 2D Pixel Art Canvas Rendering Engine
 * Operates at native 480x270 (16:9) pixel resolution.
 * Refined for consistent, believable first-person POV across all attractions.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  brightness: number;
  pulseSpeed: number;
  size: number;
}

export class PixelArtRenderer {
  public stars: Star[] = [];
  public fireflies: Array<{ x: number; y: number; vx: number; vy: number; phase: number; glow: number }> = [];
  public leaves: Array<{ x: number; y: number; vx: number; vy: number; angle: number }> = [];
  private shootingStars: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }> = [];

  // Continuous motion accumulators (ensures zero phase-jumping on deceleration)
  public carouselRideOffset: number = 0;
  public horseBobPhase: number = 0;
  public parkCarouselAngle: number = 0;
  public parkFerrisAngle: number = 0.4;
  public parkCoasterProgress: number = 0;
  public onRideFerrisAngle: number = 0;
  private lastUpdateTime: number = 0;

  constructor() {
    this.initStars();
    this.initFireflies();
    this.initLeaves();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * 480),
        y: Math.floor(Math.random() * 140),
        brightness: 0.35 + Math.random() * 0.65,
        pulseSpeed: 0.6 + Math.random() * 1.4,
        size: Math.random() > 0.85 ? 2 : 1,
      });
    }
  }

  private initFireflies() {
    this.fireflies = [];
    for (let i = 0; i < 24; i++) {
      this.fireflies.push({
        x: 40 + Math.random() * 400,
        y: 170 + Math.random() * 85,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
        glow: 0.5,
      });
    }
  }

  private initLeaves() {
    this.leaves = [];
    for (let i = 0; i < 12; i++) {
      this.leaves.push({
        x: Math.random() * 480,
        y: Math.random() * 270,
        vx: 0.25 + Math.random() * 0.4,
        vy: 0.15 + Math.random() * 0.25,
        angle: Math.random() * 360,
      });
    }
  }

  public updateMotion(
    time: number,
    carouselSpeed: number = 1.0,
    isFerrisMoving: boolean = true,
    isCoasterMoving: boolean = false
  ) {
    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = time;
      return;
    }
    const dt = Math.min(0.1, Math.max(0.001, time - this.lastUpdateTime));
    this.lastUpdateTime = time;

    // Smooth carousel motion integration
    if (carouselSpeed > 0.001) {
      // Moves panorama outside smoothly
      this.carouselRideOffset = (this.carouselRideOffset + dt * 110 * carouselSpeed) % 960;
      this.horseBobPhase = (this.horseBobPhase + dt * 2.5 * carouselSpeed) % (Math.PI * 2);
      this.parkCarouselAngle = (this.parkCarouselAngle + dt * 1.8 * carouselSpeed) % 24;
    }

    // Smooth Ferris wheel motion integration
    if (isFerrisMoving) {
      this.parkFerrisAngle = (this.parkFerrisAngle + dt * 0.18) % (Math.PI * 2);
      this.onRideFerrisAngle = (this.onRideFerrisAngle + dt * 0.15) % (Math.PI * 2);
    }

    // Smooth coaster train in park view
    if (isCoasterMoving) {
      this.parkCoasterProgress = (this.parkCoasterProgress + dt * 0.35) % 1.0;
    }
  }

  // --- SKY & ASTRONOMY RENDERING ---

  public renderNightSky(
    ctx: CanvasRenderingContext2D,
    time: number,
    darknessFactor: number = 0,
    moonSizeMultiplier: number = 1.0,
    moonYOffset: number = 0,
    showMoon: boolean = true
  ) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    if (darknessFactor > 0.6) {
      skyGrad.addColorStop(0, '#04050e');
      skyGrad.addColorStop(0.6, '#080d1e');
      skyGrad.addColorStop(1, '#0e172e');
    } else {
      skyGrad.addColorStop(0, '#060817');
      skyGrad.addColorStop(0.5, '#0c132c');
      skyGrad.addColorStop(1, '#1b1b3a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 480, 200);

    // Stars
    this.stars.forEach((star, index) => {
      const baseAlpha = darknessFactor > 0.5 ? star.brightness : star.brightness * 0.65;
      const pulse = Math.sin(time * star.pulseSpeed + index) * 0.18;
      const alpha = Math.max(0.1, Math.min(1.0, baseAlpha + pulse));

      ctx.fillStyle = `rgba(235, 243, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);

      if (star.size === 2 && alpha > 0.75) {
        ctx.fillStyle = `rgba(215, 230, 255, ${(alpha * 0.35).toFixed(2)})`;
        ctx.fillRect(star.x - 1, star.y, 4, 1);
        ctx.fillRect(star.x, star.y - 1, 1, 4);
      }
    });

    // Shooting star
    if (Math.random() < 0.002 && this.shootingStars.length < 1) {
      this.shootingStars.push({
        x: 120 + Math.random() * 220,
        y: 20 + Math.random() * 45,
        vx: 2.5 + Math.random() * 2,
        vy: 1.2 + Math.random() * 1.2,
        life: 0,
        maxLife: 22,
      });
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life++;
      const lifePct = 1 - s.life / s.maxLife;
      if (lifePct <= 0) {
        this.shootingStars.splice(i, 1);
      } else {
        ctx.strokeStyle = `rgba(255, 255, 230, ${(lifePct * 0.7).toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5);
        ctx.stroke();
      }
    }

    // Moon (conditional - hidden on ground view where structure blocks upper sky)
    if (showMoon) {
      const moonX = 390;
      const moonY = 46 + moonYOffset;
      const radius = 18 * moonSizeMultiplier;

      const moonGlow = ctx.createRadialGradient(moonX, moonY, radius * 0.5, moonX, moonY, radius * 2.8);
      moonGlow.addColorStop(0, `rgba(240, 245, 255, ${0.35 + darknessFactor * 0.15})`);
      moonGlow.addColorStop(0.5, `rgba(200, 220, 255, ${0.12 + darknessFactor * 0.08})`);
      moonGlow.addColorStop(1, 'rgba(200, 220, 255, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, radius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8f6e8';
      ctx.beginPath();
      ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d6dbdc';
      ctx.fillRect(moonX - radius * 0.4, moonY - radius * 0.3, radius * 0.35, radius * 0.25);
      ctx.fillRect(moonX - radius * 0.1, moonY + radius * 0.1, radius * 0.45, radius * 0.3);
      ctx.fillRect(moonX - radius * 0.5, moonY + radius * 0.2, radius * 0.25, radius * 0.2);
      ctx.fillStyle = '#bac2c7';
      ctx.fillRect(moonX - radius * 0.3, moonY - radius * 0.2, radius * 0.2, radius * 0.15);
    }

    // Clouds
    const cloudOffset1 = (time * 0.6) % 560 - 80;
    const cloudOffset2 = (time * 0.35 + 200) % 560 - 80;
    this.drawPixelCloud(ctx, cloudOffset1, 55, 65, 12, 0.16);
    this.drawPixelCloud(ctx, cloudOffset2, 85, 90, 16, 0.12);
  }

  private drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
    ctx.fillStyle = `rgba(180, 195, 225, ${alpha.toFixed(2)})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    ctx.fillRect(Math.floor(x + 10), Math.floor(y - 4), Math.floor(w - 20), Math.floor(h + 8));
    ctx.fillRect(Math.floor(x + 20), Math.floor(y - 7), Math.floor(w - 40), Math.floor(h + 12));
  }

  public renderHorizonAndDistantTrees(ctx: CanvasRenderingContext2D, darknessFactor: number) {
    ctx.fillStyle = darknessFactor > 0.6 ? '#070b16' : '#0d1326';
    ctx.beginPath();
    ctx.moveTo(0, 175);
    ctx.lineTo(80, 155);
    ctx.lineTo(160, 168);
    ctx.lineTo(260, 148);
    ctx.lineTo(370, 162);
    ctx.lineTo(480, 152);
    ctx.lineTo(480, 270);
    ctx.lineTo(0, 270);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = darknessFactor > 0.6 ? '#050812' : '#0a0f1d';
    for (let x = 10; x < 480; x += 18) {
      const treeH = 22 + ((x * 7) % 15);
      const baseY = 175;
      ctx.beginPath();
      ctx.moveTo(x, baseY - treeH);
      ctx.lineTo(x - 6, baseY);
      ctx.lineTo(x + 6, baseY);
      ctx.closePath();
      ctx.fill();
    }
  }

  // --- MAIN PARK SCENE RENDERING ---

  public renderMainPark(
    ctx: CanvasRenderingContext2D,
    time: number,
    state: {
      carouselLit: boolean;
      carouselRiding: boolean;
      coasterLit: boolean;
      coasterRiding: boolean;
      ferrisLit: boolean;
      ferrisRiding: boolean;
      darknessFactor: number;
    }
  ) {
    this.updateMotion(
      time,
      state.carouselRiding ? 1.0 : 0.0,
      state.ferrisRiding,
      state.coasterRiding
    );

    ctx.clearRect(0, 0, 480, 270);

    this.renderNightSky(ctx, time, state.darknessFactor);
    this.renderHorizonAndDistantTrees(ctx, state.darknessFactor);

    // Ground promenade
    const groundGrad = ctx.createLinearGradient(0, 170, 0, 270);
    if (state.darknessFactor > 0.6) {
      groundGrad.addColorStop(0, '#090e1c');
      groundGrad.addColorStop(1, '#05070f');
    } else {
      groundGrad.addColorStop(0, '#151930');
      groundGrad.addColorStop(1, '#0c1022');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 170, 480, 100);

    // Brick walkway
    ctx.fillStyle = state.darknessFactor > 0.6 ? '#0b1122' : '#1a1f3c';
    for (let py = 185; py < 270; py += 12) {
      const shift = ((py / 12) % 2) * 14;
      for (let px = -20; px < 500; px += 28) {
        ctx.fillRect(px + shift, py, 26, 10);
      }
    }

    // Rides
    this.drawParkCarousel(ctx, 80, 175, time, state.carouselLit, state.carouselRiding);
    this.drawParkCoaster(ctx, 230, 175, time, state.coasterLit, state.coasterRiding);
    this.drawParkFerrisWheel(ctx, 400, 168, time, state.ferrisLit, state.ferrisRiding);

    // Street Lanterns
    this.drawParkStreetLanterns(ctx, time, state.darknessFactor, state.carouselLit, state.coasterLit, state.ferrisLit);

    // Nature
    this.drawParkNature(ctx, time, state.darknessFactor);
  }

  // --- CAROUSEL SPRITE IN MAIN PARK ---

  private drawParkCarousel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    time: number,
    isLit: boolean,
    isSpinning: boolean
  ) {
    const width = 100;
    const height = 75;
    const topY = baseY - height;

    ctx.fillStyle = isLit ? '#3a302a' : '#14141e';
    ctx.fillRect(cx - width / 2, baseY - 12, width, 12);
    ctx.fillStyle = isLit ? '#d4a373' : '#1a1a28';
    ctx.fillRect(cx - width / 2 + 4, baseY - 16, width - 8, 4);

    ctx.fillStyle = isLit ? '#ecd6a8' : '#161929';
    ctx.fillRect(cx - 10, topY + 24, 20, height - 38);

    const roofTop = topY + 6;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx - width / 2 - 4, roofTop + 24);
    ctx.lineTo(cx + width / 2 + 4, roofTop + 24);
    ctx.closePath();
    ctx.fillStyle = isLit ? '#b02a30' : '#111320';
    ctx.fill();

    if (isLit) {
      const stripeOffset = this.parkCarouselAngle;
      for (let s = -width / 2; s < width / 2; s += 24) {
        ctx.fillStyle = '#f7eedd';
        ctx.beginPath();
        ctx.moveTo(cx, topY);
        ctx.lineTo(cx + s + stripeOffset, roofTop + 24);
        ctx.lineTo(cx + s + stripeOffset + 10, roofTop + 24);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.fillStyle = isLit ? '#f5c542' : '#22253b';
    ctx.fillRect(cx - 2, topY - 10, 4, 10);
    ctx.fillStyle = isLit ? '#e63946' : '#1c1f36';
    ctx.fillRect(cx + 2, topY - 10, 10, 6);

    const bulbY = roofTop + 24;
    for (let bx = cx - width / 2 + 2; bx <= cx + width / 2 - 2; bx += 10) {
      if (isLit) {
        const glow = Math.sin(time * 2.5 + bx) > 0 ? '#ffea75' : '#ffa94d';
        ctx.fillStyle = glow;
        ctx.fillRect(bx, bulbY, 4, 4);
      } else {
        ctx.fillStyle = '#1c2033';
        ctx.fillRect(bx, bulbY, 4, 4);
      }
    }

    const horseSpacing = 22;
    for (let i = -1; i <= 1; i++) {
      const hx = cx + i * horseSpacing;
      ctx.fillStyle = isLit ? '#f5c542' : '#21253a';
      ctx.fillRect(hx - 1, topY + 28, 2, height - 44);

      const bob = isSpinning ? Math.sin(this.horseBobPhase + i * 1.6) * 4 : 0;
      const hy = baseY - 24 + bob;

      ctx.fillStyle = isLit ? (i === 0 ? '#ffffff' : '#d4a373') : '#181b2c';
      ctx.fillRect(hx - 8, hy, 16, 7);
      ctx.fillRect(hx + 5, hy - 6, 6, 8);
      ctx.fillRect(hx + 9, hy - 6, 4, 4);
      if (isLit) {
        ctx.fillStyle = '#e63946';
        ctx.fillRect(hx - 3, hy - 1, 6, 4);
      }
      ctx.fillStyle = isLit ? '#c49363' : '#131524';
      ctx.fillRect(hx - 7, hy + 7, 2, 6);
      ctx.fillRect(hx + 5, hy + 7, 2, 6);
    }

    if (isLit) {
      const glowGrad = ctx.createRadialGradient(cx, baseY - 4, 10, cx, baseY - 4, 75);
      glowGrad.addColorStop(0, 'rgba(255, 220, 130, 0.35)');
      glowGrad.addColorStop(0.7, 'rgba(255, 170, 70, 0.12)');
      glowGrad.addColorStop(1, 'rgba(255, 170, 70, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, baseY - 4, 75, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- ROLLER COASTER SPRITE IN MAIN PARK ---

  private drawParkCoaster(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    time: number,
    isLit: boolean,
    isRiding: boolean
  ) {
    const trestleColor = isLit ? '#6c584c' : '#141726';
    const trackColor = isLit ? '#a98467' : '#191d30';
    const railColor = isLit ? '#f0ebd8' : '#22273f';

    ctx.strokeStyle = trestleColor;
    ctx.lineWidth = 1.5;

    const trestleX = [cx - 70, cx - 50, cx - 25, cx, cx + 30, cx + 65];
    trestleX.forEach((tx) => {
      const topBeamY = tx < cx - 50 ? baseY - 60 - (tx - (cx - 70)) * 2.5 : baseY - 110 + (tx - (cx - 50)) * 0.8;
      ctx.beginPath();
      ctx.moveTo(tx, topBeamY);
      ctx.lineTo(tx, baseY);
      ctx.stroke();

      for (let by = topBeamY + 14; by < baseY; by += 20) {
        ctx.beginPath();
        ctx.moveTo(tx - 10, by);
        ctx.lineTo(tx + 10, by);
        ctx.moveTo(tx - 10, by);
        ctx.lineTo(tx + 10, by + 18);
        ctx.stroke();
      }
    });

    ctx.beginPath();
    ctx.moveTo(cx - 85, baseY - 35);
    ctx.lineTo(cx - 50, baseY - 112);
    ctx.quadraticCurveTo(cx - 15, baseY - 112, cx + 5, baseY - 60);
    ctx.quadraticCurveTo(cx + 35, baseY - 30, cx + 75, baseY - 70);
    ctx.lineTo(cx + 90, baseY - 40);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = railColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isLit) {
      const beaconGlow = Math.sin(time * 3) > 0 ? '#ff3344' : '#771111';
      ctx.fillStyle = beaconGlow;
      ctx.fillRect(cx - 52, baseY - 116, 4, 4);

      ctx.fillStyle = '#ffdf75';
      ctx.fillRect(cx - 85, baseY - 28, 16, 6);
    } else {
      ctx.fillStyle = '#1c2032';
      ctx.fillRect(cx - 52, baseY - 116, 4, 4);
    }

    let carX = cx - 50;
    let carY = baseY - 115;
    if (isRiding) {
      const progress = this.parkCoasterProgress;
      if (progress < 0.45) {
        const climbPct = progress / 0.45;
        carX = cx - 85 + climbPct * 35;
        carY = baseY - 35 - climbPct * 77;
      } else {
        const dropPct = (progress - 0.45) / 0.55;
        carX = cx - 50 + dropPct * 130;
        carY = baseY - 112 + Math.sin(dropPct * Math.PI) * 62;
      }
    }

    ctx.fillStyle = isLit ? '#d62828' : '#141724';
    ctx.fillRect(carX - 6, carY - 4, 14, 5);
    ctx.fillStyle = isLit ? '#fdf0d5' : '#1a1d2e';
    ctx.fillRect(carX - 4, carY - 7, 10, 3);
    if (isLit) {
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(carX + 8, carY - 3, 2, 2);
    }
  }

  // --- FERRIS WHEEL SPRITE IN MAIN PARK ---

  private drawParkFerrisWheel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    time: number,
    isLit: boolean,
    isTurning: boolean
  ) {
    const wheelRadius = 55;
    const hubY = baseY - wheelRadius - 8;
    const rotationAngle = this.parkFerrisAngle;

    ctx.strokeStyle = isLit ? '#4a5568' : '#151928';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, hubY);
    ctx.lineTo(cx - 30, baseY);
    ctx.moveTo(cx, hubY);
    ctx.lineTo(cx + 30, baseY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 15, baseY - 28);
    ctx.lineTo(cx + 15, baseY - 28);
    ctx.stroke();

    ctx.strokeStyle = isLit ? '#718096' : '#191f32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, hubY, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isLit ? '#4a5568' : '#141828';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, hubY, wheelRadius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    const numGondolas = 10;
    const gondolaColors = ['#e63946', '#f4a261', '#2a9d8f', '#e76f51', '#457b9d'];

    for (let i = 0; i < numGondolas; i++) {
      const angle = rotationAngle + (i * Math.PI * 2) / numGondolas;
      const gx = cx + Math.cos(angle) * wheelRadius;
      const gy = hubY + Math.sin(angle) * wheelRadius;

      ctx.strokeStyle = isLit ? '#a0aec0' : '#171c2d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, hubY);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      if (isLit) {
        const midX = cx + Math.cos(angle) * (wheelRadius * 0.75);
        const midY = hubY + Math.sin(angle) * (wheelRadius * 0.75);
        ctx.fillStyle = '#ffea75';
        ctx.fillRect(midX - 1, midY - 1, 2, 2);
      }

      const gColor = isLit ? gondolaColors[i % gondolaColors.length] : '#161a29';
      ctx.fillStyle = isLit ? '#cbd5e0' : '#141724';
      ctx.fillRect(gx - 1, gy, 2, 4);

      ctx.fillStyle = gColor;
      ctx.fillRect(gx - 5, gy + 4, 10, 7);

      ctx.fillStyle = isLit ? '#f7fafc' : '#1a1e2f';
      ctx.fillRect(gx - 6, gy + 2, 12, 2);

      ctx.fillStyle = isLit ? '#fff3bf' : '#0d101d';
      ctx.fillRect(gx - 3, gy + 5, 6, 3);
    }

    ctx.fillStyle = isLit ? '#f59e0b' : '#181d2f';
    ctx.beginPath();
    ctx.arc(cx, hubY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (isLit) {
      const wheelGlow = ctx.createRadialGradient(cx, hubY, 20, cx, hubY, wheelRadius + 15);
      wheelGlow.addColorStop(0, 'rgba(255, 235, 150, 0.15)');
      wheelGlow.addColorStop(0.8, 'rgba(255, 170, 70, 0.08)');
      wheelGlow.addColorStop(1, 'rgba(255, 170, 70, 0)');
      ctx.fillStyle = wheelGlow;
      ctx.beginPath();
      ctx.arc(cx, hubY, wheelRadius + 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- STREET LANTERNS & FESTOON LIGHTS ---

  private drawParkStreetLanterns(
    ctx: CanvasRenderingContext2D,
    time: number,
    darknessFactor: number,
    carouselLit: boolean,
    coasterLit: boolean,
    ferrisLit: boolean
  ) {
    const lamps = [
      { x: 135, y: 195, lit: carouselLit },
      { x: 260, y: 195, lit: coasterLit },
      { x: 345, y: 195, lit: ferrisLit },
    ];

    lamps.forEach((lamp) => {
      ctx.fillStyle = '#101322';
      ctx.fillRect(lamp.x - 1, lamp.y - 32, 2, 32);
      ctx.fillRect(lamp.x - 3, lamp.y - 2, 6, 2);

      ctx.fillRect(lamp.x - 4, lamp.y - 38, 8, 2);
      ctx.fillRect(lamp.x - 3, lamp.y - 32, 6, 2);

      if (lamp.lit) {
        ctx.fillStyle = '#fff4ba';
        ctx.fillRect(lamp.x - 2, lamp.y - 36, 4, 4);

        const pool = ctx.createRadialGradient(lamp.x, lamp.y - 2, 2, lamp.x, lamp.y - 2, 36);
        pool.addColorStop(0, 'rgba(255, 238, 160, 0.4)');
        pool.addColorStop(0.6, 'rgba(255, 200, 100, 0.12)');
        pool.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y - 2, 36, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#181c2e';
        ctx.fillRect(lamp.x - 2, lamp.y - 36, 4, 4);
      }
    });

    if (carouselLit || coasterLit || ferrisLit) {
      for (let i = 0; i < lamps.length - 1; i++) {
        const l1 = lamps[i];
        const l2 = lamps[i + 1];
        const isStringLit = l1.lit && l2.lit;

        ctx.strokeStyle = '#121626';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(l1.x, l1.y - 36);
        ctx.quadraticCurveTo((l1.x + l2.x) / 2, l1.y - 24, l2.x, l2.y - 36);
        ctx.stroke();

        for (let t = 0.2; t <= 0.8; t += 0.2) {
          const bx = l1.x + (l2.x - l1.x) * t;
          const by = (1 - t) * (1 - t) * (l1.y - 36) + 2 * (1 - t) * t * (l1.y - 24) + t * t * (l2.y - 36);
          if (isStringLit) {
            ctx.fillStyle = (Math.floor(t * 10) % 2 === 0) ? '#ffb703' : '#fb8500';
            ctx.fillRect(bx - 1, by, 2, 2);
          } else {
            ctx.fillStyle = '#151929';
            ctx.fillRect(bx - 1, by, 2, 2);
          }
        }
      }
    }
  }

  // --- REFINED NATURE PARTICLES (PRESERVING STILLNESS) ---

  private drawParkNature(ctx: CanvasRenderingContext2D, time: number, darknessFactor: number) {
    const grassColor = darknessFactor > 0.6 ? '#080d1a' : '#111728';
    ctx.fillStyle = grassColor;
    for (let x = 0; x < 480; x += 6) {
      const sway = Math.sin(time * 1.2 + x) * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, 270);
      ctx.lineTo(x + sway, 258 - ((x * 3) % 10));
      ctx.lineTo(x + 2, 270);
      ctx.fill();
    }

    const fireflyVisibility = 0.2 + darknessFactor * 0.8;
    this.fireflies.forEach((ff) => {
      ff.x += ff.vx;
      ff.y += ff.vy;
      if (ff.x < 30 || ff.x > 450) ff.vx *= -1;
      if (ff.y < 170 || ff.y > 265) ff.vy *= -1;

      const pulse = Math.sin(time * 1.8 + ff.phase);
      if (pulse > 0.15) {
        const alpha = (pulse * fireflyVisibility).toFixed(2);
        ctx.fillStyle = `rgba(180, 255, 120, ${alpha})`;
        ctx.fillRect(Math.floor(ff.x), Math.floor(ff.y), 2, 2);

        if (pulse > 0.7 && darknessFactor > 0.4) {
          ctx.fillStyle = `rgba(140, 240, 90, ${(parseFloat(alpha) * 0.25).toFixed(2)})`;
          ctx.fillRect(Math.floor(ff.x) - 1, Math.floor(ff.y) - 1, 4, 4);
        }
      }
    });

    this.leaves.forEach((lf) => {
      lf.x += lf.vx;
      lf.y += lf.vy + Math.sin(time * 0.8 + lf.x * 0.05) * 0.15;
      if (lf.x > 490) lf.x = -10;
      if (lf.y > 275) lf.y = 160;

      ctx.fillStyle = darknessFactor > 0.6 ? '#1b233a' : '#332724';
      ctx.fillRect(Math.floor(lf.x), Math.floor(lf.y), 2, 2);
    });
  }

  // =========================================================================
  // FIRST-PERSON POV RIDE RENDERERS
  // =========================================================================

  /**
   * CAROUSEL: FIRST-PERSON POV
   * The player is physically sitting on the saddle of a carousel horse,
   * looking outward at the nighttime amusement park spinning past!
   */
  public renderCarouselRide(
    ctx: CanvasRenderingContext2D,
    time: number,
    isLit: boolean,
    isShuttingDown: boolean,
    speed: number = 1.0
  ) {
    this.updateMotion(time, speed, false, false);

    ctx.clearRect(0, 0, 480, 270);

    // 1. OUTSIDE WORLD: The park rotating smoothly past the carousel opening
    // We render a panoramic background that wraps at 480 width
    const bgOffset = this.carouselRideOffset % 480;

    // Outdoor Night Sky
    this.renderNightSky(ctx, time, isLit ? 0.2 : 0.8, 1.0, 0, true);

    // Distant park landscape rotating horizontally
    for (let loop = -1; loop <= 1; loop++) {
      const offsetX = loop * 480 - bgOffset;

      // Distant hill & pine silhouettes
      ctx.fillStyle = '#060a16';
      ctx.beginPath();
      ctx.moveTo(offsetX, 160);
      ctx.lineTo(offsetX + 120, 145);
      ctx.lineTo(offsetX + 260, 155);
      ctx.lineTo(offsetX + 400, 140);
      ctx.lineTo(offsetX + 480, 150);
      ctx.lineTo(offsetX + 480, 270);
      ctx.lineTo(offsetX, 270);
      ctx.fill();

      // Distant Roller Coaster wooden silhouette passing by outside
      const coasterX = offsetX + 70;
      ctx.strokeStyle = '#181e30';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(coasterX - 40, 155);
      ctx.lineTo(coasterX, 90); // coaster summit
      ctx.lineTo(coasterX + 50, 140);
      ctx.stroke();

      // Distant Ferris Wheel passing by outside
      const ferrisX = offsetX + 340;
      ctx.strokeStyle = isLit ? '#38bdf8' : '#1a2238';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ferrisX, 105, 36, 0, Math.PI * 2);
      ctx.stroke();

      // Outside brick park pathway & vintage street lamps passing by
      const groundY = 168;
      ctx.fillStyle = '#0a0f20';
      ctx.fillRect(offsetX, groundY, 480, 60);

      // Outside park lamp posts
      const lampX1 = offsetX + 180;
      const lampX2 = offsetX + 420;
      [lampX1, lampX2].forEach((lx) => {
        ctx.fillStyle = '#101422';
        ctx.fillRect(lx - 1, groundY - 26, 2, 26);
        if (isLit) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(lx - 2, groundY - 30, 4, 4);
          const lampPool = ctx.createRadialGradient(lx, groundY, 2, lx, groundY, 30);
          lampPool.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          lampPool.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = lampPool;
          ctx.beginPath();
          ctx.arc(lx, groundY, 30, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 2. CAROUSEL PAVILION STRUCTURE (FOREGROUND FRAME)
    // Horse bobbing offset (affects the rider and the horse in front)
    const bob = Math.sin(this.horseBobPhase) * (8 * Math.min(1.0, speed * 1.2));

    // Wooden deck floor of the carousel platform
    const platformY = 210;
    ctx.fillStyle = isLit ? '#452210' : '#111522';
    ctx.fillRect(0, platformY, 480, 60);
    ctx.fillStyle = isLit ? '#673418' : '#181e30';
    ctx.fillRect(0, platformY, 480, 4);

    // Decorative brass railing of the carousel perimeter
    ctx.fillStyle = isLit ? '#d97706' : '#1e2538';
    ctx.fillRect(0, platformY - 14, 480, 3);
    for (let rx = 10; rx < 480; rx += 25) {
      ctx.fillRect(rx, platformY - 14, 2, 14);
    }

    // Carousel ceiling / ornate scalloped valance right overhead
    const valanceY = 32 + bob * 0.3;
    const valanceGrad = ctx.createLinearGradient(0, 0, 0, valanceY);
    valanceGrad.addColorStop(0, isLit ? '#881337' : '#0f172a');
    valanceGrad.addColorStop(1, isLit ? '#4c0519' : '#080d1a');
    ctx.fillStyle = valanceGrad;
    ctx.fillRect(0, 0, 480, valanceY);

    // Scalloped fringe & incandescent bulbs overhead
    for (let x = 0; x < 480; x += 30) {
      ctx.beginPath();
      ctx.arc(x + 15, valanceY, 15, 0, Math.PI);
      ctx.fillStyle = isLit ? '#9f1239' : '#111827';
      ctx.fill();

      // Bulb
      if (isLit) {
        const glow = Math.sin(time * 3 + x) > 0 ? '#ffea75' : '#ffa94d';
        ctx.fillStyle = glow;
        ctx.fillRect(x + 13, valanceY + 11, 4, 4);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 13, valanceY + 11, 4, 4);
      }
    }

    // 3. FIRST-PERSON CAROUSEL HORSE IN FRONT OF THE PLAYER
    // We are looking forward over the horse's neck and ears!
    const horseCenterX = 240;
    const horseBaseY = 175 + bob;

    // Polished Brass Pole rising straight up through the horse's back
    ctx.fillStyle = isLit ? '#f59e0b' : '#1e293b';
    ctx.fillRect(horseCenterX - 4, 0, 8, 270);
    ctx.fillStyle = isLit ? '#fef3c7' : '#334155';
    ctx.fillRect(horseCenterX - 2, 0, 2, 270); // reflection

    // Horse body/flanks seen from behind/above saddle
    ctx.fillStyle = isLit ? '#fdf8f0' : '#1e2230';
    ctx.beginPath();
    ctx.ellipse(horseCenterX, horseBaseY + 60, 55, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Saddle & blanket right under player's view
    ctx.fillStyle = isLit ? '#dc2626' : '#141824';
    ctx.fillRect(horseCenterX - 40, horseBaseY + 45, 80, 18);
    ctx.fillStyle = isLit ? '#fbbf24' : '#23293c';
    ctx.fillRect(horseCenterX - 42, horseBaseY + 60, 84, 4); // gold trim

    // Arched neck rising forward
    ctx.fillStyle = isLit ? '#fdf8f0' : '#1e2230';
    ctx.beginPath();
    ctx.moveTo(horseCenterX - 22, horseBaseY + 45);
    ctx.lineTo(horseCenterX - 14, horseBaseY - 25); // neck top
    ctx.lineTo(horseCenterX + 14, horseBaseY - 25);
    ctx.lineTo(horseCenterX + 22, horseBaseY + 45);
    ctx.closePath();
    ctx.fill();

    // Carved Head & Muzzle looking outward
    ctx.fillRect(horseCenterX - 16, horseBaseY - 45, 32, 25);
    ctx.fillRect(horseCenterX - 10, horseBaseY - 55, 20, 15); // muzzle tip

    // Pointed Ears
    ctx.beginPath();
    ctx.moveTo(horseCenterX - 14, horseBaseY - 45);
    ctx.lineTo(horseCenterX - 18, horseBaseY - 65);
    ctx.lineTo(horseCenterX - 8, horseBaseY - 45);
    ctx.moveTo(horseCenterX + 8, horseBaseY - 45);
    ctx.lineTo(horseCenterX + 18, horseBaseY - 65);
    ctx.lineTo(horseCenterX + 14, horseBaseY - 45);
    ctx.fill();

    // Flowing Golden Mane
    ctx.fillStyle = isLit ? '#d97706' : '#161a26';
    ctx.fillRect(horseCenterX - 18, horseBaseY - 20, 8, 40);
    ctx.fillRect(horseCenterX + 10, horseBaseY - 20, 8, 40);

    // Decorative Bridle & Reins draped forward
    ctx.strokeStyle = isLit ? '#b91c1c' : '#161924';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(horseCenterX - 12, horseBaseY - 40);
    ctx.lineTo(horseCenterX - 32, horseBaseY + 40);
    ctx.moveTo(horseCenterX + 12, horseBaseY - 40);
    ctx.lineTo(horseCenterX + 32, horseBaseY + 40);
    ctx.stroke();

    // Warm lantern glow over horse when illuminated
    if (isLit) {
      const riderGlow = ctx.createRadialGradient(horseCenterX, horseBaseY, 10, horseCenterX, horseBaseY, 160);
      riderGlow.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
      riderGlow.addColorStop(0.7, 'rgba(251, 146, 60, 0.08)');
      riderGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = riderGlow;
      ctx.fillRect(0, 0, 480, 270);
    }
  }

  /**
   * ROLLER COASTER CLIMB: FIRST-PERSON COCKPIT POV
   * The player sits inside the front car, looking forward along the actual steel track
   * that connects directly beneath the car and climbs into the sky!
   */
  public renderCoasterClimb(ctx: CanvasRenderingContext2D, time: number, climbProgress: number = 0.5) {
    ctx.clearRect(0, 0, 480, 270);

    // As coaster climbs, ground sinks and night sky fills the view
    this.renderNightSky(ctx, time, 0.35 + climbProgress * 0.4, 1.25, 10);

    // Distant park station lights sinking down below
    const stationY = 170 + climbProgress * 70;
    if (stationY < 265) {
      ctx.fillStyle = '#070a14';
      ctx.fillRect(0, stationY, 480, 270 - stationY);
      // Small ground lights
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.fillRect(120, stationY + 10, 8, 6);
      ctx.fillRect(340, stationY + 14, 10, 6);
    }

    // THE TRACK RAILS: Physically emerging from directly beneath the car
    // Left rail from (x: 80, y: 270) to crest at (x: 220, y: 55)
    // Right rail from (x: 400, y: 270) to crest at (x: 260, y: 55)
    const crestY = 55;
    const crestLeftX = 222;
    const crestRightX = 258;

    // Wooden Trestle framework beneath the rails
    ctx.strokeStyle = '#422c22';
    ctx.lineWidth = 2;
    for (let y = crestY + 15; y < 270; y += 30) {
      const p = (y - crestY) / (270 - crestY);
      const lx = crestLeftX - p * 142;
      const rx = crestRightX + p * 142;
      // Cross beams
      ctx.beginPath();
      ctx.moveTo(lx - 25, y);
      ctx.lineTo(rx + 25, y);
      ctx.stroke();
    }

    // Railway Cross-Ties (scrolling continuously downward to communicate climbing!)
    const tieScroll = (time * 65) % 24;
    ctx.fillStyle = '#5c4033';
    for (let ty = crestY + 10; ty < 270; ty += 20) {
      const scrolledY = ty + tieScroll * 0.8;
      if (scrolledY > crestY + 8 && scrolledY < 270) {
        const p = (scrolledY - crestY) / (270 - crestY);
        const lx = crestLeftX - p * 142;
        const rx = crestRightX + p * 142;
        ctx.fillRect(lx, scrolledY - 3, rx - lx, 6);
      }
    }

    // Iron Lift Chain right down the center channel
    ctx.fillStyle = '#1c1917';
    for (let cy = crestY + 10; cy < 270; cy += 12) {
      const scrolledY = cy + tieScroll * 0.8;
      if (scrolledY > crestY + 5 && scrolledY < 270) {
        ctx.fillRect(238, scrolledY - 2, 4, 6);
      }
    }

    // Steel Tubular Rails (Left and Right)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(80, 270);
    ctx.lineTo(crestLeftX, crestY);
    ctx.moveTo(400, 270);
    ctx.lineTo(crestRightX, crestY);
    ctx.stroke();

    // Rail specular highlight
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 270);
    ctx.lineTo(crestLeftX, crestY);
    ctx.moveTo(400, 270);
    ctx.lineTo(crestRightX, crestY);
    ctx.stroke();

    // Track Summit Crest ahead (levels out over the top)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(crestLeftX, crestY);
    ctx.lineTo(crestLeftX - 10, crestY - 4);
    ctx.moveTo(crestRightX, crestY);
    ctx.lineTo(crestRightX + 10, crestY - 4);
    ctx.stroke();

    // Red beacon light at the summit peak
    const beaconGlow = Math.sin(time * 4) > 0 ? '#ef4444' : '#7f1d1d';
    ctx.fillStyle = beaconGlow;
    ctx.fillRect(crestRightX + 14, crestY - 14, 5, 5);

    // FIRST-PERSON CAR COCKPIT (The car you are physically sitting in)
    // Wheel bogies locking directly onto the rails at bottom corners
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(60, 235, 36, 35); // left wheel cover
    ctx.fillRect(384, 235, 36, 35); // right wheel cover
    ctx.fillStyle = '#475569';
    ctx.fillRect(66, 245, 24, 18);
    ctx.fillRect(390, 245, 24, 18);

    // Front Hood & Cowling of the Coaster Car
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(90, 270);
    ctx.lineTo(130, 215);
    ctx.lineTo(350, 215);
    ctx.lineTo(390, 270);
    ctx.closePath();
    ctx.fill();

    // Chrome trim on car nose
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(130, 215, 220, 5);

    // Car Headlights on front cowling
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(150, 225, 20, 10);
    ctx.fillRect(310, 225, 20, 10);

    // Safety Lap Bar / Handrail right in front of the rider
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(100, 252, 280, 8);
    ctx.fillStyle = '#475569';
    ctx.fillRect(100, 250, 280, 2); // highlight
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(130, 258, 8, 12);
    ctx.fillRect(342, 258, 8, 12);
  }

  // --- ROLLER COASTER PEAK: LOOK UP (TOTAL COSMIC STILLNESS) ---
  public renderCoasterLookUp(ctx: CanvasRenderingContext2D, time: number) {
    ctx.clearRect(0, 0, 480, 270);

    const skyGrad = ctx.createRadialGradient(240, 135, 10, 240, 135, 260);
    skyGrad.addColorStop(0, '#0a102b');
    skyGrad.addColorStop(0.5, '#050718');
    skyGrad.addColorStop(1, '#02030a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 480, 270);

    const galaxyGrad = ctx.createLinearGradient(0, 0, 480, 270);
    galaxyGrad.addColorStop(0, 'rgba(30, 45, 90, 0)');
    galaxyGrad.addColorStop(0.45, 'rgba(65, 80, 140, 0.18)');
    galaxyGrad.addColorStop(0.55, 'rgba(80, 100, 170, 0.22)');
    galaxyGrad.addColorStop(1, 'rgba(30, 45, 90, 0)');
    ctx.fillStyle = galaxyGrad;
    ctx.fillRect(0, 0, 480, 270);

    this.stars.forEach((star, idx) => {
      const pulse = Math.sin(time * (star.pulseSpeed * 0.7) + idx) * 0.15;
      const alpha = Math.min(1.0, star.brightness + pulse + 0.15);
      ctx.fillStyle = `rgba(240, 245, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(star.x, star.y + 40, star.size + 1, star.size + 1);

      if (idx % 8 === 0) {
        ctx.fillStyle = `rgba(210, 230, 255, 0.35)`;
        ctx.fillRect(star.x - 2, star.y + 40, 6, 1);
        ctx.fillRect(star.x, star.y + 38, 1, 6);
      }
    });

    const mx = 240;
    const my = 120;
    const mRadius = 48;

    const moonBloom = ctx.createRadialGradient(mx, my, mRadius * 0.6, mx, my, mRadius * 2.6);
    moonBloom.addColorStop(0, 'rgba(250, 252, 255, 0.5)');
    moonBloom.addColorStop(0.5, 'rgba(210, 230, 255, 0.15)');
    moonBloom.addColorStop(1, 'rgba(210, 230, 255, 0)');
    ctx.fillStyle = moonBloom;
    ctx.beginPath();
    ctx.arc(mx, my, mRadius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#faf8ea';
    ctx.beginPath();
    ctx.arc(mx, my, mRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d8dedf';
    ctx.fillRect(mx - 24, my - 22, 20, 16);
    ctx.fillRect(mx - 8, my + 4, 30, 22);
    ctx.fillRect(mx - 32, my + 8, 18, 16);
    ctx.fillRect(mx + 8, my - 28, 16, 14);

    ctx.fillStyle = '#b4bdc2';
    ctx.fillRect(mx - 20, my - 18, 12, 10);
    ctx.fillRect(mx - 4, my + 8, 18, 14);

    const cloudShift = (time * 0.8) % 520 - 60;
    this.drawPixelCloud(ctx, cloudShift, my - 10, 90, 12, 0.2);

    // Catwalk railing silhouette at very bottom
    ctx.fillStyle = '#060810';
    ctx.fillRect(232, 258, 16, 12);
    ctx.fillRect(180, 266, 120, 4);
  }

  /**
   * ROLLER COASTER PEAK: LOOK DOWN
   * Clearly recognizable bird's-eye view of the amusement park below!
   * Shows the dark carousel, paths, street lamps, ticket booths, and Ferris wheel.
   */
  public renderCoasterLookDown(
    ctx: CanvasRenderingContext2D,
    time: number,
    carouselShutdown: boolean,
    ferrisLit: boolean
  ) {
    ctx.clearRect(0, 0, 480, 270);

    // Deep nocturnal ground gradient
    const groundGrad = ctx.createLinearGradient(0, 0, 0, 270);
    groundGrad.addColorStop(0, '#040711');
    groundGrad.addColorStop(1, '#090e1c');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 0, 480, 270);

    // Surrounding perimeter dark pine woods
    ctx.fillStyle = '#050914';
    for (let x = 0; x < 480; x += 16) {
      ctx.fillRect(x, 10, 14, 25);
      ctx.fillRect(x, 235, 14, 25);
    }
    for (let y = 30; y < 240; y += 18) {
      ctx.fillRect(10, y, 22, 14);
      ctx.fillRect(448, y, 22, 14);
    }

    // THE RECOGNIZABLE PARK FROM ABOVE:
    // Brick pathways winding across the courtyard
    ctx.fillStyle = '#141c30';
    // Main central avenue
    ctx.fillRect(80, 125, 320, 26);
    // Path branching to carousel
    ctx.fillRect(100, 60, 24, 75);
    // Path branching to coaster station
    ctx.fillRect(228, 145, 24, 80);
    // Path branching to Ferris wheel
    ctx.fillRect(340, 60, 24, 75);

    // Park entrance arch & ticket booth at bottom-center
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(215, 210, 50, 18); // ticket booth roof
    ctx.fillStyle = '#334155';
    ctx.fillRect(225, 218, 30, 4);

    // CAROUSEL PAVILION (Left side of park)
    const carX = 112;
    const carY = 65;
    // Circular platform base
    ctx.fillStyle = carouselShutdown ? '#0f172a' : '#451a03';
    ctx.beginPath();
    ctx.arc(carX, carY, 32, 0, Math.PI * 2);
    ctx.fill();

    // Conical striped roof
    ctx.fillStyle = carouselShutdown ? '#1e293b' : '#b91c1c';
    ctx.beginPath();
    ctx.arc(carX, carY, 26, 0, Math.PI * 2);
    ctx.fill();

    if (!carouselShutdown) {
      // Golden roof finial & rotating warm lights
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(carX, carY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Perimeter incandescent bulbs glowing
      for (let a = 0; a < 8; a++) {
        const rad = (a * Math.PI * 2) / 8 + time * 0.8;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(carX + Math.cos(rad) * 28 - 2, carY + Math.sin(rad) * 28 - 2, 4, 4);
      }
    } else {
      // Dormant center finial
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(carX, carY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // FERRIS WHEEL (Right side of park)
    const fX = 352;
    const fY = 70;
    // Wheel support base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(fX - 25, fY + 18, 50, 10);

    // Circular rim seen from high angle
    ctx.strokeStyle = ferrisLit ? '#38bdf8' : '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(fX, fY, 34, 28, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (ferrisLit) {
      for (let a = 0; a < 8; a++) {
        const rad = (a * Math.PI * 2) / 8 + this.parkFerrisAngle;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(fX + Math.cos(rad) * 34 - 2, fY + Math.sin(rad) * 28 - 2, 4, 4);
      }
    }

    // Street Lamps casting light pools across the paths
    const lamps = [
      { x: 160, y: 138, lit: !carouselShutdown },
      { x: 240, y: 138, lit: true },
      { x: 300, y: 138, lit: ferrisLit },
    ];
    lamps.forEach((lp) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lp.x - 2, lp.y - 8, 4, 8);
      if (lp.lit) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lp.x - 1, lp.y - 10, 3, 3);
        const pool = ctx.createRadialGradient(lp.x, lp.y, 2, lp.x, lp.y, 24);
        pool.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        pool.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // FOREGROUND: The High Coaster Track Railing you are leaning over
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 255);
    ctx.lineTo(480, 255);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    for (let bx = 20; bx < 480; bx += 40) {
      ctx.fillRect(bx, 255, 6, 15);
    }
  }

  // --- ROLLER COASTER DROP / SWOOP (SMOOTH & CONTROLLED) ---
  public renderCoasterDrop(ctx: CanvasRenderingContext2D, time: number, dropProgress: number) {
    ctx.clearRect(0, 0, 480, 270);

    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, 480, 270);

    // Natural swooping drop curve
    const swoopY = Math.sin(dropProgress * Math.PI) * 45;
    const hoodY = 160 + swoopY;

    // Smooth aerodynamic wind streaks
    const streakSpeed = 280 * Math.sin(dropProgress * Math.PI);
    for (let i = 0; i < 28; i++) {
      const angle = (i * 23) % 360;
      const dist = ((time * streakSpeed + i * 40) % 260);
      const x = 240 + Math.cos(angle) * dist;
      const y = 135 + Math.sin(angle) * dist;
      const lineLen = 15 + Math.sin(dropProgress * Math.PI) * 35;

      ctx.strokeStyle = i % 3 === 0 ? 'rgba(255, 180, 50, 0.55)' : 'rgba(200, 220, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * lineLen, y + Math.sin(angle) * lineLen);
      ctx.stroke();
    }

    // Coaster car nose (smooth, fluid swooping motion without random jitter)
    ctx.fillStyle = '#d62828';
    ctx.beginPath();
    ctx.moveTo(100, 270);
    ctx.lineTo(240, hoodY);
    ctx.lineTo(380, 270);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(236, hoodY, 8, 270 - hoodY);
    ctx.fillStyle = '#ffee32';
    ctx.fillRect(170, hoodY + 35, 14, 10);
    ctx.fillRect(296, hoodY + 35, 14, 10);

    ctx.fillStyle = `rgba(255, 255, 255, ${(0.08 * Math.sin(dropProgress * Math.PI)).toFixed(2)})`;
    ctx.fillRect(0, 0, 480, 270);
  }

  /**
   * FERRIS WHEEL: FIRST-PERSON GONDOLA POV
   * Differentiates dramatically between GROUND (loading dock, ticket booth, wheel legs, no moon)
   * and PEAK (high above the shut-down park under the moon and stars).
   */
  public renderFerrisWheelRide(
    ctx: CanvasRenderingContext2D,
    time: number,
    altitudeProgress: number, // 0.0 = Ground, 1.0 = Peak
    isLit: boolean,
    isMoving: boolean = true
  ) {
    ctx.clearRect(0, 0, 480, 270);

    // At Ground (progress < 0.25), moon is blocked by the giant wheel overhead!
    const showMoon = altitudeProgress > 0.3;
    const horizonY = 175 + altitudeProgress * 80;
    const skyDarkness = 0.35 + altitudeProgress * 0.6;

    this.renderNightSky(ctx, time, skyDarkness, 1.25, -12 * altitudeProgress, showMoon);

    // 1. BACKGROUND SCENERY ACCORDING TO ALTITUDE
    if (altitudeProgress < 0.35) {
      // GROUND VIEW: You are sitting at the boarding platform!
      // Close-up view of the amusement park facilities:
      const groundY = 170;

      // Dark park ground
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, groundY, 480, 100);

      // Wooden boarding dock platform with yellow hazard stripe
      ctx.fillStyle = '#3a2d24';
      ctx.fillRect(40, groundY + 15, 400, 45);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(40, groundY + 15, 400, 4); // caution stripe

      // Queue line stanchions with chains
      ctx.fillStyle = '#475569';
      for (let qx = 60; qx <= 420; qx += 45) {
        ctx.fillRect(qx, groundY + 5, 3, 20);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(qx - 1, groundY + 4, 5, 3);
        ctx.fillStyle = '#475569';
      }

      // Ticket / Operator Booth next to platform
      const boothX = 75;
      const boothY = groundY - 35;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(boothX, boothY, 65, 45); // booth walls
      ctx.fillStyle = '#334155';
      ctx.fillRect(boothX - 4, boothY - 6, 73, 8); // roof
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(boothX + 12, boothY + 8, 40, 20); // dark window
      ctx.fillStyle = '#f8fafc';
      ctx.font = '7px monospace';
      ctx.fillText('OPERATOR', boothX + 14, boothY + 20);

      // Wheel drive motor & generator crate with cables
      ctx.fillStyle = '#111827';
      ctx.fillRect(340, groundY + 10, 45, 25);
      ctx.fillStyle = '#374151';
      ctx.fillRect(345, groundY + 14, 15, 6);

      // Massive Steel A-Frame Legs of the Wheel rising on either side
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(30, 270);
      ctx.lineTo(90, 0); // rising to hub above
      ctx.moveTo(450, 270);
      ctx.lineTo(390, 0);
      ctx.stroke();

      // Cross-bracing on wheel legs
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(35, 200);
      ctx.lineTo(75, 120);
      ctx.moveTo(445, 200);
      ctx.lineTo(405, 120);
      ctx.stroke();

      // In background: shut down carousel pavilion seen at ground level
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(170, groundY - 20, 60, 25);
      ctx.beginPath();
      ctx.moveTo(170, groundY - 20);
      ctx.lineTo(200, groundY - 35);
      ctx.lineTo(230, groundY - 20);
      ctx.fill();
    } else {
      // HIGH / PEAK VIEW: High above the sleeping amusement park!
      // Distant dark hills and horizon
      ctx.fillStyle = '#060914';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(120, horizonY - 15);
      ctx.lineTo(280, horizonY - 8);
      ctx.lineTo(480, horizonY - 20);
      ctx.lineTo(480, 270);
      ctx.lineTo(0, 270);
      ctx.closePath();
      ctx.fill();

      // Miniature amusement park below, completely shut down and dark
      const parkScale = 0.85 - altitudeProgress * 0.45;
      const parkY = horizonY + 8;

      // Dark carousel dome below
      ctx.fillStyle = '#0d1322';
      ctx.beginPath();
      ctx.arc(95, parkY + 15 * parkScale, 24 * parkScale, 0, Math.PI * 2);
      ctx.fill();

      // Dark coaster wooden trestles below
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(170, parkY - 12 * parkScale, 90 * parkScale, 30 * parkScale);

      // Dark empty walkways
      ctx.fillStyle = '#111728';
      ctx.fillRect(70, parkY + 28 * parkScale, 280 * parkScale, 6 * parkScale);
    }

    // 2. GONDOLA FRAME (FIRST-PERSON VIEWPOINT FROM INSIDE)
    // The player sits behind the brass safety railing looking out
    const swayAmp = isMoving ? 1.2 : 0.25;
    const sway = Math.sin(time * 0.8) * swayAmp * (1.0 + altitudeProgress * 0.5);

    // Gondola ceiling canopy
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(480, 0);
    ctx.lineTo(480, 42);
    ctx.quadraticCurveTo(240, 22 + sway * 0.3, 0, 42);
    ctx.closePath();
    ctx.fill();

    // Side metal struts
    ctx.fillStyle = '#334155';
    ctx.fillRect(18 + sway, 0, 8, 270);
    ctx.fillRect(454 + sway, 0, 8, 270);
    ctx.fillRect(125 + sway, 0, 6, 270);
    ctx.fillRect(348 + sway, 0, 6, 270);

    // Front safety bar / brass handrail in immediate foreground
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 215, 480, 55);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 212, 480, 4); // brass handrail top
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 213, 480, 1);

    ctx.fillStyle = '#78350f';
    for (let rx = 15; rx < 480; rx += 30) {
      ctx.fillRect(rx, 218, 3, 3);
    }

    // Small interior gondola lamp (extinguishes on shutdown)
    if (isLit) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(238 + sway * 0.2, 36, 5, 5);
      const lanternGlow = ctx.createRadialGradient(240 + sway * 0.2, 38, 2, 240 + sway * 0.2, 38, 55);
      lanternGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      lanternGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(240 + sway * 0.2, 38, 55, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(238 + sway * 0.2, 36, 5, 5);
    }
  }

  // --- FINAL SCENE: THE PARK IS QUIET ---
  public renderQuietParkFinal(ctx: CanvasRenderingContext2D, time: number, revealAlpha: number) {
    ctx.clearRect(0, 0, 480, 270);

    if (revealAlpha <= 0.01) {
      ctx.fillStyle = '#030408';
      ctx.fillRect(0, 0, 480, 270);
      return;
    }

    this.renderNightSky(ctx, time, 1.0, 1.25);
    this.renderHorizonAndDistantTrees(ctx, 1.0);

    const groundGrad = ctx.createLinearGradient(0, 170, 0, 270);
    groundGrad.addColorStop(0, '#090e1c');
    groundGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 170, 480, 100);

    ctx.fillStyle = '#0b1122';
    for (let py = 185; py < 270; py += 12) {
      const shift = ((py / 12) % 2) * 14;
      for (let px = -20; px < 500; px += 28) {
        ctx.fillRect(px + shift, py, 26, 10);
      }
    }

    this.drawParkCarousel(ctx, 80, 175, time, false, false);
    this.drawParkCoaster(ctx, 230, 175, time, false, false);
    this.drawParkFerrisWheel(ctx, 400, 168, time, false, false);

    this.drawParkStreetLanterns(ctx, time, 1.0, false, false, false);
    this.drawParkNature(ctx, time, 1.0);

    const moonBeam = ctx.createLinearGradient(390, 40, 200, 270);
    moonBeam.addColorStop(0, 'rgba(215, 235, 255, 0.08)');
    moonBeam.addColorStop(0.5, 'rgba(180, 210, 255, 0.04)');
    moonBeam.addColorStop(1, 'rgba(180, 210, 255, 0)');
    ctx.fillStyle = moonBeam;
    ctx.fillRect(0, 0, 480, 270);

    if (revealAlpha < 1.0) {
      ctx.fillStyle = `rgba(3, 4, 8, ${(1 - revealAlpha).toFixed(2)})`;
      ctx.fillRect(0, 0, 480, 270);
    }
  }
}

export const pixelRenderer = new PixelArtRenderer();
