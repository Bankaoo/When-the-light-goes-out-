/**
 * 2D Pixel Art Canvas Rendering Engine
 * Operates at native 480x270 (16:9) pixel resolution.
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
        brightness: 0.3 + Math.random() * 0.7,
        pulseSpeed: 1 + Math.random() * 2.5,
        size: Math.random() > 0.85 ? 2 : 1,
      });
    }
  }

  private initFireflies() {
    this.fireflies = [];
    for (let i = 0; i < 28; i++) {
      this.fireflies.push({
        x: 40 + Math.random() * 400,
        y: 170 + Math.random() * 85,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        glow: 0.5,
      });
    }
  }

  private initLeaves() {
    this.leaves = [];
    for (let i = 0; i < 14; i++) {
      this.leaves.push({
        x: Math.random() * 480,
        y: Math.random() * 270,
        vx: 0.4 + Math.random() * 0.8,
        vy: 0.2 + Math.random() * 0.4,
        angle: Math.random() * 360,
      });
    }
  }

  // --- SKY & ASTRONOMY RENDERING ---

  public renderNightSky(
    ctx: CanvasRenderingContext2D,
    time: number,
    darknessFactor: number = 0, // 0 = early night, 1 = deep silent night
    moonSizeMultiplier: number = 1.0,
    moonYOffset: number = 0
  ) {
    // Gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    if (darknessFactor > 0.6) {
      // Deeper, purer midnight blue-black with high star contrast
      skyGrad.addColorStop(0, '#04050e');
      skyGrad.addColorStop(0.6, '#080d1e');
      skyGrad.addColorStop(1, '#0e172e');
    } else {
      // Warm amusement park artificial light pollution reflecting on clouds
      skyGrad.addColorStop(0, '#060817');
      skyGrad.addColorStop(0.5, '#0c132c');
      skyGrad.addColorStop(1, '#1b1b3a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 480, 200);

    // Stars
    this.stars.forEach((star, index) => {
      // If early night with lights, faint stars are masked by park glow;
      // as park goes dark, stars shine much more brilliantly
      const baseAlpha = darknessFactor > 0.5 ? star.brightness : star.brightness * 0.65;
      const pulse = Math.sin(time * star.pulseSpeed + index) * 0.25;
      const alpha = Math.max(0.1, Math.min(1.0, baseAlpha + pulse));

      ctx.fillStyle = `rgba(235, 243, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);

      // Star cross sparkle for larger stars
      if (star.size === 2 && alpha > 0.7) {
        ctx.fillStyle = `rgba(215, 230, 255, ${(alpha * 0.4).toFixed(2)})`;
        ctx.fillRect(star.x - 1, star.y, 4, 1);
        ctx.fillRect(star.x, star.y - 1, 1, 4);
      }
    });

    // Occasional subtle shooting star
    if (Math.random() < 0.004 && this.shootingStars.length < 2) {
      this.shootingStars.push({
        x: 100 + Math.random() * 250,
        y: 20 + Math.random() * 50,
        vx: 3 + Math.random() * 3,
        vy: 1.5 + Math.random() * 1.5,
        life: 0,
        maxLife: 24,
      });
    }

    // Update shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life++;
      const lifePct = 1 - s.life / s.maxLife;
      if (lifePct <= 0) {
        this.shootingStars.splice(i, 1);
      } else {
        ctx.strokeStyle = `rgba(255, 255, 230, ${(lifePct * 0.8).toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3);
        ctx.stroke();
      }
    }

    // Moon: Pixel-crafted pale crescent/full gibbous moon
    const moonX = 390;
    const moonY = 46 + moonYOffset;
    const radius = 18 * moonSizeMultiplier;

    // Moon atmospheric outer glow
    const moonGlow = ctx.createRadialGradient(moonX, moonY, radius * 0.5, moonX, moonY, radius * 2.8);
    moonGlow.addColorStop(0, `rgba(240, 245, 255, ${0.35 + darknessFactor * 0.15})`);
    moonGlow.addColorStop(0.5, `rgba(200, 220, 255, ${0.12 + darknessFactor * 0.08})`);
    moonGlow.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, radius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    ctx.fillStyle = '#f8f6e8';
    ctx.beginPath();
    ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Moon pixel craters & mare texture
    ctx.fillStyle = '#d6dbdc';
    ctx.fillRect(moonX - radius * 0.4, moonY - radius * 0.3, radius * 0.35, radius * 0.25);
    ctx.fillRect(moonX - radius * 0.1, moonY + radius * 0.1, radius * 0.45, radius * 0.3);
    ctx.fillRect(moonX - radius * 0.5, moonY + radius * 0.2, radius * 0.25, radius * 0.2);
    ctx.fillStyle = '#bac2c7';
    ctx.fillRect(moonX - radius * 0.3, moonY - radius * 0.2, radius * 0.2, radius * 0.15);

    // Drifting thin translucent clouds
    const cloudOffset1 = (time * 1.5) % 560 - 80;
    const cloudOffset2 = (time * 0.9 + 200) % 560 - 80;
    this.drawPixelCloud(ctx, cloudOffset1, 55, 65, 12, 0.18);
    this.drawPixelCloud(ctx, cloudOffset2, 85, 90, 16, 0.14);
  }

  private drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
    ctx.fillStyle = `rgba(180, 195, 225, ${alpha.toFixed(2)})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    ctx.fillRect(Math.floor(x + 10), Math.floor(y - 4), Math.floor(w - 20), Math.floor(h + 8));
    ctx.fillRect(Math.floor(x + 20), Math.floor(y - 7), Math.floor(w - 40), Math.floor(h + 12));
  }

  // --- DISTANT LANDSCAPE & HORIZON ---

  public renderHorizonAndDistantTrees(ctx: CanvasRenderingContext2D, darknessFactor: number) {
    // Distant mountain ridge
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

    // Midground pine tree silhouettes
    ctx.fillStyle = darknessFactor > 0.6 ? '#050812' : '#0a0f1d';
    for (let x = 10; x < 480; x += 18) {
      const treeH = 22 + ((x * 7) % 15);
      const baseY = 175;
      // Triangular pine
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
    ctx.clearRect(0, 0, 480, 270);

    // 1. Sky & astronomy
    this.renderNightSky(ctx, time, state.darknessFactor);
    this.renderHorizonAndDistantTrees(ctx, state.darknessFactor);

    // 2. Midground ground level & brick promenade
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

    // Brick walkway pattern
    ctx.fillStyle = state.darknessFactor > 0.6 ? '#0b1122' : '#1a1f3c';
    for (let py = 185; py < 270; py += 12) {
      const shift = ((py / 12) % 2) * 14;
      for (let px = -20; px < 500; px += 28) {
        ctx.fillRect(px + shift, py, 26, 10);
      }
    }

    // 3. Rides on main park stage:
    // Left: Carousel Pavilion (x: 25 to 135)
    this.drawParkCarousel(ctx, 80, 175, time, state.carouselLit, state.carouselRiding);

    // Center-Right: Roller Coaster Wooden Trestles & Track (x: 140 to 320)
    this.drawParkCoaster(ctx, 230, 175, time, state.coasterLit, state.coasterRiding);

    // Far Right: Ferris Wheel (x: 340 to 455)
    this.drawParkFerrisWheel(ctx, 400, 168, time, state.ferrisLit, state.ferrisRiding);

    // 4. Street Lanterns & Festoon Lights across the promenade
    this.drawParkStreetLanterns(ctx, time, state.darknessFactor, state.carouselLit, state.coasterLit, state.ferrisLit);

    // 5. Environmental details: fireflies, swaying grass blades
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

    // Platform base
    ctx.fillStyle = isLit ? '#3a302a' : '#14141e';
    ctx.fillRect(cx - width / 2, baseY - 12, width, 12);
    ctx.fillStyle = isLit ? '#d4a373' : '#1a1a28';
    ctx.fillRect(cx - width / 2 + 4, baseY - 16, width - 8, 4);

    // Central ornate pillar
    ctx.fillStyle = isLit ? '#ecd6a8' : '#161929';
    ctx.fillRect(cx - 10, topY + 24, 20, height - 38);

    // Rotating canopy roof (striped red/cream or dark navy)
    const roofTop = topY + 6;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx - width / 2 - 4, roofTop + 24);
    ctx.lineTo(cx + width / 2 + 4, roofTop + 24);
    ctx.closePath();
    ctx.fillStyle = isLit ? '#b02a30' : '#111320';
    ctx.fill();

    // Canopy stripes
    if (isLit) {
      const stripeOffset = isSpinning ? (time * 1.5) % 24 : 0;
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

    // Top gold finial & flag
    ctx.fillStyle = isLit ? '#f5c542' : '#22253b';
    ctx.fillRect(cx - 2, topY - 10, 4, 10);
    ctx.fillStyle = isLit ? '#e63946' : '#1c1f36';
    ctx.fillRect(cx + 2, topY - 10, 10, 6);

    // Canopy fringe bulbs
    const bulbY = roofTop + 24;
    for (let bx = cx - width / 2 + 2; bx <= cx + width / 2 - 2; bx += 10) {
      if (isLit) {
        const glow = Math.sin(time * 3 + bx) > 0 ? '#ffea75' : '#ffa94d';
        ctx.fillStyle = glow;
        ctx.fillRect(bx, bulbY, 4, 4);
      } else {
        ctx.fillStyle = '#1c2033';
        ctx.fillRect(bx, bulbY, 4, 4);
      }
    }

    // Carousel poles & horses
    const horseSpacing = 22;
    for (let i = -1; i <= 1; i++) {
      const hx = cx + i * horseSpacing;
      // Brass pole
      ctx.fillStyle = isLit ? '#f5c542' : '#21253a';
      ctx.fillRect(hx - 1, topY + 28, 2, height - 44);

      // Horse silhouette/bobbing
      const bob = isSpinning ? Math.sin(time * 3 + i * 1.6) * 5 : 0;
      const hy = baseY - 24 + bob;

      // Small pixel horse
      ctx.fillStyle = isLit ? (i === 0 ? '#ffffff' : '#d4a373') : '#181b2c';
      // Body
      ctx.fillRect(hx - 8, hy, 16, 7);
      // Neck & head
      ctx.fillRect(hx + 5, hy - 6, 6, 8);
      ctx.fillRect(hx + 9, hy - 6, 4, 4);
      // Saddle
      if (isLit) {
        ctx.fillStyle = '#e63946';
        ctx.fillRect(hx - 3, hy - 1, 6, 4);
      }
      // Legs
      ctx.fillStyle = isLit ? '#c49363' : '#131524';
      ctx.fillRect(hx - 7, hy + 7, 2, 6);
      ctx.fillRect(hx + 5, hy + 7, 2, 6);
    }

    // Ambient warm ground pool when lit
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

    // Wooden trestle framework
    ctx.strokeStyle = trestleColor;
    ctx.lineWidth = 1.5;

    // Lift hill peak at (cx - 50, baseY - 110)
    // Trestle vertical beams
    const trestleX = [cx - 70, cx - 50, cx - 25, cx, cx + 30, cx + 65];
    trestleX.forEach((tx) => {
      const topBeamY = tx < cx - 50 ? baseY - 60 - (tx - (cx - 70)) * 2.5 : baseY - 110 + (tx - (cx - 50)) * 0.8;
      ctx.beginPath();
      ctx.moveTo(tx, topBeamY);
      ctx.lineTo(tx, baseY);
      ctx.stroke();

      // Cross braces
      for (let by = topBeamY + 14; by < baseY; by += 20) {
        ctx.beginPath();
        ctx.moveTo(tx - 10, by);
        ctx.lineTo(tx + 10, by);
        ctx.moveTo(tx - 10, by);
        ctx.lineTo(tx + 10, by + 18);
        ctx.stroke();
      }
    });

    // Roller coaster track rails (curved swooping line)
    ctx.beginPath();
    ctx.moveTo(cx - 85, baseY - 35);
    ctx.lineTo(cx - 50, baseY - 112); // Summit
    ctx.quadraticCurveTo(cx - 15, baseY - 112, cx + 5, baseY - 60); // Drop dip
    ctx.quadraticCurveTo(cx + 35, baseY - 30, cx + 75, baseY - 70); // Hill 2
    ctx.lineTo(cx + 90, baseY - 40);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = railColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red warning beacon at the peak
    if (isLit) {
      const beaconGlow = Math.sin(time * 4) > 0 ? '#ff3344' : '#881111';
      ctx.fillStyle = beaconGlow;
      ctx.fillRect(cx - 52, baseY - 116, 4, 4);

      // Station queue warm lights
      ctx.fillStyle = '#ffdf75';
      ctx.fillRect(cx - 85, baseY - 28, 16, 6);
    } else {
      ctx.fillStyle = '#1c2032';
      ctx.fillRect(cx - 52, baseY - 116, 4, 4);
    }

    // Coaster car train
    let carX = cx - 50;
    let carY = baseY - 115;
    if (isRiding) {
      // Moving along track
      const progress = (time * 0.45) % 1;
      if (progress < 0.4) {
        // Climbing lift hill
        const climbPct = progress / 0.4;
        carX = cx - 85 + climbPct * 35;
        carY = baseY - 35 - climbPct * 77;
      } else {
        // Dropping
        const dropPct = (progress - 0.4) / 0.6;
        carX = cx - 50 + dropPct * 130;
        carY = baseY - 112 + Math.sin(dropPct * Math.PI) * 65;
      }
    }

    // Render coaster car
    ctx.fillStyle = isLit ? '#d62828' : '#141724';
    ctx.fillRect(carX - 6, carY - 4, 14, 5);
    ctx.fillStyle = isLit ? '#fdf0d5' : '#1a1d2e';
    ctx.fillRect(carX - 4, carY - 7, 10, 3);
    if (isLit) {
      // Headlight
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
    const rotationAngle = isTurning ? (time * 0.25) : 0.4;

    // Support A-frame legs
    ctx.strokeStyle = isLit ? '#4a5568' : '#151928';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, hubY);
    ctx.lineTo(cx - 30, baseY);
    ctx.moveTo(cx, hubY);
    ctx.lineTo(cx + 30, baseY);
    ctx.stroke();

    // Cross brace on A-frame
    ctx.beginPath();
    ctx.moveTo(cx - 15, baseY - 28);
    ctx.lineTo(cx + 15, baseY - 28);
    ctx.stroke();

    // Wheel outer rim
    ctx.strokeStyle = isLit ? '#718096' : '#191f32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, hubY, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Wheel inner concentric rim
    ctx.strokeStyle = isLit ? '#4a5568' : '#141828';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, hubY, wheelRadius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes & Gondolas (10 spokes)
    const numGondolas = 10;
    const gondolaColors = ['#e63946', '#f4a261', '#2a9d8f', '#e76f51', '#457b9d'];

    for (let i = 0; i < numGondolas; i++) {
      const angle = rotationAngle + (i * Math.PI * 2) / numGondolas;
      const gx = cx + Math.cos(angle) * wheelRadius;
      const gy = hubY + Math.sin(angle) * wheelRadius;

      // Spoke wire
      ctx.strokeStyle = isLit ? '#a0aec0' : '#171c2d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, hubY);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      // Bulbs along spokes
      if (isLit) {
        const midX = cx + Math.cos(angle) * (wheelRadius * 0.75);
        const midY = hubY + Math.sin(angle) * (wheelRadius * 0.75);
        ctx.fillStyle = '#ffea75';
        ctx.fillRect(midX - 1, midY - 1, 2, 2);
      }

      // Gondola (hanging upright due to gravity)
      const gColor = isLit ? gondolaColors[i % gondolaColors.length] : '#161a29';
      // Basket hanger pin
      ctx.fillStyle = isLit ? '#cbd5e0' : '#141724';
      ctx.fillRect(gx - 1, gy, 2, 4);

      // Basket body
      ctx.fillStyle = gColor;
      ctx.fillRect(gx - 5, gy + 4, 10, 7);

      // Roof of gondola
      ctx.fillStyle = isLit ? '#f7fafc' : '#1a1e2f';
      ctx.fillRect(gx - 6, gy + 2, 12, 2);

      // Window / passenger silhouette
      ctx.fillStyle = isLit ? '#fff3bf' : '#0d101d';
      ctx.fillRect(gx - 3, gy + 5, 6, 3);
    }

    // Central illuminated hub
    ctx.fillStyle = isLit ? '#f59e0b' : '#181d2f';
    ctx.beginPath();
    ctx.arc(cx, hubY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (isLit) {
      // Wheel rim ambient glow
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
    // 3 Vintage cast iron lamp posts along the pathway
    const lamps = [
      { x: 135, y: 195, lit: carouselLit },
      { x: 260, y: 195, lit: coasterLit },
      { x: 345, y: 195, lit: ferrisLit },
    ];

    lamps.forEach((lamp) => {
      // Iron post
      ctx.fillStyle = '#101322';
      ctx.fillRect(lamp.x - 1, lamp.y - 32, 2, 32);
      ctx.fillRect(lamp.x - 3, lamp.y - 2, 6, 2);

      // Lantern head
      ctx.fillRect(lamp.x - 4, lamp.y - 38, 8, 2); // roof
      ctx.fillRect(lamp.x - 3, lamp.y - 32, 6, 2); // floor

      if (lamp.lit) {
        // Glowing bulb
        ctx.fillStyle = '#fff4ba';
        ctx.fillRect(lamp.x - 2, lamp.y - 36, 4, 4);

        // Radial light pool on ground
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

    // Festoon string garland connecting the lamp posts
    if (carouselLit || coasterLit || ferrisLit) {
      for (let i = 0; i < lamps.length - 1; i++) {
        const l1 = lamps[i];
        const l2 = lamps[i + 1];
        const isStringLit = l1.lit && l2.lit;

        // Catenary sag curve
        ctx.strokeStyle = '#121626';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(l1.x, l1.y - 36);
        ctx.quadraticCurveTo((l1.x + l2.x) / 2, l1.y - 24, l2.x, l2.y - 36);
        ctx.stroke();

        // Little bulbs along the string
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

  // --- NATURE PARTICLES: FIREFLIES & SWAYING GRASS ---

  private drawParkNature(ctx: CanvasRenderingContext2D, time: number, darknessFactor: number) {
    // Swaying grass blades along bottom border
    const grassColor = darknessFactor > 0.6 ? '#080d1a' : '#111728';
    ctx.fillStyle = grassColor;
    for (let x = 0; x < 480; x += 6) {
      const sway = Math.sin(time * 1.8 + x) * 2;
      ctx.beginPath();
      ctx.moveTo(x, 270);
      ctx.lineTo(x + sway, 258 - ((x * 3) % 10));
      ctx.lineTo(x + 2, 270);
      ctx.fill();
    }

    // Fireflies: as park lights shut down, fireflies become more visible and glow brighter!
    const fireflyVisibility = 0.2 + darknessFactor * 0.8;
    this.fireflies.forEach((ff) => {
      ff.x += ff.vx;
      ff.y += ff.vy;
      // Soft boundary bounce
      if (ff.x < 30 || ff.x > 450) ff.vx *= -1;
      if (ff.y < 170 || ff.y > 265) ff.vy *= -1;

      // Glow pulse
      const pulse = Math.sin(time * 2.5 + ff.phase);
      if (pulse > 0.1) {
        const alpha = (pulse * fireflyVisibility).toFixed(2);
        ctx.fillStyle = `rgba(180, 255, 120, ${alpha})`;
        ctx.fillRect(Math.floor(ff.x), Math.floor(ff.y), 2, 2);

        // Soft aura
        if (pulse > 0.6 && darknessFactor > 0.4) {
          ctx.fillStyle = `rgba(140, 240, 90, ${(parseFloat(alpha) * 0.3).toFixed(2)})`;
          ctx.fillRect(Math.floor(ff.x) - 1, Math.floor(ff.y) - 1, 4, 4);
        }
      }
    });

    // Drifting autumn/night leaves blown by the wind
    this.leaves.forEach((lf) => {
      lf.x += lf.vx;
      lf.y += lf.vy + Math.sin(time + lf.x * 0.05) * 0.3;
      if (lf.x > 490) lf.x = -10;
      if (lf.y > 275) lf.y = 160;

      ctx.fillStyle = darknessFactor > 0.6 ? '#1b233a' : '#332724';
      ctx.fillRect(Math.floor(lf.x), Math.floor(lf.y), 2, 2);
    });
  }

  // =========================================================================
  // CLOSE-UP RIDE SCENE RENDERERS
  // =========================================================================

  // --- CAROUSEL ON-RIDE CLOSE-UP ---
  public renderCarouselRide(
    ctx: CanvasRenderingContext2D,
    time: number,
    isLit: boolean,
    isShuttingDown: boolean,
    speed: number = 1.0
  ) {
    ctx.clearRect(0, 0, 480, 270);

    // Warm wooden floor & rotating carnival background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 270);
    if (isLit) {
      bgGrad.addColorStop(0, '#2e1919');
      bgGrad.addColorStop(0.5, '#422424');
      bgGrad.addColorStop(1, '#1f1313');
    } else {
      bgGrad.addColorStop(0, '#0a0c16');
      bgGrad.addColorStop(0.5, '#101322');
      bgGrad.addColorStop(1, '#080a12');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 480, 270);

    // Rotating mirrors & light streaks passing by
    const streakOffset = (time * 120 * speed) % 480;
    for (let x = -480; x < 960; x += 120) {
      const curX = x + streakOffset;
      if (curX > -80 && curX < 560) {
        // Gilded mirror panel
        ctx.fillStyle = isLit ? '#ffd166' : '#1a1f33';
        ctx.fillRect(curX, 40, 60, 140);
        ctx.fillStyle = isLit ? '#fff1cc' : '#141724';
        ctx.fillRect(curX + 6, 46, 48, 128);

        // Reflected light blur
        if (isLit) {
          ctx.fillStyle = 'rgba(255, 230, 160, 0.4)';
          ctx.fillRect(curX + 12, 52, 20, 116);
        }
      }
    }

    // Carousel ceiling ornate valance & incandescent bulbs
    const valanceGrad = ctx.createLinearGradient(0, 0, 0, 40);
    valanceGrad.addColorStop(0, isLit ? '#9d0208' : '#141829');
    valanceGrad.addColorStop(1, isLit ? '#6a040f' : '#0d101d');
    ctx.fillStyle = valanceGrad;
    ctx.fillRect(0, 0, 480, 36);

    // Scalloped fringe
    for (let x = 0; x < 480; x += 24) {
      ctx.beginPath();
      ctx.arc(x + 12, 36, 12, 0, Math.PI);
      ctx.fill();

      // Bulbs on valance
      if (isLit) {
        const glow = Math.sin(time * 5 + x) > 0 ? '#ffea00' : '#ffaa00';
        ctx.fillStyle = glow;
        ctx.fillRect(x + 10, 44, 4, 4);
      } else {
        ctx.fillStyle = '#1c2033';
        ctx.fillRect(x + 10, 44, 4, 4);
      }
    }

    // Wooden parquet spinning floor
    ctx.fillStyle = isLit ? '#582f0e' : '#121524';
    ctx.fillRect(0, 200, 480, 70);
    ctx.fillStyle = isLit ? '#7f4f24' : '#191d31';
    for (let px = -20; px < 500; px += 40) {
      ctx.fillRect(px + (streakOffset * 0.5) % 40, 200, 32, 70);
    }

    // Prominent ornate carved wooden carousel horse in foreground
    const horseBob = Math.sin(time * 3 * speed) * 14;
    const hx = 240;
    const hy = 135 + horseBob;

    // Polished brass pole
    ctx.fillStyle = isLit ? '#ffb703' : '#232942';
    ctx.fillRect(hx + 10, 0, 8, 270);
    ctx.fillStyle = isLit ? '#fff3b0' : '#323a5c';
    ctx.fillRect(hx + 12, 0, 2, 270); // reflection highlight

    // Intricately styled pixel horse
    // Body & flanks
    ctx.fillStyle = isLit ? '#fdf0d5' : '#22283e';
    ctx.fillRect(hx - 70, hy - 15, 125, 45);
    ctx.fillRect(hx - 55, hy - 30, 95, 20);

    // Arched neck & head
    ctx.fillRect(hx + 35, hy - 65, 30, 50);
    ctx.fillRect(hx + 50, hy - 80, 28, 25);
    ctx.fillRect(hx + 70, hy - 76, 14, 18); // muzzle

    // Flowing golden mane
    ctx.fillStyle = isLit ? '#e09f3e' : '#181d2f';
    ctx.fillRect(hx + 28, hy - 75, 14, 45);
    ctx.fillRect(hx + 20, hy - 55, 12, 35);

    // Ornate emerald & ruby velvet saddle
    ctx.fillStyle = isLit ? '#2b9348' : '#131926';
    ctx.fillRect(hx - 30, hy - 25, 55, 20);
    ctx.fillStyle = isLit ? '#d90429' : '#1c2233';
    ctx.fillRect(hx - 24, hy - 20, 42, 12);
    ctx.fillStyle = isLit ? '#ffb703' : '#2c334d';
    ctx.fillRect(hx - 32, hy - 26, 60, 4); // gold fringe

    // Stirrup
    ctx.fillStyle = isLit ? '#ffb703' : '#22273e';
    ctx.fillRect(hx - 5, hy + 2, 4, 28);
    ctx.fillRect(hx - 9, hy + 28, 12, 4);

    // Front & rear legs poised mid-gallop
    ctx.fillStyle = isLit ? '#fdf0d5' : '#22283e';
    // Front legs reaching forward
    ctx.fillRect(hx + 40, hy + 25, 12, 40);
    ctx.fillRect(hx + 50, hy + 50, 10, 30);
    // Rear legs tucked
    ctx.fillRect(hx - 65, hy + 25, 14, 35);
    ctx.fillRect(hx - 75, hy + 45, 10, 35);
    // Golden hooves
    ctx.fillStyle = isLit ? '#d4a373' : '#191f33';
    ctx.fillRect(hx + 52, hy + 80, 10, 8);
    ctx.fillRect(hx - 76, hy + 80, 10, 8);

    // Warm ambient carousel lighting wash
    if (isLit) {
      const warmAura = ctx.createRadialGradient(hx, hy - 20, 20, hx, hy - 20, 220);
      warmAura.addColorStop(0, 'rgba(255, 225, 140, 0.22)');
      warmAura.addColorStop(0.7, 'rgba(255, 160, 60, 0.08)');
      warmAura.addColorStop(1, 'rgba(255, 160, 60, 0)');
      ctx.fillStyle = warmAura;
      ctx.fillRect(0, 0, 480, 270);
    }
  }

  // --- ROLLER COASTER ASCENT / CLIMB ---
  public renderCoasterClimb(ctx: CanvasRenderingContext2D, time: number, step: number) {
    ctx.clearRect(0, 0, 480, 270);

    // Sky with stars tilting upward
    this.renderNightSky(ctx, time, 0.3, 1.2);

    // Wooden coaster track climbing steeply from bottom-left to top-right
    const clankPulse = (time * 8) % 20;

    // Track rails perspective
    ctx.strokeStyle = '#6c584c';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(-50, 290);
    ctx.lineTo(440, 30);
    ctx.stroke();

    // Steel rails
    ctx.strokeStyle = '#d6ccc2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-50, 275);
    ctx.lineTo(435, 20);
    ctx.moveTo(-40, 300);
    ctx.lineTo(445, 40);
    ctx.stroke();

    // Wooden cross ties
    for (let d = -40; d < 460; d += 22) {
      const x1 = d;
      const y1 = 285 - d * 0.55;
      ctx.fillStyle = '#4a3f35';
      ctx.fillRect(x1 - 4, y1 - 10, 8, 24);
    }

    // Heavy iron chain lift in center of track
    ctx.fillStyle = '#212529';
    for (let d = -30; d < 450; d += 16) {
      const cx = d + clankPulse * 0.8;
      const cy = 285 - (d + clankPulse * 0.8) * 0.55;
      ctx.fillRect(cx - 2, cy - 2, 5, 5);
    }

    // Coaster car nose (first-person / over-the-hood perspective)
    ctx.fillStyle = '#b7094c';
    ctx.beginPath();
    ctx.moveTo(120, 270);
    ctx.lineTo(240, 160);
    ctx.lineTo(360, 270);
    ctx.closePath();
    ctx.fill();

    // Hood trim & headlights
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(236, 160, 8, 110);
    ctx.fillStyle = '#ffee32';
    ctx.fillRect(170, 195, 14, 10);
    ctx.fillRect(296, 195, 14, 10);

    // Distant park lights sinking away below
    ctx.fillStyle = 'rgba(255, 200, 80, 0.4)';
    ctx.fillRect(40, 220, 6, 6);
    ctx.fillRect(75, 240, 8, 6);
    ctx.fillRect(90, 210, 5, 5);
  }

  // --- ROLLER COASTER PEAK: LOOK UP (NIGHT SKY & MOON) ---
  public renderCoasterLookUp(ctx: CanvasRenderingContext2D, time: number) {
    ctx.clearRect(0, 0, 480, 270);

    // Deep cosmic night sky
    const skyGrad = ctx.createRadialGradient(240, 135, 10, 240, 135, 260);
    skyGrad.addColorStop(0, '#0a102b');
    skyGrad.addColorStop(0.5, '#050718');
    skyGrad.addColorStop(1, '#02030a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 480, 270);

    // Dense galaxy dust / milky way band
    const galaxyGrad = ctx.createLinearGradient(0, 0, 480, 270);
    galaxyGrad.addColorStop(0, 'rgba(30, 45, 90, 0)');
    galaxyGrad.addColorStop(0.45, 'rgba(65, 80, 140, 0.18)');
    galaxyGrad.addColorStop(0.55, 'rgba(80, 100, 170, 0.22)');
    galaxyGrad.addColorStop(1, 'rgba(30, 45, 90, 0)');
    ctx.fillStyle = galaxyGrad;
    ctx.fillRect(0, 0, 480, 270);

    // Abundant brilliant stars
    this.stars.forEach((star, idx) => {
      const pulse = Math.sin(time * 2 + idx) * 0.2;
      const alpha = Math.min(1.0, star.brightness + pulse + 0.15);
      ctx.fillStyle = `rgba(240, 245, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(star.x, star.y + 40, star.size + 1, star.size + 1);

      // Star flare on brightest stars
      if (idx % 8 === 0) {
        ctx.fillStyle = `rgba(210, 230, 255, 0.4)`;
        ctx.fillRect(star.x - 2, star.y + 40, 6, 1);
        ctx.fillRect(star.x, star.y + 38, 1, 6);
      }
    });

    // Gigantic, breathtaking pixel moon right above the player
    const mx = 240;
    const my = 120;
    const mRadius = 48;

    // Atmospheric moon bloom
    const moonBloom = ctx.createRadialGradient(mx, my, mRadius * 0.6, mx, my, mRadius * 2.6);
    moonBloom.addColorStop(0, 'rgba(250, 252, 255, 0.5)');
    moonBloom.addColorStop(0.5, 'rgba(210, 230, 255, 0.15)');
    moonBloom.addColorStop(1, 'rgba(210, 230, 255, 0)');
    ctx.fillStyle = moonBloom;
    ctx.beginPath();
    ctx.arc(mx, my, mRadius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Moon disc
    ctx.fillStyle = '#faf8ea';
    ctx.beginPath();
    ctx.arc(mx, my, mRadius, 0, Math.PI * 2);
    ctx.fill();

    // Moon pixel craters & maria seas
    ctx.fillStyle = '#d8dedf';
    ctx.fillRect(mx - 24, my - 22, 20, 16);
    ctx.fillRect(mx - 8, my + 4, 30, 22);
    ctx.fillRect(mx - 32, my + 8, 18, 16);
    ctx.fillRect(mx + 8, my - 28, 16, 14);

    ctx.fillStyle = '#b4bdc2';
    ctx.fillRect(mx - 20, my - 18, 12, 10);
    ctx.fillRect(mx - 4, my + 8, 18, 14);

    // Subtle drifting wisps of night cloud across the moon
    const cloudShift = (time * 3) % 520 - 60;
    this.drawPixelCloud(ctx, cloudShift, my - 10, 90, 12, 0.22);

    // Coaster track silhouette at bottom edge reminding player they are perched at the top of the lift
    ctx.fillStyle = '#060810';
    ctx.fillRect(232, 258, 16, 12);
    ctx.fillRect(200, 266, 80, 4);
  }

  // --- ROLLER COASTER PEAK: LOOK DOWN (AMUSEMENT PARK BELOW) ---
  public renderCoasterLookDown(
    ctx: CanvasRenderingContext2D,
    time: number,
    carouselShutdown: boolean,
    ferrisLit: boolean
  ) {
    ctx.clearRect(0, 0, 480, 270);

    // Ground darkness / deep forest surrounding park
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, 480, 270);

    // Miniature top-down / high isometric view of the amusement park
    const parkX = 240;
    const parkY = 150;

    // Glowing walkways network
    ctx.strokeStyle = '#1b223c';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(parkX, parkY, 65, 0, Math.PI * 2);
    ctx.moveTo(parkX, parkY - 65);
    ctx.lineTo(parkX, parkY + 75);
    ctx.stroke();

    // CAROUSEL on left:
    const cX = parkX - 85;
    const cY = parkY;
    if (carouselShutdown) {
      // Dark quiet dome
      ctx.fillStyle = '#0d101d';
      ctx.beginPath();
      ctx.arc(cX, cY, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Glowing carousel ring
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(cX, cY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef476f';
      ctx.beginPath();
      ctx.arc(cX, cY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // FERRIS WHEEL on right:
    const fX = parkX + 90;
    const fY = parkY - 10;
    if (ferrisLit) {
      // Turning glowing spokes
      ctx.strokeStyle = '#48cae4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fX, fY, 32, 0, Math.PI * 2);
      ctx.stroke();

      for (let a = 0; a < 8; a++) {
        const rad = (a * Math.PI * 2) / 8 + time * 0.4;
        ctx.fillStyle = '#ffea75';
        ctx.fillRect(fX + Math.cos(rad) * 32 - 2, fY + Math.sin(rad) * 32 - 2, 4, 4);
      }
    } else {
      ctx.strokeStyle = '#141829';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fX, fY, 32, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Coaster track trestle below player
    ctx.fillStyle = '#3a2d28';
    ctx.fillRect(parkX - 15, 230, 30, 40);
    ctx.fillRect(parkX - 25, 245, 50, 6);

    // Lamp pools in the park below
    const lampDots = [
      { x: parkX - 40, y: parkY - 30 },
      { x: parkX + 40, y: parkY - 30 },
      { x: parkX - 35, y: parkY + 40 },
      { x: parkX + 35, y: parkY + 40 },
    ];
    lampDots.forEach((l) => {
      ctx.fillStyle = 'rgba(255, 220, 100, 0.45)';
      ctx.fillRect(l.x - 2, l.y - 2, 5, 5);
    });

    // Surround of whispering black trees
    ctx.fillStyle = '#080c18';
    for (let tx = 10; tx < 470; tx += 20) {
      ctx.fillRect(tx, 15, 14, 18);
      ctx.fillRect(tx, 245, 14, 18);
    }
  }

  // --- ROLLER COASTER DROP / SPEED SEQUENCE ---
  public renderCoasterDrop(ctx: CanvasRenderingContext2D, time: number, dropProgress: number) {
    ctx.clearRect(0, 0, 480, 270);

    // Dark rushing background
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, 480, 270);

    // High-speed motion streak lines
    for (let i = 0; i < 40; i++) {
      const angle = (i * 19) % 360;
      const speed = 250 + (i % 5) * 60;
      const lineLen = 35 + (i % 4) * 25;
      const x = 240 + Math.cos(angle) * ((time * speed) % 320);
      const y = 135 + Math.sin(angle) * ((time * speed) % 320);

      ctx.strokeStyle = i % 3 === 0 ? 'rgba(255, 180, 50, 0.65)' : 'rgba(200, 220, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * lineLen, y + Math.sin(angle) * lineLen);
      ctx.stroke();
    }

    // Coaster car nose shaking intensely
    const shakeX = (Math.random() - 0.5) * 6;
    const shakeY = (Math.random() - 0.5) * 6;
    ctx.fillStyle = '#d62828';
    ctx.beginPath();
    ctx.moveTo(100 + shakeX, 270);
    ctx.lineTo(240 + shakeX, 150 + shakeY);
    ctx.lineTo(380 + shakeX, 270);
    ctx.closePath();
    ctx.fill();

    // Wind gust overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, 0, 480, 270);
  }

  // --- FERRIS WHEEL ASCENT / PEAK ---
  public renderFerrisWheelRide(
    ctx: CanvasRenderingContext2D,
    time: number,
    altitudeStage: 'GROUND' | 'LOW' | 'MIDDLE' | 'HIGH' | 'PEAK',
    isLit: boolean
  ) {
    ctx.clearRect(0, 0, 480, 270);

    // Altitude defines sky darkness and horizon drop
    const altitudeValues = {
      GROUND: { horizonY: 180, skyDarkness: 0.35, gondolaSway: 0.5, starsVisible: 0.5 },
      LOW: { horizonY: 200, skyDarkness: 0.5, gondolaSway: 0.8, starsVisible: 0.65 },
      MIDDLE: { horizonY: 220, skyDarkness: 0.65, gondolaSway: 1.2, starsVisible: 0.8 },
      HIGH: { horizonY: 240, skyDarkness: 0.8, gondolaSway: 1.5, starsVisible: 0.9 },
      PEAK: { horizonY: 255, skyDarkness: 0.95, gondolaSway: 1.8, starsVisible: 1.0 },
    };

    const cfg = altitudeValues[altitudeStage];
    this.renderNightSky(ctx, time, cfg.skyDarkness, 1.3, -15);

    // Distant dark hills dropping lower as we rise
    ctx.fillStyle = '#060914';
    ctx.beginPath();
    ctx.moveTo(0, cfg.horizonY);
    ctx.lineTo(120, cfg.horizonY - 15);
    ctx.lineTo(280, cfg.horizonY - 8);
    ctx.lineTo(480, cfg.horizonY - 20);
    ctx.lineTo(480, 270);
    ctx.lineTo(0, 270);
    ctx.closePath();
    ctx.fill();

    // Miniature dark amusement park below:
    // Both carousel and coaster are already dark and sleeping
    const parkScale = altitudeStage === 'PEAK' ? 0.4 : altitudeStage === 'HIGH' ? 0.6 : 0.85;
    const parkY = cfg.horizonY + 10;

    // Carousel dark dome silhouette below
    ctx.fillStyle = '#0c1020';
    ctx.fillRect(70, parkY, 40 * parkScale, 20 * parkScale);
    // Coaster trestle dark silhouette below
    ctx.fillRect(160, parkY - 15 * parkScale, 80 * parkScale, 35 * parkScale);

    // Gondola window frame (interior view looking out)
    const sway = Math.sin(time * 1.2) * cfg.gondolaSway * 3;

    // Gondola roof arch
    ctx.fillStyle = '#1c2237';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(480, 0);
    ctx.lineTo(480, 45);
    ctx.quadraticCurveTo(240, 25 + sway * 0.3, 0, 45);
    ctx.closePath();
    ctx.fill();

    // Vertical metal support struts of the gondola
    ctx.fillStyle = '#28314e';
    ctx.fillRect(20 + sway, 0, 8, 270);
    ctx.fillRect(452 + sway, 0, 8, 270);
    ctx.fillRect(130 + sway, 0, 6, 270);
    ctx.fillRect(344 + sway, 0, 6, 270);

    // Front safety railing / brass bar
    ctx.fillStyle = '#3a476e';
    ctx.fillRect(0, 215, 480, 55);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(0, 212, 480, 4); // brass handrail top
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(0, 213, 480, 1);

    // Rivets on handrail
    ctx.fillStyle = '#b7791f';
    for (let rx = 15; rx < 480; rx += 30) {
      ctx.fillRect(rx, 218, 3, 3);
    }

    // Little lantern inside the gondola ceiling (lit until shutdown)
    if (isLit) {
      ctx.fillStyle = '#fff4ba';
      ctx.fillRect(238 + sway * 0.2, 38, 5, 5);
      const lanternGlow = ctx.createRadialGradient(240 + sway * 0.2, 40, 2, 240 + sway * 0.2, 40, 60);
      lanternGlow.addColorStop(0, 'rgba(255, 235, 140, 0.3)');
      lanternGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(240 + sway * 0.2, 40, 60, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#141828';
      ctx.fillRect(238 + sway * 0.2, 38, 5, 5);
    }
  }

  // --- FINAL SCENE: THE PARK IS QUIET ---
  public renderQuietParkFinal(ctx: CanvasRenderingContext2D, time: number, revealAlpha: number) {
    ctx.clearRect(0, 0, 480, 270);

    if (revealAlpha <= 0.01) {
      // Complete pitch blackness
      ctx.fillStyle = '#030408';
      ctx.fillRect(0, 0, 480, 270);
      return;
    }

    // Deep midnight sky with thousands of stars and pure moonlight
    this.renderNightSky(ctx, time, 1.0, 1.25);
    this.renderHorizonAndDistantTrees(ctx, 1.0);

    // Ground and walkway bathed in soft silver moonlight
    const groundGrad = ctx.createLinearGradient(0, 170, 0, 270);
    groundGrad.addColorStop(0, '#090e1c');
    groundGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 170, 480, 100);

    // Brick walkway
    ctx.fillStyle = '#0b1122';
    for (let py = 185; py < 270; py += 12) {
      const shift = ((py / 12) % 2) * 14;
      for (let px = -20; px < 500; px += 28) {
        ctx.fillRect(px + shift, py, 26, 10);
      }
    }

    // Completely dark silhouettes of all three sleeping rides
    // 1. Sleeping Carousel
    this.drawParkCarousel(ctx, 80, 175, time, false, false);

    // 2. Sleeping Coaster
    this.drawParkCoaster(ctx, 230, 175, time, false, false);

    // 3. Sleeping Ferris Wheel
    this.drawParkFerrisWheel(ctx, 400, 168, time, false, false);

    // 4. Extinguished lamps
    this.drawParkStreetLanterns(ctx, time, 1.0, false, false, false);

    // 5. Rich fireflies & swaying night vegetation
    this.drawParkNature(ctx, time, 1.0);

    // Moonbeams filtering through the silent park
    const moonBeam = ctx.createLinearGradient(390, 40, 200, 270);
    moonBeam.addColorStop(0, 'rgba(215, 235, 255, 0.08)');
    moonBeam.addColorStop(0.5, 'rgba(180, 210, 255, 0.04)');
    moonBeam.addColorStop(1, 'rgba(180, 210, 255, 0)');
    ctx.fillStyle = moonBeam;
    ctx.fillRect(0, 0, 480, 270);

    // Fade-in curtain overlay
    if (revealAlpha < 1.0) {
      ctx.fillStyle = `rgba(3, 4, 8, ${(1 - revealAlpha).toFixed(2)})`;
      ctx.fillRect(0, 0, 480, 270);
    }
  }
}

export const pixelRenderer = new PixelArtRenderer();
