/* Buggames — Game 3D EKSTRA NON-MOBIL (bagian A) */
'use strict';

function retry3dX(el, s, id) { return () => { el.innerHTML = ''; BG.games.find(g => g.id === id).start(el, s); }; }

/* ============ SELAM LAUT 3D ============ */
BG.register({
  id: 'sub3d', name: 'Selam Laut 3D', desc: 'Selami dasar laut! Kumpulkan mutiara, hindari ubur-ubur.', cat: '3d', icon: 'sub3d', tags: 'selam laut submarine 3d mutiara ubur',
  start(el, s) {
    const W = 600, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Mutiara', 'sb-score') + BG.hudPill('Waktu', 'sb-time') + BG.hudPill('Nyawa', 'sb-lives') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="vehicle-controls"><div class="joystick-slot"></div>' +
        '<button class="rc-btn rc-boost" id="sb-boost">⚡<span class="rc-sub">NGEBUT</span></button></div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const boostBtn = el.querySelector('#sb-boost');
    const scoreEl = el.querySelector('#sb-score'), timeEl = el.querySelector('#sb-time'), livesEl = el.querySelector('#sb-lives');
    const input = { left: false, right: false, up: false, down: false };
    const joy = E3D.createJoystick(el.querySelector('.joystick-slot'));
    bindRacerInputX(s, null, input);

    function terrainH(x, z) {
      const d = Math.sqrt(x * x + z * z);
      let h = 60 + Math.sin(x * 0.008) * Math.cos(z * 0.006) * 45
        + Math.sin((x + z) * 0.004 + 2) * 26 + Math.cos(x * 0.0035) * 18;
      h -= Math.pow(d / 1500, 2) * 80;
      return h;
    }
    const sub = { x: 0, z: 0, y: 150, heading: 0.5, speed: 26 };
    const pearls = [];
    for (let i = 0; i < 20; i++) {
      const a = i * 2.4, r = 120 + (i * 197) % 900;
      pearls.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: Math.max(terrainH(Math.cos(a) * r, Math.sin(a) * r) + 30, 30), taken: false });
    }
    const jellies = [];
    for (let i = 0; i < 10; i++) {
      const a = i * 1.7 + 0.6, r = 150 + (i * 233) % 850;
      jellies.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: Math.max(terrainH(Math.cos(a) * r, Math.sin(a) * r) + 40, 40), phase: Math.random() * 6.28 });
    }
    const kelp = [];
    for (let i = 0; i < 160; i++) {
      const a = i * 2.3999, r = 60 + (i * 283) % 1000;
      const kx = Math.cos(a) * r, kz = Math.sin(a) * r;
      if (terrainH(kx, kz) > 0) kelp.push({ x: kx, z: kz, h: 60 + ((i * 37) % 80), sway: Math.random() * 6.28 });
    }
    let timeLeft = 75, lives = 3, score = 0, over = false, inv = 0;
    s.interval(() => { if (over) return; timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) finish(); }, 1000);

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    const throttle = { fast: false };
    s.on(window, 'keydown', e => { const k = e.key.toLowerCase(); if (k === 'w') throttle.fast = true; });
    s.on(window, 'keyup', e => { const k = e.key.toLowerCase(); if (k === 'w') throttle.fast = false; });
    s.on(boostBtn, 'pointerdown', e => { e.preventDefault(); throttle.fast = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => s.on(boostBtn, ev, () => { throttle.fast = false; }));

    function terrainColor(h, shade) {
      const base = h < 12 ? [214, 203, 160] : h < 40 ? [32, 150, 90] : h < 75 ? [20, 110, 70] : h < 120 ? [60, 70, 80] : [120, 130, 140];
      return 'rgb(' + base.map(v => clamp(Math.round(v * shade), 0, 255)).join(',') + ')';
    }
    function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }

    let last = 0;
    s.raf(t => {
      if (over) return;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const turnIn = joy.x !== 0 ? joy.x * 1.5 : ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 1.5;
      sub.heading += turnIn * dt;
      let targetSpeed = 26;
      if (throttle.fast) targetSpeed = 46;
      sub.speed += (targetSpeed - sub.speed) * Math.min(1, dt * 1.7);
      const climbIn = joy.y !== 0 ? -joy.y : ((input.up ? 1 : 0) - (input.down ? 1 : 0));
      if (climbIn !== 0) sub.y += climbIn * 42 * dt;
      sub.x += Math.sin(sub.heading) * sub.speed * dt;
      sub.z += Math.cos(sub.heading) * sub.speed * dt;
      inv = Math.max(0, inv - dt);
      const ground = terrainH(sub.x, sub.z);
      if (sub.y < ground + 10) sub.y = ground + 10;
      sub.y = clampNum(sub.y, 12, 260);
      for (const p of pearls) {
        if (p.taken) continue;
        if (Math.hypot(p.x - sub.x, p.z - sub.z, p.y - sub.y) < 38) { p.taken = true; score += 100; BG.sfx('coin'); }
      }
      for (const j of jellies) {
        if (Math.hypot(j.x - sub.x, j.z - sub.z, j.y - sub.y) < 34 && inv <= 0) { lives--; livesEl.textContent = lives; inv = 1.8; BG.sfx('bad'); if (lives <= 0) { finish(); } }
      }
      scoreEl.textContent = score;

      /* ===== RENDER ===== */
      const horizonY = H * 0.30;
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0c4a6e'); grad.addColorStop(0.35, '#075985'); grad.addColorStop(1, '#02121f');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      /* sinar cahaya */
      ctx.globalAlpha = 0.14;
      for (let i = 0; i < 5; i++) {
        const bx = ((i * 173 + 40 + t * 0.008) % (W + 160)) - 80;
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 60, 0); ctx.lineTo(bx + 160, H); ctx.lineTo(bx + 40, H); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      /* terumbu karang & pasir */
      const GRID = 14, RANGE = 560, STEP = RANGE / GRID;
      const fx = Math.sin(sub.heading), fz = Math.cos(sub.heading);
      const rx = Math.cos(sub.heading), rz = -Math.sin(sub.heading);
      const quads = [];
      for (let row = 0; row < GRID; row++) for (let col = 0; col < GRID; col++) {
        const zN = row * STEP + 44, zF = zN + STEP, lat0 = (col - GRID / 2) * STEP, lat1 = lat0 + STEP;
        const pts = [
          [fx * zN + rx * lat0, fz * zN + rz * lat0],
          [fx * zN + rx * lat1, fz * zN + rz * lat1],
          [fx * zF + rx * lat1, fz * zF + rz * lat1],
          [fx * zF + rx * lat0, fz * zF + rz * lat0],
        ].map(([dx, dz]) => ({ x: sub.x + dx, z: sub.z + dz }));
        quads.push({ pts, hs: pts.map(q => terrainH(q.x, q.z)), depth: zF });
      }
      quads.sort((a, b) => b.depth - a.depth);
      const cam = { x: sub.x - Math.sin(sub.heading) * 78, y: sub.y + 26, z: sub.z - Math.cos(sub.heading) * 78 };
      const ch = -sub.heading, cH = Math.cos(ch), sH = Math.sin(ch);
      for (const q of quads) {
        const avg = q.hs.reduce((a, b) => a + b, 0) / 4;
        const shade = 0.55 + 0.45 * clampNum((avg + 40) / 160, 0, 1);
        const sp = q.pts.map((p, i) => project3(p.x, q.hs[i], p.z, cam, cH, sH, W, H));
        if (sp.some(p2 => !p2)) continue;
        ctx.fillStyle = terrainColor(avg, shade);
        ctx.beginPath(); ctx.moveTo(sp[0].x, sp[0].y); ctx.lineTo(sp[1].x, sp[1].y); ctx.lineTo(sp[2].x, sp[2].y); ctx.lineTo(sp[3].x, sp[3].y); ctx.closePath(); ctx.fill();
      }
      /* ganggang laut */
      kelp.sort((a, b) => ((b.x - sub.x) ** 2 + (b.z - sub.z) ** 2) - ((a.x - sub.x) ** 2 + (a.z - sub.z) ** 2));
      for (const k of kelp) {
        const d2 = (k.x - sub.x) ** 2 + (k.z - sub.z) ** 2;
        if (d2 > RANGE * RANGE * 1.1) continue;
        const p = project3(k.x, terrainH(k.x, k.z), k.z, cam, cH, sH, W, H);
        if (!p || p.x < -40 || p.x > W + 40) continue;
        const h = clampNum(300 * p.scale, 3, 110);
        ctx.strokeStyle = '#15803d'; ctx.lineWidth = Math.max(2, h * 0.09);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + Math.sin(t / 700 + k.sway) * h * 0.3, p.y - h * 0.6, p.x + Math.sin(t / 700 + k.sway) * h * 0.42, p.y - h); ctx.stroke();
      }
      /* mutiara */
      for (const p of pearls) {
        if (p.taken) continue;
        const pr = project3(p.x, p.y, p.z, cam, cH, sH, W, H);
        if (!pr) continue;
        const r = clampNum(60 * pr.scale, 1.5, 13);
        ctx.save(); ctx.shadowColor = '#f8fafc'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      /* ubur-ubur */
      for (const j of jellies) {
        j.phase += dt * 2;
        const p = project3(j.x, j.y + Math.sin(j.phase) * 8, j.z, cam, cH, sH, W, H);
        if (!p) continue;
        const r = clampNum(110 * p.scale, 2, 32);
        ctx.fillStyle = '#c084fc'; ctx.strokeStyle = '#7e22ce'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.72, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x - r * 0.5, p.y); for (let i = -1; i <= 1; i++) { ctx.quadraticCurveTo(p.x + i * r * 0.35 + Math.sin(j.phase * 2) * 3, p.y + r * 0.7, p.x + i * r * 0.3, p.y + r * 1.15); } ctx.stroke();
      }
      /* kapal selam pemain (dari belakang) */
      const sy = H * 0.78;
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(W / 2, sy, 40, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d97706'; ctx.beginPath(); ctx.ellipse(W / 2, sy - 12, 20, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.ellipse(W / 2, sy - 13, 11, 5.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const px = W / 2 - 26 + i * 26; ctx.beginPath(); ctx.arc(px, sy + 10, 4, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.stroke(); }
      /* HUD top */
      ctx.fillStyle = 'rgba(2,18,31,.55)'; ctx.fillRect(0, 0, W, 22);
      ctx.fillStyle = '#7dd3fc'; ctx.font = '700 13px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.fillText('Mutiara: ' + pearls.filter(p => p.taken).length + '/20 • Tahan W / NGEBUT', W / 2, 15);
      if (timeEl.textContent === '0s') timeEl.textContent = '75s';
    });
    function project3(wx, wy, wz, cam, cH, sH, W, H) {
      const dx = wx - cam.x, dz = wz - cam.z;
      const cx = dx * cH - dz * sH, cz = dx * sH + dz * cH;
      if (cz < 12) return null;
      const f = W * 0.85;
      return { x: W / 2 + (cx * f) / cz, y: H * 0.42 - ((wy - cam.y) * f) / cz, z: cz, scale: f / cz };
    }
    function finish() {
      if (over) return; over = true;
      const got = pearls.filter(p => p.taken).length;
      BG.endScreen(canvas.parentElement, { score, bestKey: 'sub3d', win: got > 4, title: lives <= 0 ? 'Kandas Ubur!' : 'Selam Selesai!', sub: 'Kamu mengumpulkan ' + got + ' mutiara.', scoreLabel: score + ' poin', onRetry: retry3dX(el, s, 'sub3d') });
    }
    livesEl.textContent = lives; scoreEl.textContent = 0; timeEl.textContent = '75s';
  }
});

/* bind keyboard only (dpad dihapus, joystick dipakai) */
function bindRacerInputX(s, dpadEl, input) {
  const keyMap = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
  s.on(window, 'keydown', e => { const k = keyMap[e.key] || keyMap[e.key.toLowerCase()]; if (k) { e.preventDefault(); input[k] = true; } });
  s.on(window, 'keyup', e => { const k = keyMap[e.key] || keyMap[e.key.toLowerCase()]; if (k) input[k] = false; });
}

/* ============ SKI 3D ============ */
BG.register({
  id: 'ski3d', name: 'Ski 3D', desc: 'Slalom salju! Tiang gate dari salju!', cat: '3d', icon: 'ski3d', tags: 'ski salju salju ski slalom 3d',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Poin', 'sk-score') + BG.hudPill('Waktu', 'sk-time') + BG.hudPill('Gate', 'sk-cp'), 'x');
    const scoreEl = el.querySelector('#sk-score'), timeEl = el.querySelector('#sk-time'), cpEl = el.querySelector('#sk-cp');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, {
      timeLimit: 45, checkpointEvery: 2400, checkpointBonus: 6, checkpoints: true,
      curveAmp: 3.3, hillAmp: 780, maxSpeed: 9800, accel: 2500, carColor: '#f8fafc',
      trackLength: 280, grass1: '#e2e8f0', grass2: '#cbd5e1', road1: '#e0f2fe', road2: '#bae6fd', trees: 2,
      sky: { top: '#60a5fa', mid: '#bfdbfe', low: '#ffffff', hills: '#e2e8f0', sun: '#fefce8' },
    });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x * 0.85 });
      racer.render();
      scoreEl.textContent = racer.state.score;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      cpEl.textContent = racer.state.checkpoints;
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'ski3d', title: 'FINISH!', sub: 'Gate slalom dilalui: ' + racer.state.checkpoints, scoreLabel: racer.state.score + ' poin', onRetry: retry3dX(el, s, 'ski3d') });
      }
    });
  }
});

/* ============ JETPACK 3D ============ */
BG.register({
  id: 'jetpack3d', name: 'Jetpack 3D', desc: 'Terbang dengan jetpack! Tembus cincin di langit!', cat: '3d', icon: 'jetpack3d', tags: 'jetpack terbang 3d cincin langit',
  start(el, s) {
    const W = 600, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Cincin', 'jp-score') + BG.hudPill('Waktu', 'jp-time') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="vehicle-controls"><div class="joystick-slot"></div>' +
        '<button class="rc-btn rc-boost" id="jp-boost">🔥<span class="rc-sub">NGEBUT</span></button></div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const boostBtn = el.querySelector('#jp-boost');
    const scoreEl = el.querySelector('#jp-score'), timeEl = el.querySelector('#jp-time');
    const joy = E3D.createJoystick(el.querySelector('.joystick-slot'));
    const input = { left: false, right: false, up: false, down: false };
    bindRacerInputX(s, null, input);

    const hero = { x: 0, z: 0, y: 200, heading: 0, speed: 38 };
    const rings = [];
    for (let i = 0; i < 18; i++) {
      const a = i * 1.1 + 0.4, r = 90 + (i * 149) % 800;
      rings.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 90 + ((i * 167) % 200), taken: false });
    }
    const clouds = [];
    for (let i = 0; i < 60; i++) {
      const a = i * 2.3999, r = 80 + (i * 311) % 1100;
      clouds.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 40 + ((i * 197) % 320), s: 30 + ((i * 53) % 60) });
    }
    let timeLeft = 60, score = 0, over = false;
    s.interval(() => { if (over) return; timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) finish(); }, 1000);
    const throttle = { fast: false };
    s.on(boostBtn, 'pointerdown', e => { e.preventDefault(); throttle.fast = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => s.on(boostBtn, ev, () => { throttle.fast = false; }));

    let last = 0;
    s.raf(t => {
      if (over) return;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const turnIn = joy.x !== 0 ? joy.x * 1.6 : ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 1.6;
      hero.heading += turnIn * dt;
      let targetSpeed = 38;
      if (throttle.fast) targetSpeed = 66;
      hero.speed += (targetSpeed - hero.speed) * Math.min(1, dt * 1.8);
      const climbIn = joy.y !== 0 ? -joy.y : ((input.up ? 1 : 0) - (input.down ? 1 : 0));
      hero.y += climbIn * 55 * dt;
      hero.x += Math.sin(hero.heading) * hero.speed * dt;
      hero.z += Math.cos(hero.heading) * hero.speed * dt;
      hero.y = Math.max(50, Math.min(400, hero.y));
      for (const ring of rings) {
        if (ring.taken) continue;
        if (Math.hypot(ring.x - hero.x, ring.z - hero.z, ring.y - hero.y) < 40) { ring.taken = true; score += 100; BG.sfx('coin'); }
      }
      scoreEl.textContent = '\u2605 ' + rings.filter(r => r.taken).length;

      const horizonY = H * 0.42;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#312e81'); g.addColorStop(0.4, '#6366f1'); g.addColorStop(0.75, '#c084fc'); g.addColorStop(1, '#fbcfe8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fefce8'; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.14, 26, 0, Math.PI * 2); ctx.fill();
      /* awan */
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      const cam = { x: hero.x - Math.sin(hero.heading) * 70, y: hero.y + 22, z: hero.z - Math.cos(hero.heading) * 70 };
      const ch = -hero.heading, cH = Math.cos(ch), sH = Math.sin(ch);
      clouds.sort((a, b) => ((b.x - hero.x) ** 2 + (b.z - hero.z) ** 2) - ((a.x - hero.x) ** 2 + (a.z - hero.z) ** 2));
      for (const c of clouds) {
        const p = project3(c.x, c.y, c.z, cam, cH, sH, W, H);
        if (!p) continue;
        const r = clampNum(150 * p.scale, 2, 44);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.arc(p.x + r * 0.8, p.y + 3, r * 0.7, 0, Math.PI * 2); ctx.arc(p.x - r * 0.8, p.y + 4, r * 0.65, 0, Math.PI * 2); ctx.fill();
      }
      /* cincin */
      for (const ring of rings) {
        if (ring.taken) continue;
        const p = project3(ring.x, ring.y, ring.z, cam, cH, sH, W, H);
        if (!p) continue;
        const r = clampNum(130 * p.scale, 2, 55);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = Math.max(2, r * 0.38); ctx.save(); ctx.shadowColor = '#fde047'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      /* pahlawan dengan jetpack */
      const hy = H * 0.75;
      ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(W / 2, hy, 15, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(W / 2, hy - 24, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#78350f'; ctx.fillRect(W / 2 - 11, hy + 14, 22, 7);
      /* api jetpack */
      const flame = 10 + Math.sin(t / 40) * 4;
      ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(W / 2 - 9, hy + 21); ctx.lineTo(W / 2 + 9, hy + 21); ctx.lineTo(W / 2, hy + 21 + flame); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(W / 2 - 5, hy + 21); ctx.lineTo(W / 2 + 5, hy + 21); ctx.lineTo(W / 2, hy + 21 + flame * 0.6); ctx.closePath(); ctx.fill();
    });
    function project3(wx, wy, wz, cam, cH, sH, W, H) {
      const dx = wx - cam.x, dz = wz - cam.z;
      const cx = dx * cH - dz * sH, cz = dx * sH + dz * cH;
      if (cz < 12) return null;
      const f = W * 0.85;
      return { x: W / 2 + (cx * f) / cz, y: H * 0.42 - ((wy - cam.y) * f) / cz, z: cz, scale: f / cz };
    }
    function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function finish() {
      if (over) return; over = true;
      const got = rings.filter(r => r.taken).length;
      BG.endScreen(canvas.parentElement, { score, bestKey: 'jetpack3d', title: 'Mendarat!', sub: 'Cincin langit ditembus: ' + got + ' dari ' + rings.length, scoreLabel: score + ' poin', onRetry: retry3dX(el, s, 'jetpack3d') });
    }
    timeEl.textContent = '60s';
  }
});

/* ============ KELERENG RUSH 3D ============ */
BG.register({
  id: 'marble3d', name: 'Kelereng Rush 3D', desc: 'Kelereng menggelinding lintasan 3D! Hindari rintangan!', cat: '3d', icon: 'marble3d', tags: 'kelereng marble rush 3d lintasan',
  start(el, s) {
    const W = 420, H = 440;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'mr-score') + BG.hudPill('Nyawa', 'mr-lives') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="racer-controls" style="max-width:380px"><button class="rc-btn rc-steer" data-d="left" aria-label="Geser kiri">◀</button>' +
        '<button class="rc-btn rc-steer" data-d="right" aria-label="Geser kanan">▶</button></div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#mr-score'), livesEl = el.querySelector('#mr-lives');
    let lane = 1, lives = 3, score = 0, speed = 9, over = false, frame = 0, inv = 0;
    const obstacles = [];
    const LANES_X = z => { const t = 1 - z / 1100; const spread = 26 + t * 128; return W / 2 + (laneAt(z, LANES_CUR)) * spread; };
    let LANES_CUR = 1;
    function laneX(l, z) { const t = 1 - z / 1100; const spread = 26 + t * 128; return W / 2 + (l - 1) * spread; }
    function spawnOb() { obstacles.push({ lane: BG.rand(0, 2), z: 1100, type: Math.random() < 0.62 ? 'wall' : 'gem', taken: false }); }
    function moveLane(d) { if (!over) { lane = Math.max(0, Math.min(2, lane + d)); BG.sfx('click'); } }
    const input = { left: false, right: false, up: false, down: false };
    bindRacerInputX(s, null, input);
    let laneCooldown = 0;

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 36 === 0) spawnOb();
      speed = 9 + Math.floor(frame / 200);
      laneCooldown = Math.max(0, laneCooldown - 1);
      if (input.left && laneCooldown === 0) { moveLane(-1); laneCooldown = 13; }
      if (input.right && laneCooldown === 0) { moveLane(1); laneCooldown = 13; }
      inv = Math.max(0, inv - 1);
      score++; scoreEl.textContent = Math.floor(score / 5);
      obstacles.forEach(o => o.z -= speed * 2.3);
      for (const o of obstacles) {
        if (o.taken || o.z > 130 || o.z < -20) continue;
        if (o.lane === lane) {
          if (o.type === 'gem') { o.taken = true; score += 50; BG.sfx('coin'); }
          else if (inv === 0) { o.taken = true; lives--; livesEl.textContent = lives; inv = 70; BG.sfx('bad'); if (lives <= 0) { over = true; BG.endScreen(canvas.parentElement, { score: Math.floor(score / 5), bestKey: 'marble3d', title: 'Pecah!', sub: 'Jarak: ' + Math.floor(score / 5) + ' meter.', scoreLabel: Math.floor(score / 5) + ' m', onRetry: retry3dX(el, s, 'marble3d') }); } }
        }
      }
      /* gambar */
      const horizonY = H * 0.3;
      const g = ctx.createLinearGradient(0, 0, 0, horizonY); g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#5b21b6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizonY);
      const g2 = ctx.createLinearGradient(0, horizonY, 0, H); g2.addColorStop(0, '#4c1d95'); g2.addColorStop(1, '#2e1065');
      ctx.fillStyle = g2; ctx.fillRect(0, horizonY, W, H - horizonY);
      for (let z = 1100; z > 0; z -= 24) {
        const t = 1 - z / 1100;
        const y = horizonY + Math.pow(t, 1.7) * (H - horizonY);
        const h = Math.max(2, Math.pow(t + 0.02, 1.7) * (H - horizonY) - Math.pow(t, 1.7) * (H - horizonY)) + 2;
        ctx.fillStyle = Math.floor(z / 48) % 2 === 0 ? '#6b7280' : '#4b5563';
        ctx.fillRect(laneX(0, z) - 60, y, 120 + (1 - z / 1100) * 210 * 2, h);
      }
      /* rintangan */
      obstacles.filter(o => !o.taken).sort((a, b) => b.z - a.z).forEach(o => {
        const t = 1 - o.z / 1100;
        const y = horizonY + Math.pow(Math.max(0, t), 1.7) * (H - horizonY);
        const sc = 0.25 + Math.pow(Math.max(0, t), 1.7) * 1.3;
        const x = laneX(o.lane, o.z);
        if (o.type === 'gem') { ctx.fillStyle = '#c084fc'; ctx.strokeStyle = '#7e22ce'; ctx.lineWidth = 2 * sc; ctx.beginPath(); ctx.moveTo(x, y - 30 * sc); ctx.lineTo(x + 16 * sc, y - 8 * sc); ctx.lineTo(x, y + 12 * sc); ctx.lineTo(x - 16 * sc, y - 8 * sc); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else { ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3 * sc; ctx.beginPath(); ctx.roundRect(x - 32 * sc, y - 26 * sc, 64 * sc, 26 * sc, 5 * sc); ctx.fill(); ctx.stroke(); }
      });
      /* kelereng */
      const py = H - 10;
      const px = laneX(lane, 0);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(px, H - 4, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
      const marbleGrad = ctx.createRadialGradient(px - 6, py - 22, 2, px, py - 18, 18);
      marbleGrad.addColorStop(0, '#e0e7ff'); marbleGrad.addColorStop(0.5, '#818cf8'); marbleGrad.addColorStop(1, '#3730a3');
      ctx.fillStyle = inv > 0 && Math.floor(inv / 6) % 2 === 0 ? '#ffffff' : marbleGrad;
      ctx.beginPath(); ctx.arc(px, py - 18, 17, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#241239'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(px - 6, py - 24, 5, 0, Math.PI * 2); ctx.fill();
    });
    livesEl.textContent = lives;
    function laneAt() { return lane; }
  }
});
