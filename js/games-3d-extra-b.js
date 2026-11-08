/* Buggames — Game 3D EKSTRA NON-MOBIL (bagian B) */
'use strict';

/* ============ ALIEN BLASTER 3D ============ */
BG.register({
  id: 'alien3d', name: 'Alien Blaster 3D', desc: 'Tembak alien dari kejauhan!', cat: '3d', icon: 'alien3d', tags: 'alien blaster tembak 3d luar angkasa',
  start(el, s) {
    const W = 560, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'al-score') + BG.hudPill('Nyawa', 'al-lives') + BG.hudPill('Waktu', 'al-time') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '" style="cursor:crosshair"></canvas>' +
      '<p style="text-align:center;font-size:.8rem;color:#b8a6d9">Ketuk alien untuk menembak!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#al-score'), livesEl = el.querySelector('#al-lives'), timeEl = el.querySelector('#al-time');
    let score = 0, lives = 3, timeLeft = 45, over = false, frame = 0;
    const ALIENS = [
      { emoji: '👾', score: 50, speed: 1.0, size: 1.0 },
      { emoji: '👽', score: 80, speed: 1.25, size: 0.85 },
      { emoji: '🛸', score: 120, speed: 0.8, size: 1.3 },
    ];
    let aliens = [];
    const horizon = H * 0.34;

    function project(a) {
      const scale = 1.5 / a.depth;
      const x = W / 2 + a.lane * scale * W * 0.45;
      const y = H * 0.92 - a.height * scale * 300;
      const r = Math.max(7, 30 * scale * 3.4 * a.def.size);
      return { x, y, r };
    }
    function spawnAlien() {
      const def = BG.pick(ALIENS);
      aliens.push({ lane: BG.rand(-11, 11) / 10, height: BG.rand(35, 95) / 100, depth: BG.rand(55, 85) / 10, def, wobble: Math.random() * 6.28 });
    }
    s.interval(() => { if (over) return; timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) finish(); }, 1000);
    s.on(canvas, 'pointerdown', e => {
      if (over) return;
      const p = BG.canvasPos(canvas, e);
      let hit = -1;
      for (let i = aliens.length - 1; i >= 0; i--) { const pr = project(aliens[i]); if (Math.hypot(p.x - pr.x, p.y - pr.y) < pr.r + 5) { hit = i; break; } }
      if (hit >= 0) { score += aliens[hit].def.score; aliens.splice(hit, 1); scoreEl.textContent = score; BG.sfx('coin'); }
      else BG.sfx('click');
    });

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 42 === 0) spawnAlien();
      aliens.forEach(a => { a.depth -= 0.022 * a.def.speed * (1 + frame / 900); a.wobble += 0.05; a.lane += Math.sin(a.wobble) * 0.0016; });
      aliens = aliens.filter(a => { if (a.depth <= 0.9) { lives--; livesEl.textContent = lives; BG.sfx('bad'); if (lives <= 0) finish(); return false; } return true; });
      /* latar */
      const g = ctx.createLinearGradient(0, 0, 0, horizon + 4);
      g.addColorStop(0, '#0f0a2a'); g.addColorStop(1, '#3b0764');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 4);
      const g2 = ctx.createLinearGradient(0, horizon, 0, H);
      g2.addColorStop(0, '#1e1b4b'); g2.addColorStop(1, '#050514');
      ctx.fillStyle = g2; ctx.fillRect(0, horizon, W, H - horizon);
      ctx.fillStyle = '#f8fafc';
      [[30, 20], [110, 48], [210, 16], [300, 40], [390, 22], [470, 52], [540, 30]].forEach(([x, y]) => { ctx.globalAlpha = .75; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ddd6fe'; ctx.beginPath(); ctx.arc(W - 64, 40, 20, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c4b5fd'; ctx.beginPath(); ctx.arc(W - 58, 34, 6, 0, Math.PI * 2); ctx.arc(W - 70, 47, 4, 0, Math.PI * 2); ctx.fill();
      /* planet */
      ctx.fillStyle = '#7c3aed'; ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(60, H * 0.17, 34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      /* alien dari jauh ke dekat */
      aliens.sort((a, b) => b.depth - a.depth);
      aliens.forEach(a => {
        const pr = project(a);
        const fs = Math.max(10, pr.r * 1.35);
        ctx.font = fs + 'px serif'; ctx.textAlign = 'center';
        ctx.save(); ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 12;
        ctx.fillText(a.def.emoji, pr.x, pr.y + pr.r * 0.5);
        ctx.restore();
      });
      timeEl.textContent = timeLeft + 's';
    });
    function finish() {
      if (over) return; over = true;
      BG.endScreen(canvas.parentElement, { score, bestKey: 'alien3d', title: lives <= 0 ? 'Diserang!' : 'Waktu Habis!', sub: 'Alien dikalahkan: ' + Math.floor(score / 50) + '.', scoreLabel: score + ' poin', onRetry: retry3dX(el, s, 'alien3d') });
    }
    livesEl.textContent = lives; timeEl.textContent = timeLeft + 's'; scoreEl.textContent = 0;
  }
});

/* ============ TERJUN BEBAS 3D ============ */
BG.register({
  id: 'skydive3d', name: 'Terjun Bebas 3D', desc: 'Lompat dari pesawat, tembus cincin sampai daratan!', cat: '3d', icon: 'skydive3d', tags: 'terjun terjunpayung skydive 3d cincin',
  start(el, s) {
    const W = 600, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Cincin', 'sd-score') + BG.hudPill('Ketinggian', 'sd-alt') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="vehicle-controls"><div class="joystick-slot"></div></div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#sd-score'), altEl = el.querySelector('#sd-alt');
    const joy = E3D.createJoystick(el.querySelector('.joystick-slot'));
    const input = { left: false, right: false, up: false, down: false };
    bindRacerInputX(s, null, input);

    function terrainH(x, z) {
      const d = Math.sqrt(x * x + z * z);
      let h = 70 + Math.sin(x * 0.006) * Math.cos(z * 0.005) * 55 + Math.sin((x + z) * 0.0038 + 1.5) * 30;
      h -= Math.pow(d / 1250, 2) * 120;
      return h;
    }
    const pl = { x: 0, z: 0, y: 620, heading: 0.8, speed: 30 };
    const rings = [];
    for (let i = 0; i < 10; i++) {
      const a = i * 0.72 + 0.3, r = 90 + (i * 137) % 750;
      rings.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: Math.max(terrainH(Math.cos(a) * r, Math.sin(a) * r) + 70, 45), taken: false });
    }
    let score = 0, over = false, chute = false;
    const ringsTotal = rings.length;

    let last = 0;
    s.raf(t => {
      if (over) return;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const turnIn = joy.x !== 0 ? joy.x * 1.5 : ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 1.5;
      pl.heading += turnIn * dt;
      const pitch = joy.y !== 0 ? joy.y : ((input.down ? 1 : 0) - (input.up ? 1 : 0));
      const fallSpeed = chute ? 9 : 34;
      pl.y -= (fallSpeed + pitch * 14) * dt;
      pl.speed = chute ? 16 : 30 + pitch * 6;
      pl.x += Math.sin(pl.heading) * pl.speed * dt;
      pl.z += Math.cos(pl.heading) * pl.speed * dt;
      const ground = terrainH(pl.x, pl.z);
      if (!chute && pl.y < 120) chute = true;
      altEl.textContent = Math.max(0, Math.round(pl.y - ground)) + ' m';
      for (const ring of rings) {
        if (ring.taken) continue;
        if (Math.hypot(ring.x - pl.x, ring.z - pl.z, ring.y - pl.y) < 40) { ring.taken = true; score += 100; BG.sfx('coin'); }
      }
      scoreEl.textContent = '\u2605 ' + rings.filter(r => r.taken).length;
      if (pl.y <= ground + 8) {
        pl.y = ground + 8;
        over = true;
        const got = rings.filter(r => r.taken).length;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'skydive3d', win: got > 3, title: got === ringsTotal ? 'PERFECT LANDING!' : 'Mendarat!', sub: 'Cincin bebas: ' + got + ' dari ' + ringsTotal, scoreLabel: score + ' poin', onRetry: retry3dX(el, s, 'skydive3d') });
        return;
      }
      /* ===== render ===== */
      const horizonY = H * 0.4;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0f172a'); g.addColorStop(0.5, '#1e3a8a'); g.addColorStop(1, '#f0abfc');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(W * 0.16, H * 0.15, 24, 0, Math.PI * 2); ctx.fill();
      /* kecepatan angin */
      ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 12; i++) {
        const sx = (i * 173 + (t * 0.35)) % W;
        const sy = ((i * 97 + t * 0.8) % H);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 24, sy + 1); ctx.stroke();
      }
      /* pulau di bawah */
      const GRID = 13, RANGE = 620, STEP = RANGE / GRID;
      const fx = Math.sin(pl.heading), fz = Math.cos(pl.heading);
      const rx = Math.cos(pl.heading), rz = -Math.sin(pl.heading);
      const quads = [];
      for (let row = 0; row < GRID; row++) for (let col = 0; col < GRID; col++) {
        const zN = row * STEP + 40, zF = zN + STEP, lat0 = (col - GRID / 2) * STEP, lat1 = lat0 + STEP;
        const pts = [
          [fx * zN + rx * lat0, fz * zN + rz * lat0],
          [fx * zN + rx * lat1, fz * zN + rz * lat1],
          [fx * zF + rx * lat1, fz * zF + rz * lat1],
          [fx * zF + rx * lat0, fz * zF + rz * lat0],
        ].map(([dx, dz]) => ({ x: pl.x + dx, z: pl.z + dz }));
        quads.push({ pts, hs: pts.map(q => terrainH(q.x, q.z)), depth: zF });
      }
      quads.sort((a, b) => b.depth - a.depth);
      const cam = { x: pl.x - Math.sin(pl.heading) * 60, y: pl.y + 30, z: pl.z - Math.cos(pl.heading) * 60 };
      const ch = -pl.heading, cH = Math.cos(ch), sH = Math.sin(ch);
      for (const q of quads) {
        const avg = q.hs.reduce((a, b) => a + b, 0) / 4;
        const shade = 0.55 + 0.45 * clampN((avg + 40) / 160, 0, 1);
        const sp = q.pts.map((p, i) => project3(p.x, q.hs[i], p.z, cam, cH, sH, W, H));
        if (sp.some(p2 => !p2)) continue;
        const base = avg < 2 ? [214, 203, 160] : avg < 40 ? [34, 197, 94] : avg < 80 ? [22, 163, 74] : [120, 130, 140];
        ctx.fillStyle = 'rgb(' + base.map(v => clampN(Math.round(v * shade), 0, 255)).join(',') + ')';
        ctx.beginPath(); ctx.moveTo(sp[0].x, sp[0].y); ctx.lineTo(sp[1].x, sp[1].y); ctx.lineTo(sp[2].x, sp[2].y); ctx.lineTo(sp[3].x, sp[3].y); ctx.closePath(); ctx.fill();
      }
      /* cincin */
      for (const ring of rings) {
        if (ring.taken) continue;
        const p = project3(ring.x, ring.y, ring.z, cam, cH, sH, W, H);
        if (!p) continue;
        const r = clampN(120 * p.scale, 2, 46);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = Math.max(2, r * 0.36); ctx.save(); ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      /* terjun bebas (orang) */
      const py = H * 0.8;
      if (chute) {
        ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(W / 2, py - 30, 26, Math.PI, 0); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#241239'; ctx.beginPath(); ctx.moveTo(W / 2 - 26, py - 28); ctx.lineTo(W / 2 - 8, py + 4); ctx.moveTo(W / 2 + 26, py - 28); ctx.lineTo(W / 2 + 8, py + 4); ctx.stroke();
      }
      ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(W / 2, py, 10, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(W / 2, py - 19, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W / 2 - 10, py + 8); ctx.lineTo(W / 2 - 16, py + 22); ctx.moveTo(W / 2 + 10, py + 8); ctx.lineTo(W / 2 + 16, py + 22); ctx.stroke();
    });
    function project3(wx, wy, wz, cam, cH, sH, W, H) {
      const dx = wx - cam.x, dz = wz - cam.z;
      const cx = dx * cH - dz * sH, cz = dx * sH + dz * cH;
      if (cz < 12) return null;
      const f = W * 0.85;
      return { x: W / 2 + (cx * f) / cz, y: H * 0.4 - ((wy - cam.y) * f) / cz, z: cz, scale: f / cz };
    }
    function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }
  }
});

/* ============ SUMO BUG 3D ============ */
BG.register({
  id: 'sumo3d', name: 'Sumo Bug 3D', desc: 'Dorong bug lawan keluar dari arena!', cat: '3d', icon: 'sumo3d', tags: 'sumo bug dorong arena 3d',
  start(el, s) {
    const W = 460, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Menang', 'sm-wins') + BG.hudPill('Nyawa', 'sm-lives') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="vehicle-controls"><div class="joystick-slot"></div></div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const winsEl = el.querySelector('#sm-wins'), livesEl = el.querySelector('#sm-lives');
    const joy = E3D.createJoystick(el.querySelector('.joystick-slot'));
    const input = { left: false, right: false, up: false, down: false };
    bindRacerInputX(s, null, input);
    const CX = W / 2, CY = H * 0.55, ARENA_R = 128;
    const bugs = [];
    const COLORS = ['#ef4444', '#facc15', '#a78bfa'];
    let lives = 3, wins = 0, over = false, round = 1;

    function spawnRound() {
      bugs.length = 0;
      bugs.push({ x: CX, y: CY, vx: 0, vy: 0, r: 20, isPlayer: true, color: '#b9f542', hp: 3 });
      for (let i = 0; i < 2; i++) {
        const a = i * Math.PI + 0.6;
        bugs.push({ x: CX + Math.cos(a) * 74, y: CY + Math.sin(a) * 52, vx: 0, vy: 0, r: 19, isPlayer: false, color: COLORS[i], hp: 2 + round, ai: true });
      }
    }
    spawnRound();

    s.raf(() => {
      if (over) return;
      bugs.forEach(b => {
        if (b.isPlayer) {
          const ax = joy.x !== 0 ? joy.x : ((input.right ? 1 : 0) - (input.left ? 1 : 0));
          const ay = joy.y !== 0 ? joy.y : ((input.down ? 1 : 0) - (input.up ? 1 : 0));
          b.vx += ax * 0.22; b.vy += ay * 0.22;
        } else {
          /* AI memburu pemain */
          const dx = bugs[0].x - b.x, dy = bugs[0].y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          b.vx += (dx / d) * 0.13 * (1 + round * 0.12);
          b.vy += (dy / d) * 0.13 * (1 + round * 0.12);
        }
        b.vx *= 0.94; b.vy *= 0.94;
        b.x += b.vx; b.y += b.vy;
      });
      /* tabrakan antar bug */
      for (let i = 0; i < bugs.length; i++) for (let j = i + 1; j < bugs.length; j++) {
        const a = bugs[i], b = bugs[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        if (d < a.r + b.r) { const overlap = (a.r + b.r - d) / 2; const nx = dx / d, ny = dy / d; a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap; const push = 1.6; a.vx -= nx * push * 0.5; a.vy -= ny * push * 0.5; b.vx += nx * push; b.vy += ny * push; }
      }
      /* jatuh dari arena */
      bugs.forEach(b => {
        const d = Math.hypot(b.x - CX, (b.y - CY) * 1.35);
        if (d > ARENA_R) {
          if (b.isPlayer) { lives--; livesEl.textContent = lives; BG.sfx('bad'); if (lives <= 0) { over = true; endMatch(); } else { b.x = CX; b.y = CY; b.vx = 0; b.vy = 0; } }
          else { b.hp = 0; BG.sfx('coin'); }
        }
      });
      for (let i = bugs.length - 1; i >= 0; i--) if (!bugs[i].isPlayer && bugs[i].hp <= 0) bugs.splice(i, 1);
      if (bugs.filter(b => !b.isPlayer).length === 0 && !over) {
        wins++; winsEl.textContent = wins; round++; BG.sfx('win'); spawnRound();
      }
      /* ===== RENDER ===== */
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#0b0b26');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      /* sorotan siar */
      ctx.globalAlpha = 0.16; ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(W / 2 - 90, 0); ctx.lineTo(W / 2 + 90, 0); ctx.lineTo(W / 2 + 150, H); ctx.lineTo(W / 2 - 150, H); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      /* arena (elips pseudo-3D) */
      ctx.fillStyle = '#44403c'; ctx.beginPath(); ctx.ellipse(CX, CY, ARENA_R + 26, (ARENA_R + 26) * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#292524'; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = '#57534e'; ctx.beginPath(); ctx.ellipse(CX, CY, ARENA_R, ARENA_R * 0.52, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#451a03'; ctx.beginPath(); ctx.ellipse(CX, CY, ARENA_R * 0.3, ARENA_R * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      /* washi sumo */
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 6; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.ellipse(CX, CY, ARENA_R * 0.62, ARENA_R * 0.34, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      /* bug diurutkan dari jauh (y kecil) */
      bugs.slice().sort((a, b) => a.y - b.y).forEach(b => {
        const scale = 0.72 + (b.y - (CY - ARENA_R)) / (ARENA_R * 2) * 0.55;
        drawMiniBug(ctx, b.x, b.y, b.r * scale, b.color);
        /* HP bar */
        ctx.fillStyle = '#111827'; ctx.fillRect(b.x - 20, b.y - b.r * scale - 12, 40, 5);
        ctx.fillStyle = '#4ade80'; ctx.fillRect(b.x - 20, b.y - b.r * scale - 12, 40 * (b.hp / (b.isPlayer ? 3 : 2 + round)), 5);
      });
      /* label */
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.font = '700 12px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.fillText('Dorong semua bug musuh keluar arena! Ronde ' + round, W / 2, 16);
    });
    function endMatch() {
      BG.endScreen(canvas.parentElement, { score: wins * 150, bestKey: 'sumo3d', title: 'Tersingkir!', sub: 'Menang ' + wins + ' ronde berturut-turut.', scoreLabel: wins + ' ronde', onRetry: retry3dX(el, s, 'sumo3d') });
    }
    livesEl.textContent = lives; winsEl.textContent = wins;
  }
});

/* ============ SKATER 3D ============ */
BG.register({
  id: 'skater3d', name: 'Skater 3D', desc: 'Hujan malam di kota! Kumpulkan bintang koin!', cat: '3d', icon: 'skater3d', tags: 'skater skateboard skate kota 3d',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Koin', 'sk2-score') + BG.hudPill('Waktu', 'sk2-time'), 'x');
    const scoreEl = el.querySelector('#sk2-score'), timeEl = el.querySelector('#sk2-time');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, {
      timeLimit: 60, traffic: 6, curveAmp: 2.1, hillAmp: 150, maxSpeed: 8800, carColor: '#f8fafc', bike: true,
      trackLength: 300, grass1: '#111827', grass2: '#0b0f1d', road1: '#1f2937', road2: '#111827', trees: 0,
      collect: { type: 'star', every: 15, points: 25 },
      sky: { top: '#020024', mid: '#1e1b4b', low: '#f0abfc', hills: '#0b0f1d', sun: '#fda4af' },
    });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      scoreEl.textContent = '\u2605 ' + racer.state.collected;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'skater3d', title: 'Selesai!', sub: 'Koin bintang: ' + racer.state.collected, scoreLabel: racer.state.score, onRetry: retry3dX(el, s, 'skater3d') });
      }
    });
  }
});

/* ============ WAVE RIDER 3D ============ */
BG.register({
  id: 'waveride3d', name: 'Wave Rider 3D', desc: 'Selancar di atas gelombang raksasa!', cat: '3d', icon: 'waveride3d', tags: 'selancar wave surf 3d ombak',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Skor', 'wr-score') + BG.hudPill('Waktu', 'wr-time'), 'x');
    const scoreEl = el.querySelector('#wr-score'), timeEl = el.querySelector('#wr-time');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, {
      timeLimit: 45, traffic: 0, curveAmp: 3.6, hillAmp: 980, maxSpeed: 9100, accel: 2500, carColor: '#f97316', bike: true,
      trackLength: 280, trees: 0,
      grass1: '#0ea5e9', grass2: '#0369a1', road1: '#164e63', road2: '#083344',
      collect: { type: 'star', every: 12, points: 30 },
      sky: { top: '#7c2d12', mid: '#fb923c', low: '#fde68a', hills: '#7c2d12', sun: '#fdba74' },
    });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x * 0.9 });
      racer.render();
      scoreEl.textContent = racer.state.score;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'waveride3d', title: 'Berselancar!', sub: 'Bintang ombak: ' + racer.state.collected, scoreLabel: racer.state.score, onRetry: retry3dX(el, s, 'waveride3d') });
      }
    });
  }
});
