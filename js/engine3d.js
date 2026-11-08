/* Buggames — Engine pseudo-3D (proyeksi perspektif di canvas) */
'use strict';

window.E3D = (function () {
  const SEG = 200, DRAW = 110, ROAD = 2100;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- langit & bukit ---------- */
  function drawSky(ctx, W, H, horizonY, opts) {
    opts = opts || {};
    const g = ctx.createLinearGradient(0, 0, 0, horizonY + 10);
    g.addColorStop(0, opts.top || '#3b82f6');
    g.addColorStop(0.55, opts.mid || '#7dd3fc');
    g.addColorStop(1, opts.low || '#fde68a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizonY + 10);
    /* matahari */
    ctx.fillStyle = opts.sun || '#fff7cc';
    ctx.beginPath(); ctx.arc(W * 0.78, horizonY * 0.42, 30, 0, Math.PI * 2); ctx.fill();
    /* awan */
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    const t = Date.now() / 4000;
    [[0.15, 0.22, 26], [0.45, 0.12, 20], [0.65, 0.3, 30], [0.9, 0.16, 17]].forEach(([fx, fy, r], i) => {
      const x = ((fx + t * 0.015 * (i + 1)) % 1.2 - 0.1) * W;
      ctx.beginPath(); ctx.arc(x, horizonY * fy, r, 0, Math.PI * 2); ctx.arc(x + r * 0.9, horizonY * fy + 4, r * 0.75, 0, Math.PI * 2); ctx.arc(x - r * 0.9, horizonY * fy + 5, r * 0.7, 0, Math.PI * 2); ctx.fill();
    });
    /* bukit jauh */
    ctx.fillStyle = opts.hills || '#166534';
    ctx.beginPath(); ctx.moveTo(0, horizonY);
    for (let x = 0; x <= W; x += 8) {
      const y = horizonY - (Math.sin(x * 0.012 + (opts.hillPhase || 0)) * 26 + Math.sin(x * 0.03 + 2) * 12 + 34);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, horizonY); ctx.closePath(); ctx.fill();
  }

  /* ---------- pohon pinus & batu ---------- */
  function drawPine(ctx, x, baseY, h) {
    const w = h * 0.36;
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(x - h * 0.045, baseY - h * 0.32, h * 0.09, h * 0.32);
    ctx.fillStyle = '#14532d';
    ctx.strokeStyle = '#0b3d1f'; ctx.lineWidth = Math.max(1, h * 0.02);
    for (let i = 0; i < 3; i++) {
      const ty = baseY - h * (0.22 + i * 0.28), tw = w * (1 - i * 0.28);
      ctx.beginPath(); ctx.moveTo(x - tw, ty); ctx.lineTo(x + tw, ty); ctx.lineTo(x, ty - h * 0.36); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  function drawRock(ctx, x, baseY, h) {
    ctx.fillStyle = '#6b7280'; ctx.strokeStyle = '#374151'; ctx.lineWidth = Math.max(1, h * 0.04);
    ctx.beginPath(); ctx.ellipse(x, baseY - h * 0.3, h * 0.42, h * 0.32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath(); ctx.ellipse(x - h * 0.12, baseY - h * 0.4, h * 0.16, h * 0.1, -0.4, 0, Math.PI * 2); ctx.fill();
  }
  function drawGiraffe(ctx, x, baseY, h) {
    ctx.fillStyle = '#f5c15d'; ctx.strokeStyle = '#241239'; ctx.lineWidth = Math.max(1, h * 0.03);
    ctx.fillRect(x - h * 0.09, baseY - h * 0.42, h * 0.18, h * 0.24); /* badan */
    ctx.fillRect(x + h * 0.02, baseY - h * 0.78, h * 0.07, h * 0.4);  /* leher */
    ctx.fillRect(x - h * 0.16, baseY - h * 0.18, h * 0.05, h * 0.18); /* kaki */
    ctx.fillRect(x + h * 0.06, baseY - h * 0.18, h * 0.05, h * 0.18);
    ctx.fillRect(x + h * 0.0, baseY - h * 0.88, h * 0.12, h * 0.1);   /* kepala */
    ctx.fillStyle = '#a16207';
    [[-0.06, -0.36], [0.03, -0.28], [0.0, -0.52], [0.05, -0.7]].forEach(([ox, oy]) => {
      ctx.beginPath(); ctx.arc(x + ox * h * 2.2, baseY + oy * h * 1.35, h * 0.035, 0, Math.PI * 2); ctx.fill();
    });
  }
  function drawZebra(ctx, x, baseY, h) {
    ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = Math.max(1, h * 0.03);
    ctx.fillRect(x - h * 0.14, baseY - h * 0.4, h * 0.28, h * 0.18);
    ctx.fillRect(x + h * 0.1, baseY - h * 0.6, h * 0.09, h * 0.24);
    ctx.fillRect(x - h * 0.11, baseY - h * 0.22, h * 0.05, h * 0.22);
    ctx.fillRect(x + h * 0.06, baseY - h * 0.22, h * 0.05, h * 0.22);
    ctx.strokeStyle = '#241239';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * h * 0.09 - h * 0.04, baseY - h * 0.4); ctx.lineTo(x + i * h * 0.09, baseY - h * 0.22); ctx.stroke(); }
  }
  function drawStarBillboard(ctx, x, y, r, glow) {
    ctx.save();
    if (glow) { ctx.shadowColor = '#fde047'; ctx.shadowBlur = 14; }
    ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = Math.max(1, r * 0.18);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 === 0 ? r : r * 0.45;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function drawFirefly(ctx, x, y, r, t) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 4 + x * 0.1);
    ctx.save(); ctx.shadowColor = '#bef264'; ctx.shadowBlur = 16 * pulse;
    ctx.fillStyle = '#d9f99d'; ctx.beginPath(); ctx.arc(x, y + Math.sin(t * 6 + x) * 3, r * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* mobil dari belakang */
  function drawCarRear(ctx, x, y, w, opts) {
    opts = opts || {};
    const h = w * 0.5;
    ctx.save(); ctx.translate(x, y);
    /* bayangan */
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.62, h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    /* body */
    ctx.fillStyle = opts.body || '#ef4444'; ctx.strokeStyle = '#1f2937'; ctx.lineWidth = w * 0.028;
    ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 0.12); ctx.lineTo(-w * 0.44, -h * 0.42); ctx.lineTo(-w * 0.26, -h * 0.52); ctx.lineTo(w * 0.26, -h * 0.52); ctx.lineTo(w * 0.44, -h * 0.42); ctx.lineTo(w * 0.5, -h * 0.12); ctx.closePath(); ctx.fill(); ctx.stroke();
    /* kabin */
    ctx.fillStyle = opts.cabin || '#1e293b';
    ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.5); ctx.lineTo(-w * 0.2, -h * 0.82); ctx.lineTo(w * 0.2, -h * 0.82); ctx.lineTo(w * 0.3, -h * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    /* spoiler / rak sepeda */
    if (opts.bike) {
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = w * 0.05; ctx.beginPath(); ctx.moveTo(0, -h * 0.32); ctx.lineTo(0, -h * 0.86); ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, -h * 0.9, w * 0.09, 0, Math.PI * 2); ctx.fill();
    } else if (opts.spoiler !== false) {
      ctx.fillStyle = opts.body || '#ef4444'; ctx.strokeStyle = '#1f2937'; ctx.lineWidth = w * 0.022;
      ctx.fillRect(-w * 0.52, -h * 0.28, w * 1.04, h * 0.09); ctx.strokeRect(-w * 0.52, -h * 0.28, w * 1.04, h * 0.09);
    }
    /* lampu belakang */
    ctx.fillStyle = opts.braking ? '#ff2d2d' : '#7f1d1d';
    if (opts.braking) { ctx.shadowColor = '#ff2d2d'; ctx.shadowBlur = 16; }
    ctx.fillRect(-w * 0.4, -h * 0.3, w * 0.16, h * 0.1);
    ctx.fillRect(w * 0.24, -h * 0.3, w * 0.16, h * 0.1);
    ctx.shadowBlur = 0;
    /* knalpot saat drift */
    if (opts.drifting) {
      ctx.fillStyle = '#fb923c';
      [[-0.3, 1], [0.3, -1]].forEach(([ox, d]) => {
        ctx.beginPath(); ctx.ellipse(ox * w + Math.sin(Date.now() / 60) * 3 * d, -h * 0.02, w * 0.09, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      });
    }
    /* roda */
    ctx.fillStyle = '#111827';
    ctx.fillRect(-w * 0.54, -h * 0.22, w * 0.12, h * 0.2);
    ctx.fillRect(w * 0.42, -h * 0.22, w * 0.12, h * 0.2);
    ctx.restore();
  }

  /* ---------- Racer pseudo-3D (OutRun-style) ---------- */
  function createRacer(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const N = opts.trackLength || 260;
    const maxSpeed = opts.maxSpeed || 9000;
    const isLoop = opts.loop !== false;
    const horizon = Math.floor(H * 0.40);
    const focal = W * 0.78;
    const camHeight = 950;

    /* bangun segmen */
    const segs = [];
    const curveAmp = opts.curveAmp !== undefined ? opts.curveAmp : 2.6;
    const hillAmp = opts.hillAmp !== undefined ? opts.hillAmp : 620;
    const curveFreq = opts.curveFreq || 0.055, hillFreq = opts.hillFreq || 0.021;
    for (let i = 0; i < N; i++) {
      segs.push({
        curve: Math.sin(i * curveFreq) * curveAmp * (0.55 + 0.45 * Math.sin(i * 0.013 + 2)),
        y: Math.sin(i * hillFreq + 1.2) * hillAmp + Math.sin(i * 0.008) * 200,
        sprites: [],
      });
    }
    /* pohon di tepi jalan */
    const treeDensity = opts.trees !== undefined ? opts.trees : 1;
    for (let i = 0; i < N; i++) {
      if (i % 3 === 0 && treeDensity > 0) {
        const side = i % 6 === 0 ? 1 : -1;
        segs[i].sprites.push({ off: side * (1.7 + ((i * 7919) % 100) / 90), type: (i * 104729) % 5 === 0 ? 'rock' : 'pine', seed: i });
        if (treeDensity > 1 && i % 6 === 0) segs[i].sprites.push({ off: -side * (1.8 + ((i * 31) % 100) / 80), type: 'pine', seed: i + 999 });
      }
    }
    /* kolektibel */
    if (opts.collect) {
      const every = opts.collect.every || 26;
      for (let i = 20; i < N - 4; i += every) segs[i].sprites.push({ off: ((i * 37) % 100) / 130 - 0.38, type: opts.collect.type, seed: i, collectible: true });
    }
    /* hewan (safari) */
    if (opts.animals) {
      for (let i = 30; i < N - 10; i += 34) segs[i].sprites.push({ off: (i % 2 ? 1 : -1) * (1.5 + ((i * 13) % 10) / 22), type: (i * 7) % 3 === 0 ? 'giraffe' : 'zebra', seed: i, animal: true });
    }
    /* lalu lintas */
    const traffic = [];
    const trafficCount = opts.traffic || 0;
    const carColors = ['#3b82f6', '#f97316', '#a3e635', '#e5e7eb', '#8b5cf6'];
    for (let i = 0; i < trafficCount; i++) {
      traffic.push({ z: (i + 1) * (N * SEG) / (trafficCount + 1), x: [-0.5, 0, 0.5][i % 3], speed: maxSpeed * (0.35 + (i * 37 % 10) / 40), color: carColors[i % carColors.length] });
    }

    const state = {
      pos: 0, x: 0, speed: 0, lap: 1, laps: opts.laps || 0,
      score: 0, timeLeft: opts.timeLimit || 0, checkpoints: 0,
      drifting: false, driftDir: 0, shake: 0, crashed: 0, collected: 0,
      done: false, position: 1,
    };
    const rivals = [];
    if (opts.rivals) {
      for (let i = 0; i < opts.rivals; i++) rivals.push({ z: 400 + i * 150, x: [-0.5, 0.5, 0][i % 3], speed: maxSpeed * (0.62 + i * 0.07), color: carColors[(i * 2 + 1) % carColors.length], lap: 1 });
    }

    function trackLength() { return N * SEG; }
    function playerSegY(pos) {
      const i = Math.floor(pos / SEG) % N;
      const t = (pos % SEG) / SEG;
      return lerp(segs[i].y, segs[(i + 1) % N].y, t);
    }

    function step(dt, input) {
      if (state.done) return;
      const segIndex = Math.floor(state.pos / SEG) % N;
      const speedPct = state.speed / maxSpeed;
      state.pos += state.speed * dt;
      const steerRate = 2.1 * (0.35 + speedPct * 0.75);
      if (input.left) state.x -= steerRate * dt;
      if (input.right) state.x += steerRate * dt;
      /* gaya sentrifugal di tikungan */
      state.x -= dt * speedPct * segs[segIndex].curve * 0.32;
      if (input.up) state.speed += (opts.accel || 2300) * dt;
      else if (input.down) state.speed -= 6500 * dt;
      else state.speed -= 900 * dt;
      if (Math.abs(state.x) > 1.05) { state.speed -= 3200 * dt; if (state.speed > maxSpeed * 0.42) state.speed = Math.max(maxSpeed * 0.42, state.speed - 2600 * dt); }
      state.speed = clamp(state.speed, 0, maxSpeed);
      state.x = clamp(state.x, -2.3, 2.3);
      state.shake = Math.max(0, state.shake - dt * 2.2);
      state.crashed = Math.max(0, state.crashed - dt);

      /* drift */
      if (opts.drift) {
        const steering = (input.left || input.right) && speedPct > 0.55 && Math.abs(segs[segIndex].curve) > 0.9;
        state.drifting = steering;
        if (steering) { state.driftDir = input.left ? -1 : 1; state.score += Math.floor(90 * speedPct); }
      }

      /* lalu lintas */
      for (const car of traffic) {
        car.z += car.speed * dt;
        if (car.z >= trackLength()) car.z -= trackLength();
        let dz = car.z - (state.pos % trackLength());
        if (dz < -trackLength() / 2) dz += trackLength();
        if (dz > trackLength() / 2) dz -= trackLength();
        if (Math.abs(dz) < 260 && Math.abs(car.x - state.x) < 0.34 && state.crashed <= 0) {
          state.speed *= 0.42; state.crashed = 1.4; state.shake = 0.8; state.x += (state.x >= car.x ? 0.5 : -0.5);
        }
      }
      /* rival (balapan) */
      if (opts.rivals) {
        let ahead = 0;
        for (const r of rivals) { r.z += r.speed * dt; if (r.z >= trackLength()) { r.z -= trackLength(); r.lap++; } if (r.z > state.pos % trackLength()) ahead++; }
        state.position = ahead + 1;
      }

      /* kolektibel */
      if (opts.collect) {
        const segI = Math.floor(state.pos / SEG) % N;
        for (const sp of segs[segI].sprites) {
          if (sp.collectible && !sp.taken && Math.abs(sp.off - state.x) < 0.42) { sp.taken = true; state.collected++; state.score += opts.collect.points || 10; }
        }
        /* cek segmen berikutnya juga (kecepatan tinggi) */
        const segI2 = (segI + 1) % N;
        for (const sp of segs[segI2].sprites) {
          if (sp.collectible && !sp.taken && Math.abs(sp.off - state.x) < 0.42) { sp.taken = true; state.collected++; state.score += opts.collect.points || 10; }
        }
      }
      /* hewan (foto) */
      if (opts.animals) {
        const segI = Math.floor(state.pos / SEG) % N;
        for (let k = segI; k < segI + 2; k++) {
          for (const sp of segs[k % N].sprites) {
            if (sp.animal && !sp.taken && Math.abs(sp.off - state.x) < 1.7) { sp.taken = true; state.score += 100; state.collected++; }
          }
        }
      }

      /* lap & timer & checkpoint */
      if (opts.laps) {
        const newLap = Math.floor(state.pos / trackLength()) + 1;
        if (newLap > state.lap) { state.lap = newLap; }
        if (state.lap > opts.laps) state.done = true;
      }
      if (opts.timeLimit) {
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) { state.timeLeft = 0; state.done = true; }
      }
      if (opts.checkpoints) {
        const cp = Math.floor(state.pos / opts.checkpointEvery);
        if (cp > state.checkpoints) { state.checkpoints = cp; state.timeLeft += opts.checkpointBonus || 10; state.score += 150; }
      }
    }

    function render() {
      const t = Date.now() / 1000;
      const baseIndex = Math.floor(state.pos / SEG) % N;
      const baseOff = state.pos % SEG;
      const camY = camHeight + playerSegY(state.pos);
      const camX = state.x * ROAD;
      const shakeX = state.shake > 0 ? Math.sin(t * 46) * state.shake * 26 : 0;

      drawSky(ctx, W, H, horizon, opts.sky || {});

      /* proyeksi semua segmen (jauh ke dekat ditukar saat menggambar) */
      const pts = [];
      let accX = 0, accDX = -(segs[baseIndex].curve * (baseOff / SEG));
      for (let n = 0; n < DRAW; n++) {
        const i = (baseIndex + n) % N;
        const z1 = Math.max(n * SEG - baseOff, 24), z2 = Math.max((n + 1) * SEG - baseOff, 24);
        const p1 = { z: z1, x: accX, y: segs[i].y };
        accX += accDX; accDX += segs[i].curve;
        const p2 = { z: z2, x: accX, y: segs[(i + 1) % N].y };
        pts.push({ i, p1, p2 });
      }
      const proj = p => {
        const scale = focal / p.z;
        return {
          x: W / 2 + shakeX + (p.x - camX) * scale,
          y: horizon + (camY - p.y) * scale,
          w: ROAD * scale,
          scale,
        };
      };
      for (let n = DRAW - 1; n >= 0; n--) {
        const { i, p1, p2 } = pts[n];
        const a = proj(p1), b = proj(p2);
        if (a.y <= b.y) continue;
        const alt = Math.floor(i / RUMBLE_ALT) % 2 === 0;
        /* rumput */
        ctx.fillStyle = alt ? (opts.grass1 || '#15803d') : (opts.grass2 || '#166534');
        ctx.fillRect(0, b.y, W, a.y - b.y + 1);
        /* pinggir jalan (rumble) */
        ctx.fillStyle = alt ? '#f8fafc' : '#ef4444';
        quad(a.x - a.w * 1.18, a.y, a.x - a.w, a.y, b.x - b.w, b.y, b.x - b.w * 1.18, b.y);
        quad(a.x + a.w * 1.18, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x + b.w * 1.18, b.y);
        /* jalan */
        ctx.fillStyle = alt ? (opts.road1 || '#4b5563') : (opts.road2 || '#374151');
        quad(a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y);
        /* garis tengah */
        if (Math.floor(i / 2) % 2 === 0) {
          ctx.fillStyle = '#fde047';
          const lw1 = a.w * 0.03, lw2 = b.w * 0.03;
          quad(a.x - lw1, a.y, a.x + lw1, a.y, b.x + lw2, b.y, b.x - lw2, b.y);
        }
        /* sprite segmen ini */
        for (const sp of segs[i].sprites) {
          if (sp.taken) continue;
          const scale = focal / p1.z;
          const sx = W / 2 + shakeX + (p1.x + sp.off * ROAD - camX) * scale;
          const sy = horizon + (camY - p1.y) * scale;
          if (sy < horizon - 4) continue;
          if (sp.type === 'pine') drawPine(ctx, sx, sy, 950 * scale);
          else if (sp.type === 'rock') drawRock(ctx, sx, sy, 420 * scale);
          else if (sp.type === 'giraffe') drawGiraffe(ctx, sx, sy, 1000 * scale);
          else if (sp.type === 'zebra') drawZebra(ctx, sx, sy, 750 * scale);
          else if (sp.type === 'star') drawStarBillboard(ctx, sx, sy - 350 * scale, Math.max(2, 150 * scale), true);
          else if (sp.type === 'firefly') drawFirefly(ctx, sx, sy - 180 * scale, Math.max(1.5, 60 * scale), t);
        }
      }
      /* mobil trafik & rival (urut jauh ke dekat) */
      const carsToDraw = [];
      for (const car of traffic) carsToDraw.push(car);
      for (const r of rivals) carsToDraw.push(r);
      carsToDraw.sort((a, b2) => relZ(b2, state.pos) - relZ(a, state.pos));
      for (const car of carsToDraw) {
        const z = relZ(car, state.pos);
        if (z < 30 || z > DRAW * SEG) continue;
        /* cari x layar: pakai kurva terakumulasi sederhana */
        const scale = focal / z;
        const curveOffset = curveOffsetAt(state.pos, z, segs, N);
        const sx = W / 2 + shakeX + (curveOffset + car.x * ROAD - camX) * scale;
        const segY = segYAt(state.pos + z, segs, N, SEG);
        const sy = horizon + (camY - segY) * scale;
        if (sy > H + 40) continue;
        const cw = Math.min(W * 0.32, 1500 * scale);
        drawCarRear(ctx, sx, sy, cw, { body: car.color, cabin: '#111827', braking: false, spoiler: !opts.bikesOnly });
      }
      /* mobil pemain */
      const carW = opts.bike ? W * 0.15 : W * 0.30;
      drawCarRear(ctx, W / 2 + shakeX * 0.5, H - 8, carW, { body: opts.carColor || '#ef4444', bike: opts.bike, braking: !!(opts.input && opts.input.down), drifting: state.drifting, spoiler: !opts.bike });
      function relZ(car, pos) { let dz = car.z - (pos % trackLength()); if (dz < 0) dz += trackLength(); return dz; }
      function quad(x1, y1, x2, y2, x3, y3, x4, y4) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
      }
    }

    return { state, step, render, trackLength: trackLength(), maxSpeed, opts };
  }
  const RUMBLE_ALT = 3;

  /* offset kurva sepanjang z relatif (untuk sprite mobil) */
  function curveOffsetAt(fromPos, relZ, segs, N) {
    let x = 0, dx = 0;
    const steps = Math.floor(relZ / SEG);
    let idx = Math.floor(fromPos / SEG) % N;
    const off = fromPos % SEG;
    dx = -(segs[idx].curve * (off / SEG));
    for (let n = 0; n <= steps && n < DRAW; n++) {
      x += dx; dx += segs[(idx + n) % N].curve;
    }
    return x;
  }
  function segYAt(pos, segs, N, SEG_) {
    const i = Math.floor(pos / SEG_) % N, t = (pos % SEG_) / SEG_;
    return lerp(segs[i].y, segs[(i + 1) % N].y, t);
  }

  return { createRacer, drawSky, drawStarBillboard };
})();
