/* Buggames — Game 3D (pseudo-3D OutRun style + heli heightfield) */
'use strict';

/* helper input (keyboard + dpad) */
function bindRacerInput(s, canvas, dpadEl, input) {
  const keyMap = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
  s.on(window, 'keydown', e => { const k = keyMap[e.key] || keyMap[e.key.toLowerCase()]; if (k) { e.preventDefault(); input[k] = true; } });
  s.on(window, 'keyup', e => { const k = keyMap[e.key] || keyMap[e.key.toLowerCase()]; if (k) input[k] = false; });
  if (dpadEl) {
    dpadEl.querySelectorAll('button').forEach(btn => {
      const d = btn.dataset.d;
      const on = () => { input[d] = true; };
      const off = () => { input[d] = false; };
      s.on(btn, 'pointerdown', e => { e.preventDefault(); on(); });
      s.on(btn, 'pointerup', off); s.on(btn, 'pointercancel', off); s.on(btn, 'pointerleave', off);
    });
  }
}
function racerShell(el, hudHtml) {
  el.innerHTML = '<div class="stage"><div class="hud">' + hudHtml + '</div>' +
    '<canvas width="600" height="380"></canvas>' +
    '<div class="autogas-pill">GAS OTOMATIS ⚡ tinggal dorong joystick & REM!</div>' +
    '<div class="vehicle-controls">' +
      '<div class="joystick-slot"></div>' +
      '<button class="rc-btn rc-brake" data-d="down" aria-label="Rem">REM</button>' +
    '</div></div>';
  const joy = E3D.createJoystick(el.querySelector('.joystick-slot'));
  return { stage: el.firstElementChild, canvas: el.querySelector('canvas'), dpad: el.querySelector('.vehicle-controls'), joy };
}
function inputObj() { return { left: false, right: false, up: false, down: false }; }
function retry3d(el, s, id) { return () => { el.innerHTML = ''; BG.games.find(g => g.id === id).start(el, s); }; }

/* ============ BALAP MOBIL 3D ============ */
BG.register({
  id: 'balap3d', name: 'Balap Mobil 3D', desc: 'Balapan 3 lap melawan 3 rival di trek pegunungan!', cat: '3d', icon: 'balap3d', tags: 'balap mobil 3d racing balapan',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Lap', 'b3-lap') + BG.hudPill('Posisi', 'b3-pos') + BG.hudPill('Kecepatan', 'b3-speed'), 'x');
    const lapEl = el.querySelector('#b3-lap'), posEl = el.querySelector('#b3-pos'), speedEl = el.querySelector('#b3-speed');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, {
      laps: 3, rivals: 3, traffic: 4, curveAmp: 2.8, hillAmp: 720,
      carColor: '#ef4444', sky: { top: '#1d4ed8', mid: '#60a5fa', low: '#fde68a', hills: '#14532d' },
    });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.opts && (racer.opts.input = input);
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      lapEl.textContent = Math.min(racer.state.lap, 3) + '/3';
      posEl.textContent = 'P' + racer.state.position;
      speedEl.textContent = Math.round(racer.state.speed / 55) + ' km/h';
      if (racer.state.done) {
        const win = racer.state.position === 1;
        BG.endScreen(canvas.parentElement, { score: win ? 1000 : 250 + (4 - racer.state.position) * 100, bestKey: 'balap3d', win, title: win ? 'JUARA 1!' : 'Posisi P' + racer.state.position, sub: win ? 'Kamu menyalip semua rival! Statistik dewa.' : 'Coba lagi, salip rival di lap terakhir!', onRetry: retry3d(el, s, 'balap3d') });
      }
    });
  }
});

/* ============ DRIFTING MOBIL 3D ============ */
BG.register({
  id: 'drift3d', name: 'Drifting Mobil 3D', desc: 'Drift di tikungan, kejar poin sebanyak-banyaknya!', cat: '3d', icon: 'drift3d', tags: 'drift drifting mobil 3d tikungan',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Poin Drift', 'dr-score') + BG.hudPill('Waktu', 'dr-time'), 'x');
    const scoreEl = el.querySelector('#dr-score'), timeEl = el.querySelector('#dr-time');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, { drift: true, timeLimit: 60, traffic: 3, curveAmp: 3.4, hillAmp: 420, carColor: '#f97316', spoiler: true });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      scoreEl.textContent = racer.state.score;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'drift3d', title: 'Waktu Habis!', sub: 'Poin drift kamu ' + racer.state.score + '. King of Drift!', scoreLabel: racer.state.score + ' poin', onRetry: retry3d(el, s, 'drift3d') });
      }
    });
  }
});

/* ============ JELAJAH HUTAN 3D ============ */
BG.register({
  id: 'hutan3d', name: 'Jelajah Hutan 3D', desc: 'Santai menyusuri hutan, kumpulkan kunang-kunang!', cat: '3d', icon: 'hutan3d', tags: 'hutan alam nature 3d kunang',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Kunang-kunang', 'ht-score') + BG.hudPill('Waktu', 'ht-time'), 'x');
    const scoreEl = el.querySelector('#ht-score'), timeEl = el.querySelector('#ht-time');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, { timeLimit: 90, trees: 2, curveAmp: 2.2, hillAmp: 800, maxSpeed: 6500, carColor: '#22c55e', collect: { type: 'firefly', every: 18, points: 10 }, sky: { top: '#0c4a6e', mid: '#155e75', low: '#fef08a', hills: '#052e16' } });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      scoreEl.textContent = racer.state.score;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'hutan3d', title: 'Jelajah Selesai!', sub: 'Kamu menangkap ' + racer.state.collected + ' kunang-kunang.', scoreLabel: racer.state.score, onRetry: retry3d(el, s, 'hutan3d') });
      }
    });
  }
});

/* ============ RALLY HUTAN 3D ============ */
BG.register({
  id: 'rally3d', name: 'Rally Hutan 3D', desc: 'Kebut hutan! Sampai checkpoint sebelum waktu habis.', cat: '3d', icon: 'rally3d', tags: 'rally hutan 3d kebut checkpoint',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Poin', 'ry-score') + BG.hudPill('Waktu', 'ry-time') + BG.hudPill('Checkpoint', 'ry-cp'), 'x');
    const scoreEl = el.querySelector('#ry-score'), timeEl = el.querySelector('#ry-time'), cpEl = el.querySelector('#ry-cp');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, { timeLimit: 30, checkpoints: true, checkpointEvery: 5200, checkpointBonus: 10, trees: 2, traffic: 0, curveAmp: 3.1, hillAmp: 760, maxSpeed: 9800, accel: 2600, carColor: '#eab308', sky: { top: '#0f766e', mid: '#2dd4bf', low: '#fef9c3', hills: '#052e16' } });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      scoreEl.textContent = racer.state.score;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      cpEl.textContent = racer.state.checkpoints;
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'rally3d', title: 'Rally Selesai!', sub: 'Checkpoint: ' + racer.state.checkpoints + ' • Poin: ' + racer.state.score, scoreLabel: racer.state.score + ' poin', onRetry: retry3d(el, s, 'rally3d') });
      }
    });
  }
});

/* ============ BALAPAN SEPEDA 3D ============ */
BG.register({
  id: 'sepeda3d', name: 'Balapan Sepeda 3D', desc: 'Kayuh sekencang-kencangnya! 2 lap vs pembalap lain.', cat: '3d', icon: 'sepeda3d', tags: 'sepeda bike 3d balapan gowes',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Lap', 'sp-lap') + BG.hudPill('Posisi', 'sp-pos') + BG.hudPill('Kecepatan', 'sp-speed'), 'x');
    const lapEl = el.querySelector('#sp-lap'), posEl = el.querySelector('#sp-pos'), speedEl = el.querySelector('#sp-speed');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, { laps: 2, rivals: 2, traffic: 0, bike: true, maxSpeed: 10500, accel: 2800, curveAmp: 2.5, hillAmp: 560, carColor: '#f8fafc', bikesOnly: true, sky: { top: '#1e40af', mid: '#38bdf8', low: '#ffedd5', hills: '#365314' } });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      lapEl.textContent = Math.min(racer.state.lap, 2) + '/2';
      posEl.textContent = 'P' + racer.state.position;
      speedEl.textContent = Math.round(racer.state.speed / 55) + ' km/h';
      if (racer.state.done) {
        const win = racer.state.position === 1;
        BG.endScreen(canvas.parentElement, { score: win ? 800 : 200, bestKey: 'sepeda3d', win, title: win ? 'JUARA GOWES!' : 'Posisi P' + racer.state.position, sub: win ? 'Kaki baja! Tidak ada yang bisa mengikutimu.' : 'Kayuh lebih kencang lagi!', onRetry: retry3d(el, s, 'sepeda3d') });
      }
    });
  }
});

/* ============ SAFARI 3D ============ */
BG.register({
  id: 'safari3d', name: 'Safari 3D', desc: 'Foto hewan liar sebisa mungkin dalam 70 detik!', cat: '3d', icon: 'safari3d', tags: 'safari hewan foto 3d afrika',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Foto', 'sf-score') + BG.hudPill('Waktu', 'sf-time'), 'x');
    const scoreEl = el.querySelector('#sf-score'), timeEl = el.querySelector('#sf-time');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, { timeLimit: 70, animals: true, traffic: 0, curveAmp: 2.4, hillAmp: 500, maxSpeed: 7200, carColor: '#ca8a04', sky: { top: '#0369a1', mid: '#7dd3fc', low: '#fed7aa', hills: '#a16207' } });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      scoreEl.textContent = racer.state.score;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'safari3d', title: 'Safari Selesai!', sub: 'Kamu memotret ' + racer.state.collected + ' hewan liar.', scoreLabel: racer.state.score + ' poin', onRetry: retry3d(el, s, 'safari3d') });
      }
    });
  }
});

/* ============ FREE RIDE 3D ============ */
BG.register({
  id: 'freeride3d', name: 'Free Ride 3D', desc: 'Jalan santai cari bintang di pegunungan!', cat: '3d', icon: 'freeride3d', tags: 'free ride bebas bintang 3d',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Bintang', 'fr-score') + BG.hudPill('Waktu', 'fr-time'), 'x');
    const scoreEl = el.querySelector('#fr-score'), timeEl = el.querySelector('#fr-time');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, { timeLimit: 75, traffic: 2, curveAmp: 2.0, hillAmp: 850, maxSpeed: 8200, carColor: '#8b5cf6', collect: { type: 'star', every: 22, points: 50 }, sky: { top: '#312e81', mid: '#818cf8', low: '#fecdd3', hills: '#1e293b' } });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      scoreEl.textContent = '★ ' + racer.state.collected;
      timeEl.textContent = Math.ceil(racer.state.timeLeft) + 's';
      if (racer.state.done) {
        BG.endScreen(canvas.parentElement, { score: racer.state.score, bestKey: 'freeride3d', title: 'Selesai!', sub: 'Kamu memanen ' + racer.state.collected + ' bintang.', scoreLabel: racer.state.score + ' poin', onRetry: retry3d(el, s, 'freeride3d') });
      }
    });
  }
});

/* ============ JUNGLE RUN 3D ============ */
BG.register({
  id: 'junglerun3d', name: 'Jungle Run 3D', desc: 'Lari di jalur hutan! Lompat kayu, hindari batu.', cat: '3d', icon: 'junglerun3d', tags: 'jungle run 3d lari temple run',
  start(el, s) {
    const W = 420, H = 440;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'jr-score') + BG.hudPill('Nyawa', 'jr-lives') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="vehicle-controls">' +
        '<div class="joystick-slot"></div>' +
        '<button class="rc-btn rc-jump" data-d="up">LOMPAT</button>' +
      '</div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const joy = E3D.createJoystick(el.querySelector('.joystick-slot'));
    const dpad = el.querySelector('.vehicle-controls');
    const scoreEl = el.querySelector('#jr-score'), livesEl = el.querySelector('#jr-lives');
    let lane = 1, jumpV = 0, jumpY = 0, lives = 3, score = 0, speed = 9, over = false, frame = 0, inv = 0;
    const obstacles = [];
    function jump() { if (jumpY === 0 && !over) { jumpV = 15; BG.sfx('pop'); } }
    function moveLane(d) { if (!over) { lane = Math.max(0, Math.min(2, lane + d)); BG.sfx('click'); } }
    const input = { left: false, right: false, up: false, down: false };
    bindRacerInput(s, canvas, dpad, input);
    let laneCooldown = 0;
    s.on(window, 'keydown', e => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } });

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 40 === 0) obstacles.push({ lane: BG.rand(0, 2), z: 1100, type: Math.random() < 0.62 ? 'log' : (Math.random() < 0.5 ? 'rock' : 'banana'), taken: false });
      speed = 9 + Math.floor(frame / 220);
      laneCooldown = Math.max(0, laneCooldown - 1);
      if (input.left && laneCooldown === 0) { moveLane(-1); laneCooldown = 14; }
      if (input.right && laneCooldown === 0) { moveLane(1); laneCooldown = 14; }
      /* joystick: geser lane dengan sentakan kiri/kanan */
      if (joy.x > 0.55 && laneCooldown === 0) { moveLane(1); laneCooldown = 16; }
      else if (joy.x < -0.55 && laneCooldown === 0) { moveLane(-1); laneCooldown = 16; }
      if (input.up) jump();
      if (jumpY > 0 || jumpV > 0) { jumpY += jumpV; jumpV -= 1.1; if (jumpY <= 0) { jumpY = 0; jumpV = 0; } }
      inv = Math.max(0, inv - 1);
      score++; scoreEl.textContent = Math.floor(score / 5);
      obstacles.forEach(o => o.z -= speed * 2.4);
      for (const o of obstacles) {
        if (o.taken) continue;
        if (o.z < 130 && o.z > -20) {
          const sameLane = o.lane === lane;
          if (o.type === 'banana') {
            if (sameLane) { o.taken = true; score += 50; BG.sfx('coin'); }
          } else if (sameLane && jumpY < 34 && inv === 0) {
            o.taken = true; lives--; livesEl.textContent = lives; inv = 70; BG.sfx('bad');
            if (lives <= 0) {
              over = true;
              BG.endScreen(canvas.parentElement, { score: Math.floor(score / 5), bestKey: 'junglerun3d', title: 'Jatuh!', sub: 'Jarak lari: ' + Math.floor(score / 5) + ' meter.', scoreLabel: Math.floor(score / 5) + ' m', onRetry: retry3d(el, s, 'junglerun3d') });
            }
          }
        }
      }
      /* gambar jalur 3D */
      const horizonY = H * 0.32;
      ctx.fillStyle = '#052e16'; ctx.fillRect(0, 0, W, horizonY);
      const g = ctx.createLinearGradient(0, horizonY, 0, H);
      g.addColorStop(0, '#166534'); g.addColorStop(1, '#14532d');
      ctx.fillStyle = g; ctx.fillRect(0, horizonY, W, H - horizonY);
      /* jalur batu perspektif semu */
      const laneX = (l, z) => {
        const t = 1 - z / 1100;
        const spread = 30 + t * 132;
        return W / 2 + (l - 1) * spread;
      };
      const laneW = z => 14 + (1 - z / 1100) * 105;
      /* gambar strip jalan dari jauh ke dekat */
      for (let z = 1100; z > 0; z -= 24) {
        const t = 1 - z / 1100;
        const y = horizonY + Math.pow(t, 1.7) * (H - horizonY);
        const h = Math.max(2, Math.pow((t + 0.02), 1.7) * (H - horizonY) - Math.pow(t, 1.7) * (H - horizonY)) + 2;
        ctx.fillStyle = Math.floor(z / 48) % 2 === 0 ? '#57534e' : '#44403c';
        ctx.fillRect(laneX(0, z) - laneW(z) / 2 - laneW(z) * 1.5, y, laneW(z) * 4, h);
      }
      /* rintangan dari jauh ke dekat */
      obstacles.filter(o => !o.taken).sort((a, b) => b.z - a.z).forEach(o => {
        const t = 1 - o.z / 1100;
        const y = horizonY + Math.pow(Math.max(0, t), 1.7) * (H - horizonY);
        const sc = 0.2 + Math.pow(Math.max(0, t), 1.7) * 1.35;
        const x = laneX(o.lane, o.z);
        if (o.type === 'banana') {
          ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2 * sc;
          ctx.beginPath(); ctx.ellipse(x, y - 14 * sc, 15 * sc, 8 * sc, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (o.type === 'log') {
          ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3 * sc;
          ctx.beginPath(); ctx.roundRect(x - 42 * sc, y - 22 * sc, 84 * sc, 22 * sc, 8 * sc); ctx.fill(); ctx.stroke();
        } else {
          ctx.fillStyle = '#6b7280'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3 * sc;
          ctx.beginPath(); ctx.ellipse(x, y - 20 * sc, 34 * sc, 22 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      });
      /* pemain: buggy besar di bawah tengah */
      const py = H - 8 - jumpY;
      const px = laneX(lane, 0) ;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(px, H - 4, 52, 12, 0, 0, Math.PI * 2); ctx.fill();
      drawMiniBug(ctx, px, py - 26, 30, inv > 0 && Math.floor(inv / 6) % 2 === 0 ? '#ffffff' : '#b9f542');
    });
    livesEl.textContent = lives;
  }
});

/* ============ HELIKOPTER 3D ============ */
BG.register({
  id: 'heli3d', name: 'Helikopter 3D', desc: 'Terbang bebas di atas pulau! Tembus cincin sebanyak-banyaknya.', cat: '3d', icon: 'heli3d', tags: 'helikopter heli 3d terbang simulasi',
  start(el, s) {
    const W = 600, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Cincin', 'hp-score') + BG.hudPill('Waktu', 'hp-time') + BG.hudPill('Ketinggian', 'hp-alt') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="vehicle-controls">' +
        '<div class="joystick-slot"></div>' +
        '<button class="rc-btn rc-boost" id="hp-boost">⚡<span class="rc-sub">NGEBUT</span></button>' +
      '</div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const boostBtn = el.querySelector('#hp-boost');
    const scoreEl = el.querySelector('#hp-score'), timeEl = el.querySelector('#hp-time'), altEl = el.querySelector('#hp-alt');
    const input = { left: false, right: false, up: false, down: false };
    const joy = E3D.createJoystick(el.querySelector('.joystick-slot'));
    bindRacerInput(s, canvas, null, input); /* keyboard: panah / WASD */
    /* kecepatan maju via tombol W / S */
    const throttle = { fast: false, slow: false };
    s.on(window, 'keydown', e => { const k = e.key.toLowerCase(); if (k === 'w') throttle.fast = true; if (k === 's') throttle.slow = true; });
    s.on(window, 'keyup', e => { const k = e.key.toLowerCase(); if (k === 'w') throttle.fast = false; if (k === 's') throttle.slow = false; });
    /* tahan tombol NGEBUT di layar */
    ['pointerdown'].forEach(ev => s.on(boostBtn, ev, e => { e.preventDefault(); throttle.fast = true; }));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => s.on(boostBtn, ev, () => { throttle.fast = false; }));

    /* pulau prosedural */
    function terrainH(x, z) {
      const d = Math.sqrt(x * x + z * z);
      let h = 80
        + Math.sin(x * 0.006) * Math.cos(z * 0.005) * 58
        + Math.sin((x + z) * 0.0035 + 1.7) * 34
        + Math.cos(x * 0.0021 - z * 0.0028) * 22;
      h -= Math.pow(d / 1250, 2) * 140;              /* falloff ke laut */
      return h;
    }
    const WATER = 0;
    const heli = { x: 0, z: 0, y: 170, heading: 0.6, speed: 32 };
    /* cincin-cincin melayang */
    const rings = [];
    for (let i = 0; i < 14; i++) {
      const a = i * 0.9, r = 250 + (i * 173) % 750;
      const rx = Math.cos(a) * r, rz = Math.sin(a) * r;
      rings.push({ x: rx, z: rz, y: Math.max(terrainH(rx, rz) + 70, 85), taken: false });
    }
    /* pohon */
    const trees = [];
    for (let i = 0; i < 240; i++) {
      const a = (i * 2.39996), r = 60 + ((i * 313) % 1050);
      const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
      const h = terrainH(tx, tz);
      if (h > WATER + 8) trees.push({ x: tx, z: tz, h });
    }

    let timeLeft = 90, score = 0, over = false, inv = 0;
    function terrainColor(h, shade) {
      let base;
      if (h < WATER + 6) base = [214, 203, 160];        /* pasir */
      else if (h < 70) base = [34, 197, 94];            /* rumput */
      else if (h < 115) base = [22, 101, 52];           /* hutan */
      else if (h < 145) base = [107, 114, 128];         /* batu */
      else base = [248, 250, 252];                      /* salju */
      return 'rgb(' + base.map(v => clamp255(v * shade)).join(',') + ')';
    }
    function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }
    function project(wx, wy, wz, cam, cosH, sinH) {
      const dx = wx - cam.x, dz = wz - cam.z;
      const cx = dx * cosH - dz * sinH;
      const cz = dx * sinH + dz * cosH;
      if (cz < 12) return null;
      const f = W * 0.85;
      return { x: W / 2 + (cx * f) / cz, y: H * 0.42 - ((wy - cam.y) * f) / cz, z: cz, scale: f / cz };
    }

    s.interval(() => {
      if (over) return;
      timeLeft--; timeEl.textContent = timeLeft + 's';
      if (timeLeft <= 0) finish();
    }, 1000);

    let last = 0;
    s.raf(t => {
      if (over) return;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      /* kontrol: joystick analog (utama) + keyboard */
      const turnIn = joy.x !== 0 ? joy.x * 1.55 : ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 1.5;
      heli.heading += turnIn * dt;
      let targetSpeed = 34;
      if (throttle.fast) targetSpeed = 58;
      if (throttle.slow) targetSpeed = 14;
      heli.speed += (targetSpeed - heli.speed) * Math.min(1, dt * 1.6);
      const climbIn = joy.y !== 0 ? -joy.y : ((input.up ? 1 : 0) - (input.down ? 1 : 0));
      if (climbIn !== 0) heli.y += climbIn * 46 * dt;
      heli.x += Math.sin(heli.heading) * heli.speed * dt;
      heli.z += Math.cos(heli.heading) * heli.speed * dt;
      heli.y = clampNum(heli.y, 30, 420);
      inv = Math.max(0, inv - dt);
      /* tabrakan tanah */
      const ground = terrainH(heli.x, heli.z);
      if (heli.y < ground + 12) {
        heli.y = ground + 12;
        if (inv <= 0) { inv = 1.6; BG.sfx('bad'); }
      }
      /* melewati cincin */
      for (const ring of rings) {
        if (ring.taken) continue;
        const d = Math.hypot(ring.x - heli.x, ring.z - heli.z, ring.y - heli.y);
        if (d < 42) { ring.taken = true; score += 100; BG.sfx('coin'); }
      }
      scoreEl.textContent = '★ ' + rings.filter(r => r.taken).length;
      altEl.textContent = Math.max(0, Math.round(heli.y - Math.max(ground, WATER))) + ' m';

      /* ===== RENDER ===== */
      const cosH = Math.cos(-heli.heading + Math.PI / 2 * 0), sinH = Math.sin(-heli.heading + Math.PI / 2 * 0);
      /* kamera: di belakang & di atas heli, menghadap arah terbang */
      const backX = heli.x - Math.sin(heli.heading) * 95, backZ = heli.z - Math.cos(heli.heading) * 95;
      const cam = { x: backX, y: heli.y + 34, z: backZ };
      const ch = -heli.heading;
      const cH = Math.cos(ch), sH = Math.sin(ch);
      /* langit */
      const horizonY = H * 0.42;
      const g = ctx.createLinearGradient(0, 0, 0, horizonY * 1.25);
      g.addColorStop(0, '#1e3a8a'); g.addColorStop(0.6, '#38bdf8'); g.addColorStop(1, '#fef3c7');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizonY * 1.3);
      /* laut */
      ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, horizonY, W, H - horizonY);
      ctx.fillStyle = '#075985'; ctx.fillRect(0, horizonY, W, 6);
      /* matahari */
      ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(W * 0.8, horizonY * 0.38, 26, 0, Math.PI * 2); ctx.fill();

      /* terrain mesh: grid relatif ke kamera, jauh → dekat */
      const GRID = 16, RANGE = 620, STEP = RANGE / GRID;
      const fx = Math.sin(heli.heading), fz = Math.cos(heli.heading);
      const rx = Math.cos(heli.heading), rz = -Math.sin(heli.heading);
      const quads = [];
      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          const zNear = row * STEP + 40, zFar = zNear + STEP;
          const lat0 = (col - GRID / 2) * STEP, lat1 = lat0 + STEP;
          const p = [
            [fx * zNear + rx * lat0, fz * zNear + rz * lat0],
            [fx * zNear + rx * lat1, fz * zNear + rz * lat1],
            [fx * zFar + rx * lat1, fz * zFar + rz * lat1],
            [fx * zFar + rx * lat0, fz * zFar + rz * lat0],
          ].map(([dx, dz]) => ({ x: heli.x + dx, z: heli.z + dz }));
          const hs = p.map(q => terrainH(q.x, q.z));
          quads.push({ p, hs, depth: zFar });
        }
      }
      quads.sort((a, b) => b.depth - a.depth);
      for (const q of quads) {
        const avgH = q.hs.reduce((a, b) => a + b, 0) / 4;
        if (avgH < WATER + 1) continue; /* area laut dilewati (sudah jadi background) */
        const shade = 0.62 + 0.38 * clampNum((avgH - WATER) / 160, 0, 1) + 0.12 * Math.sin(q.p[0].x * 0.05);
        const pts = q.p.map((pt, i) => project(pt.x, q.hs[i], pt.z, cam, cH, sH));
        if (pts.some(pt => !pt)) continue;
        ctx.fillStyle = terrainColor(avgH, shade);
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y); ctx.lineTo(pts[3].x, pts[3].y); ctx.closePath(); ctx.fill();
      }
      /* pohon: jauh ke dekat */
      trees.sort((a, b) => {
        const da = (a.x - heli.x) ** 2 + (a.z - heli.z) ** 2, db = (b.x - heli.x) ** 2 + (b.z - heli.z) ** 2;
        return db - da;
      });
      for (const tr of trees) {
        const d2 = (tr.x - heli.x) ** 2 + (tr.z - heli.z) ** 2;
        if (d2 > RANGE * RANGE * 1.1) continue;
        const p = project(tr.x, tr.h, tr.z, cam, cH, sH);
        if (!p || p.x < -60 || p.x > W + 60) continue;
        const h = clampNum(95 * p.scale, 2, 72);
        ctx.fillStyle = '#052e16';
        ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x - h * 0.32, p.y); ctx.lineTo(p.x + h * 0.32, p.y); ctx.closePath(); ctx.fill();
      }
      /* cincin */
      for (const ring of rings) {
        if (ring.taken) continue;
        const p = project(ring.x, ring.y, ring.z, cam, cH, sH);
        if (!p) continue;
        const r = clampNum(150 * p.scale, 2, 90);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = Math.max(2, r * 0.36);
        ctx.save(); ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      /* helikopter pemain (dari belakang) */
      if (inv <= 0 || Math.floor(inv * 6) % 2 === 0) {
        const hy = H * 0.78;
        ctx.fillStyle = '#b91c1c'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(W / 2, hy, 34, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(W / 2 - 4, hy - 46, 8, 30);
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 5;
        const rotor = (t / 30) % (Math.PI * 2);
        ctx.save(); ctx.translate(W / 2, hy - 48); ctx.rotate(0);
        ctx.beginPath(); ctx.moveTo(Math.cos(rotor) * -34, 0); ctx.lineTo(Math.cos(rotor) * 34, 0); ctx.moveTo(0, Math.sin(rotor) * -6 - 2); ctx.lineTo(0, Math.sin(rotor) * 6 + 2); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.ellipse(W / 2, hy + 4, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
      }
      /* HUD cincin tersisa */
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, 22);
      ctx.fillStyle = '#fde047'; ctx.font = '700 13px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.fillText('Cincin tersisa: ' + rings.filter(r => !r.taken).length + ' • Tahan W = ngebut', W / 2, 15);
    });

    function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function finish() {
      if (over) return; over = true;
      const got = rings.filter(r => r.taken).length;
      BG.endScreen(canvas.parentElement, { score, bestKey: 'heli3d', title: 'Mendarat!', sub: 'Kamu menembus ' + got + ' dari ' + rings.length + ' cincin.', scoreLabel: score + ' poin', onRetry: retry3d(el, s, 'heli3d') });
    }
    timeEl.textContent = timeLeft + 's';
  }
});
