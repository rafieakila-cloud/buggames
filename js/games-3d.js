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

/* ============ BALAP MALAM NEON 3D ============ */
BG.register({
  id: 'night3d', name: 'Balap Malam Neon 3D', desc: 'Balapan malam penuh lampu neon! 3 lap.', cat: '3d', icon: 'night3d', tags: 'malam neon night 3d balap balapan',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Lap', 'nt-lap') + BG.hudPill('Posisi', 'nt-pos') + BG.hudPill('Kecepatan', 'nt-speed'), 'x');
    const lapEl = el.querySelector('#nt-lap'), posEl = el.querySelector('#nt-pos'), speedEl = el.querySelector('#nt-speed');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, {
      laps: 3, rivals: 3, traffic: 5, curveAmp: 2.8, hillAmp: 480, carColor: '#22d3ee',
      trackLength: 300, grass1: '#0b1023', grass2: '#070b1c', road1: '#111827', road2: '#0b1120',
      sky: { top: '#020024', mid: '#4c1d95', low: '#f0abfc', hills: '#0b1023', sun: '#f0abfc' },
    });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x });
      racer.render();
      lapEl.textContent = Math.min(racer.state.lap, 3) + '/3';
      posEl.textContent = 'P' + racer.state.position;
      speedEl.textContent = Math.round(racer.state.speed / 55) + ' km/h';
      if (racer.state.done) {
        const win = racer.state.position === 1;
        BG.endScreen(canvas.parentElement, { score: win ? 1000 : 300, bestKey: 'night3d', win, title: win ? 'RAJA NEON!' : 'Posisi P' + racer.state.position, sub: win ? 'Neon malam tak bisa menghentikanmu!' : 'Balapan lebih jago lagi!', onRetry: retry3d(el, s, 'night3d') });
      }
    });
  }
});

/* ============ RALLY SALJU 3D ============ */
BG.register({
  id: 'snow3d', name: 'Rally Salju 3D', desc: 'Rally di salju! Jalan licin, tikungan beku!', cat: '3d', icon: 'snow3d', tags: 'salju snow rally 3d licin',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Lap', 'sn-lap') + BG.hudPill('Posisi', 'sn-pos') + BG.hudPill('Kecepatan', 'sn-speed'), 'x');
    const lapEl = el.querySelector('#sn-lap'), posEl = el.querySelector('#sn-pos'), speedEl = el.querySelector('#sn-speed');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, {
      laps: 2, rivals: 2, traffic: 0, curveAmp: 3.6, hillAmp: 700, maxSpeed: 8200, accel: 1500, carColor: '#f8fafc',
      trackLength: 280, grass1: '#e2e8f0', grass2: '#cbd5e1', road1: '#94a3b8', road2: '#64748b', trees: 1,
      sky: { top: '#60a5fa', mid: '#bfdbfe', low: '#ffffff', hills: '#cbd5e1', sun: '#fefce8' },
    });
    bindRacerInput(s, canvas, dpad, input);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      racer.step(dt, { left: input.left, right: input.right, down: input.down, up: true, steer: joy.x * 0.82 });
      racer.render();
      lapEl.textContent = Math.min(racer.state.lap, 2) + '/2';
      posEl.textContent = 'P' + racer.state.position;
      speedEl.textContent = Math.round(racer.state.speed / 55) + ' km/h';
      if (racer.state.done) {
        const win = racer.state.position === 1;
        BG.endScreen(canvas.parentElement, { score: win ? 800 : 250, bestKey: 'snow3d', win, title: win ? 'RAJA SALJU!' : 'Posisi P' + racer.state.position, sub: win ? 'Licin tapi bukan masalah!' : 'Waspada di tikungan beku!', onRetry: retry3d(el, s, 'snow3d') });
      }
    });
  }
});

/* ============ MOTOCROSS 3D ============ */
BG.register({
  id: 'moto3d', name: 'Motocross 3D', desc: 'Lompat-lompatan di bukit tanah!', cat: '3d', icon: 'moto3d', tags: 'motocross mx motor bukit 3d',
  start(el, s) {
    const { canvas, dpad, joy } = racerShell(el, BG.hudPill('Lap', 'mx-lap') + BG.hudPill('Posisi', 'mx-pos') + BG.hudPill('Kecepatan', 'mx-speed'), 'x');
    const lapEl = el.querySelector('#mx-lap'), posEl = el.querySelector('#mx-pos'), speedEl = el.querySelector('#mx-speed');
    const input = inputObj();
    const racer = E3D.createRacer(canvas, {
      laps: 2, rivals: 2, traffic: 0, curveAmp: 3.2, hillAmp: 1250, maxSpeed: 8800, accel: 2400, carColor: '#f97316',
      trackLength: 260, grass1: '#a16207', grass2: '#854d0e', road1: '#d6d3d1', road2: '#a8a29e', trees: 1,
      sky: { top: '#0c4a6e', mid: '#38bdf8', low: '#fed7aa', hills: '#78350f', sun: '#fde68a' },
    });
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
        BG.endScreen(canvas.parentElement, { score: win ? 800 : 250, bestKey: 'moto3d', win, title: win ? 'KING OF MX!' : 'Posisi P' + racer.state.position, sub: win ? 'Melompat di atas segalanya!' : 'Bukit memang kejam, coba lagi!', onRetry: retry3d(el, s, 'moto3d') });
      }
    });
  }
});

/* ============ DRAG RACE 3D ============ */
BG.register({
  id: 'drag3d', name: 'Drag Race 3D', desc: 'Balapan drag 400m! Pindah gigi di zona hijau!', cat: '3d', icon: 'drag3d', tags: 'drag balapan gigi shift 3d',
  start(el, s) {
    const W = 600, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Jarak', 'dg-dist') + BG.hudPill('Gigi', 'dg-gear') + BG.hudPill('Waktu', 'dg-time') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="vehicle-controls"><button class="rc-btn" id="dg-shift" style="flex:1.6;background:var(--teal);color:var(--ink);font-size:1.3rem">GIGI UP ▲</button></div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const distEl = el.querySelector('#dg-dist'), gearEl = el.querySelector('#dg-gear'), timeEl = el.querySelector('#dg-time'), shiftBtn = el.querySelector('#dg-shift');
    let phase = 'countdown', count = 3, raceTime = 0, dist = 0, gear = 1, rpm = 0, over = false, msg = '', boostMsg = 0;
    const MAXGEAR = 5, TARGET = 400;
    const gearTop = [0, 90, 150, 215, 280, 340]; /* km/h per gigi */
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function shift() {
      if (over || phase !== 'race') return;
      const inZone = rpm > 0.62 && rpm < 0.92;
      if (inZone) { gear = Math.min(MAXGEAR, gear + 1); rpm = 0.35; boostMsg = 1.4; BG.sfx('coin'); }
      else { rpm = Math.max(0.15, rpm - 0.18); BG.sfx('bad'); }
      gearEl.textContent = gear;
    }
    shiftBtn.addEventListener('pointerdown', e => { e.preventDefault(); shift(); });
    s.on(window, 'keydown', e => { if (e.key === ' ' || e.key === 'Shift') { e.preventDefault(); shift(); } });
    s.interval(() => {
      if (over) return;
      if (phase === 'countdown') { count--; msg = count > 0 ? String(count) : 'GO!'; BG.sfx('click'); if (count <= 0) phase = 'race'; }
    }, 750);
    let last = 0;
    s.raf(t => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (phase === 'race' && !over) {
        raceTime += dt;
        const top = gearTop[gear] / 3.6;
        const speed = (gear === MAXGEAR ? top : Math.min(top, raceTime * 9 + gear * 6)) * 0.94;
        rpm = clamp(0.15 + (speed / top) * 0.95, 0, 1.08);
        dist += speed * dt * 1.05 + (boostMsg > 0 ? 6 : 0);
        boostMsg = Math.max(0, boostMsg - dt);
        if (dist >= TARGET) {
          dist = TARGET; over = true;
          const score = Math.max(10, Math.round((12.5 - raceTime) * 400));
          BG.sfx('win');
          BG.endScreen(canvas.parentElement, { score, bestKey: 'drag3d', title: 'FINISH!', sub: '400m dalam ' + raceTime.toFixed(2) + ' detik!', scoreLabel: raceTime.toFixed(2) + 's', onRetry: retry3d(el, s, 'drag3d') });
        }
      }
      distEl.textContent = Math.floor(dist) + 'm';
      timeEl.textContent = raceTime.toFixed(1) + 's';
      ctx.fillStyle = '#0b1120'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W * 0.42, H * 0.32); ctx.lineTo(W * 0.58, H * 0.32); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#facc15';
      for (let i = 0; i < 6; i++) { const z = ((i * 90 + (phase === 'race' ? dist * 1.4 : 0)) % 540) / 540; const y = H - z * (H * 0.62); const w = 4 + z * 26; ctx.fillRect(W / 2 - w / 2, y, w, 26 - z * 20); }
      ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(W / 2 - 95, H - 105, 190, 60, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7f1d1d'; ctx.fillRect(W / 2 - 60, H - 128, 120, 40);
      ctx.fillStyle = '#111827'; ctx.fillRect(30, 24, W - 60, 26);
      ctx.fillStyle = '#166534'; ctx.fillRect(30 + (W - 60) * 0.62, 24, (W - 60) * 0.30, 26);
      ctx.fillStyle = rpm > 0.95 ? '#ef4444' : '#facc15';
      ctx.fillRect(30, 24, (W - 60) * clamp(rpm, 0, 1), 26);
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.strokeRect(30, 24, W - 60, 26);
      ctx.fillStyle = '#f8fafc'; ctx.font = '700 12px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText('RPM', W / 2, 41);
      if (phase === 'countdown' || msg === 'GO!') {
        ctx.fillStyle = msg === 'GO!' ? '#4ade80' : '#f8fafc';
        ctx.font = '900 88px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText(msg || '3', W / 2, H * 0.42);
      } else if (boostMsg > 0) {
        ctx.fillStyle = '#4ade80'; ctx.font = '900 40px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText('BOOST!', W / 2, H * 0.35);
      }
      ctx.fillStyle = '#f8fafc'; ctx.font = '700 15px Trebuchet MS'; ctx.textAlign = 'left'; ctx.fillText('Gigi ' + gear + '/5', 34, H - 12);
    });
    timeEl.textContent = '0.0s'; distEl.textContent = '0m'; gearEl.textContent = '1';
  }
});

/* ============ PARKING MOBIL 3D ============ */
BG.register({
  id: 'parking3d', name: 'Parking Mobil 3D', desc: 'Parkir mobil ke slot glowing. 3 level makin sempit!', cat: '3d', icon: 'parking3d', tags: 'parkir parking mobil 3d slot',
  start(el, s) {
    const W = 600, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Level', 'pk-level') + BG.hudPill('Waktu', 'pk-time') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="racer-controls" style="max-width:480px">' +
        '<button class="rc-btn" data-k="left" aria-label="Belok kiri">◀</button>' +
        '<button class="rc-btn rc-jump" data-k="up" style="flex:1">LAJU</button>' +
        '<button class="rc-btn" data-k="right" aria-label="Belok kanan">▶</button>' +
      '</div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const levelEl = el.querySelector('#pk-level'), timeEl = el.querySelector('#pk-time');
    let level = 1, timeLeft = 60, over = false, parkHold = 0, totalTime = 0;
    const car = { x: 90, y: H - 70, angle: 0, speed: 0 };
    const bays = [];
    const cones = [];
    function setupLevel() {
      bays.length = 0; cones.length = 0;
      const bw = Math.max(78, 150 - level * 32);
      const slotCount = 3;
      const chosen = BG.rand(0, slotCount - 1);
      for (let i = 0; i < slotCount; i++) {
        bays.push({ x: 330 + i * 90, y: 44, w: bw, h: 74, target: i === chosen });
        cones.push({ x: 330 + i * 90 - 14, y: 44 }, { x: 330 + i * 90 + bw + 14, y: 44 });
      }
      car.x = 90; car.y = H - 70; car.angle = 0; car.speed = 0; parkHold = 0;
    }
    setupLevel();
    s.interval(() => { if (!over) { timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) finish(false); } }, 1000);
    const keys = {};
    el.querySelectorAll('[data-k]').forEach(btn => {
      s.on(btn, 'pointerdown', e => { e.preventDefault(); keys[btn.dataset.k] = true; });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => s.on(btn, ev, () => { keys[btn.dataset.k] = false; }));
    });
    s.on(window, 'keydown', e => { const k = e.key.toLowerCase(); if (k === 'arrowup' || k === 'w') keys.up = true; if (k === 'arrowleft' || k === 'a') keys.left = true; if (k === 'arrowright' || k === 'd') keys.right = true; if (k === 'arrowdown' || k === 's') keys.back = true; });
    s.on(window, 'keyup', e => { const k = e.key.toLowerCase(); if (k === 'arrowup' || k === 'w') keys.up = false; if (k === 'arrowleft' || k === 'a') keys.left = false; if (k === 'arrowright' || k === 'd') keys.right = false; if (k === 'arrowdown' || k === 's') keys.back = false; });

    s.raf(() => {
      if (!over) {
        const accel = keys.up ? 0.075 : 0;
        car.speed = car.speed * 0.97 + accel - (keys.back ? 0.06 : 0);
        car.speed = Math.max(-0.03, Math.min(0.055, car.speed));
        if (keys.left) car.angle -= 0.032 + Math.abs(car.speed) * 0.22;
        if (keys.right) car.angle += 0.032 + Math.abs(car.speed) * 0.22;
        const nx = car.x + Math.sin(car.angle) * car.speed * 60;
        const ny = car.y - Math.cos(car.angle) * car.speed * 60;
        /* tabrak cone */
        let hit = false;
        for (const cone of cones) if (Math.hypot(nx - cone.x, ny - cone.y) < 17) { hit = true; break; }
        if (!hit) { car.x = nx; car.y = ny; } else { car.speed *= -0.4; BG.sfx('bad'); }
        car.y = clampY(car.y, 24, H - 24); car.x = clampX(car.x, 24, W - 24);
        /* cek parkir */
        const bay = bays.find(b => b.target);
        const inBay = Math.abs(car.x - (bay.x + bay.w / 2)) < bay.w / 2 - 6 && car.y > bay.y && car.y < bay.y + bay.h;
        parkHold = inBay && Math.abs(car.speed) < 0.008 ? parkHold + 1 : 0;
        if (parkHold > 70) {
          level++;
          BG.sfx('win');
          if (level > 3) { finish(true); } else { setupLevel(); levelEl.textContent = level; timeLeft = Math.max(35, timeLeft); }
        }
      }
      /* gambar */
      ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, W, H);
      /* garis parkir */
      bays.forEach(b => {
        ctx.fillStyle = b.target ? 'rgba(74,222,128,.28)' : '#1e293b';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = b.target ? '#4ade80' : '#64748b'; ctx.lineWidth = b.target ? 3 : 2;
        ctx.setLineDash(b.target ? [8, 6] : []);
        ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.setLineDash([]);
        if (b.target) { ctx.fillStyle = '#4ade80'; ctx.font = '900 30px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText('P', b.x + b.w / 2, b.y + b.h / 2 + 10); }
      });
      /* cone */
      cones.forEach(c => {
        ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c.x, c.y - 13); ctx.lineTo(c.x - 9, c.y + 9); ctx.lineTo(c.x + 9, c.y + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(c.x - 6, c.y + 1, 12, 4);
      });
      /* mobil */
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
      ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-16, -28, 32, 56, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-11, -18, 22, 12);
      ctx.fillStyle = '#111827'; ctx.fillRect(-18, -22, 5, 12); ctx.fillRect(13, -22, 5, 12); ctx.fillRect(-18, 10, 5, 12); ctx.fillRect(13, 10, 5, 12);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(-10, -27, 6, 3); ctx.fillRect(4, -27, 6, 3);
      ctx.restore();
      if (parkHold > 0) { ctx.fillStyle = '#4ade80'; ctx.font = '900 17px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText('Diam... ' + Math.ceil((70 - parkHold) / 60 * 100) + '%', W / 2, H - 12); }
    });
    function clampX(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function clampY(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function finish(win) {
      if (over) return; over = true;
      BG.endScreen(canvas.parentElement, { score: win ? 900 : 0, bestKey: 'parking3d', win, title: win ? 'PARKIR SEMPURNA!' : 'Waktu Habis!', sub: win ? 'Tiga slot berhasil takluk.' : 'Coba lagi, pelan-pelan saja.', scoreLabel: win ? '3 Level!' : 'Gagal', onRetry: retry3d(el, s, 'parking3d') });
    }
    levelEl.textContent = level; timeEl.textContent = timeLeft + 's';
  }
});

/* ============ LABYRINTH 3D (raycasting) ============ */
BG.register({
  id: 'labyrinth3d', name: 'Labyrinth 3D', desc: 'Kabur dari labirin 3D! Temukan jalan keluar.', cat: '3d', icon: 'labyrinth3d', tags: 'labyrinth labirin 3d raycast escape',
  start(el, s) {
    const W = 560, H = 340, MW = 13, MH = 13;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Waktu', 'lb-time') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="racer-controls" style="max-width:480px">' +
        '<button class="rc-btn" data-k="left" aria-label="Putar kiri">◀</button>' +
        '<button class="rc-btn rc-jump" data-k="up" style="flex:1.2">MAJU</button>' +
        '<button class="rc-btn" data-k="back" aria-label="Mundur">▼</button>' +
        '<button class="rc-btn" data-k="right" aria-label="Putar kanan">▶</button>' +
      '</div></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const timeEl = el.querySelector('#lb-time');
    /* generate maze (recursive backtracker) */
    const map = Array.from({ length: MH }, () => Array(MW).fill(1));
    (function gen() {
      const stack = [[1, 1]]; map[1][1] = 0;
      while (stack.length) {
        const [r, c] = stack[stack.length - 1];
        const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]];
        const opts = dirs.filter(([dr, dc]) => { const rr = r + dr, cc = c + dc; return rr > 0 && rr < MH - 1 && cc > 0 && cc < MW - 1 && map[rr][cc] === 1; });
        if (!opts.length) { stack.pop(); continue; }
        const [dr, dc] = BG.pick(opts);
        map[r + dr / 2][c + dc / 2] = 0; map[r + dr][c + dc] = 0;
        stack.push([r + dr, c + dc]);
      }
    })();
    const goal = { x: MW - 2, y: MH - 2 };
    const player = { x: 1.5, y: 1.5, dir: 0 };
    const keys = {};
    el.querySelectorAll('[data-k]').forEach(btn => {
      s.on(btn, 'pointerdown', e => { e.preventDefault(); keys[btn.dataset.k] = true; });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => s.on(btn, ev, () => { keys[btn.dataset.k] = false; }));
    });
    s.on(window, 'keydown', e => { const k = e.key.toLowerCase(); if (k === 'arrowup' || k === 'w') keys.up = true; if (k === 'arrowdown' || k === 's') keys.back = true; if (k === 'arrowleft' || k === 'a') keys.left = true; if (k === 'arrowright' || k === 'd') keys.right = true; });
    s.on(window, 'keyup', e => { const k = e.key.toLowerCase(); if (k === 'arrowup' || k === 'w') keys.up = false; if (k === 'arrowdown' || k === 's') keys.back = false; if (k === 'arrowleft' || k === 'a') keys.left = false; if (k === 'arrowright' || k === 'd') keys.right = false; });
    let time = 0, over = false;
    s.interval(() => { if (!over) { time++; timeEl.textContent = time + 's'; } }, 1000);

    function solid(x, y) { const mx = Math.floor(x), my = Math.floor(y); return mx < 0 || my < 0 || mx >= MW || my >= MH || map[my][mx] === 1; }

    s.raf(() => {
      if (!over) {
        if (keys.left) player.dir -= 0.038;
        if (keys.right) player.dir += 0.038;
        const spd = 0.045;
        let nx = player.x, ny = player.y;
        if (keys.up) { nx += Math.cos(player.dir) * spd; ny += Math.sin(player.dir) * spd; }
        if (keys.back) { nx -= Math.cos(player.dir) * spd * 0.7; ny -= Math.sin(player.dir) * spd * 0.7; }
        if (!solid(nx, player.y)) player.x = nx;
        if (!solid(player.x, ny)) player.y = ny;
        if (Math.floor(player.x) === goal.x && Math.floor(player.y) === goal.y) {
          over = true; BG.sfx('win');
          BG.endScreen(canvas.parentElement, { score: Math.max(10, 1200 - time * 8), bestKey: 'labyrinth3d', title: 'KABUR!', sub: 'Labirin takluk dalam ' + time + ' detik.', scoreLabel: time + 's', onRetry: retry3d(el, s, 'labyrinth3d') });
        }
      }
      /* raycast render */
      const FOV = Math.PI / 3, RAYS = 150, HALF = H * 0.5;
      ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, W, HALF);           /* langit */
      ctx.fillStyle = '#27272a'; ctx.fillRect(0, HALF, W, HALF);       /* lantai */
      for (let i = 0; i < RAYS; i++) {
        const rayAngle = player.dir - FOV / 2 + (i / RAYS) * FOV;
        const stepX = Math.cos(rayAngle) * 0.04, stepY = Math.sin(rayAngle) * 0.04;
        let rx = player.x, ry = player.y, dist = 0;
        while (dist < 14) { rx += stepX; ry += stepY; dist += 0.04; if (solid(rx, ry)) break; }
        const corrected = dist * Math.cos(rayAngle - player.dir);
        const wallH = Math.min(H * 2.4, H / Math.max(0.02, corrected * 0.72));
        const shade = Math.max(0.16, 1 - corrected / 11);
        const hitVertical = Math.abs(Math.sin(rayAngle)) < Math.abs(Math.cos(rayAngle));
        const base = hitVertical ? [168, 85, 247] : [126, 34, 206];
        ctx.fillStyle = 'rgb(' + base.map(c => Math.round(c * shade)).join(',') + ')';
        const sliceW = W / RAYS + 1;
        ctx.fillRect(i * (W / RAYS), HALF - wallH / 2, sliceW, wallH);
      }
      /* pintu keluar (portal hijau) */
      const gx = goal.x + 0.5, gy = goal.y + 0.5;
      const dx = gx - player.x, dy = gy - player.y;
      const angleToGoal = Math.atan2(dy, dx);
      let rel = angleToGoal - player.dir;
      while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) < FOV / 2) {
        const dist = Math.hypot(dx, dy);
        const size = Math.max(6, (H / dist) * 0.8);
        const sx = W / 2 + (rel / (FOV / 2)) * (W / 2);
        const grad = ctx.createRadialGradient(sx, HALF, 2, sx, HALF, size);
        grad.addColorStop(0, '#4ade80'); grad.addColorStop(1, 'rgba(74,222,128,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(sx, HALF, size, 0, Math.PI * 2); ctx.fill();
      }
      /* vignette obor */
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      timeEl.textContent = time + 's';
    });
    timeEl.textContent = '0s';
  }
});

/* ============ TARGET 3D ============ */
BG.register({
  id: 'target3d', name: 'Target 3D', desc: 'Tembak target dari jauh! Makin jauh makin mahal.', cat: '3d', icon: 'target3d', tags: 'target tembak shooting 3d gallery',
  start(el, s) {
    const W = 560, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'tg-score') + BG.hudPill('Waktu', 'tg-time') + BG.hudPill('Combo', 'tg-combo') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '" style="cursor:crosshair"></canvas></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#tg-score'), timeEl = el.querySelector('#tg-time'), comboEl = el.querySelector('#tg-combo');
    let score = 0, timeLeft = 30, combo = 0, over = false, frame = 0;
    const targets = [];
    const horizon = H * 0.34;

    function spawnTarget() {
      const lane = BG.rand(-12, 12) / 10;             /* -1.2 .. 1.2 */
      const depth = BG.rand(28, 75) / 10;             /* 2.8 .. 7.5 meter */
      const gold = Math.random() < 0.12;
      targets.push({ lane, depth, gold, wobble: Math.random() * 6.28 });
    }
    function project(t) {
      const scale = 1.6 / t.depth;
      const x = W / 2 + t.lane * scale * W * 0.42;
      const poleH = 70 * scale * 4.6;
      const y = H * 0.92 - poleH;
      const r = Math.max(7, 62 * scale * 2.4);
      return { x, y, r, h: poleH };
    }
    s.interval(() => { if (over) return; timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) { over = true; BG.endScreen(canvas.parentElement, { score, bestKey: 'target3d', title: 'Waktu Habis!', sub: 'Combo terbaik: ' + combo + '. Skor: ' + score, onRetry: retry3d(el, s, 'target3d') }); } }, 1000);

    s.on(canvas, 'pointerdown', e => {
      if (over) return;
      const p = BG.canvasPos(canvas, e);
      let hit = null, hitIdx = -1;
      for (let i = targets.length - 1; i >= 0; i--) {
        const pr = project(targets[i]);
        if (Math.hypot(p.x - pr.x, p.y - pr.y) < pr.r + 4) { hit = targets[i]; hitIdx = i; break; }
      }
      if (hit) {
        combo++;
        const distBonus = Math.round(hit.depth * 10) * (hit.gold ? 5 : 1) + 10;
        score += distBonus + combo * 5;
        targets.splice(hitIdx, 1);
        scoreEl.textContent = score; comboEl.textContent = 'x' + combo;
        BG.sfx(hit.gold ? 'coin' : 'pop');
      } else {
        combo = 0; comboEl.textContent = 'x0'; BG.sfx('click');
      }
    });

    s.raf(() => {
      if (over) return;
      frame++;
      if (targets.length < 4 && frame % 34 === 0) spawnTarget();
      /* latar */
      const g = ctx.createLinearGradient(0, 0, 0, horizon);
      g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#334155');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon);
      const g2 = ctx.createLinearGradient(0, horizon, 0, H);
      g2.addColorStop(0, '#3f3f46'); g2.addColorStop(1, '#18181b');
      ctx.fillStyle = g2; ctx.fillRect(0, horizon, W, H - horizon);
      /* bintang */
      ctx.fillStyle = '#f8fafc';
      [[40, 30], [120, 60], [200, 24], [330, 48], [430, 30], [520, 66]].forEach(([x, y]) => { ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      /* bulan */
      ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(W - 70, 44, 22, 0, Math.PI * 2); ctx.fill();
      /* target jauh ke dekat */
      targets.sort((a, b) => b.depth - a.depth);
      targets.forEach(t => {
        const pr = project(t);
        /* tiang */
        ctx.fillStyle = '#57534e'; ctx.fillRect(pr.x - pr.r * 0.22, pr.y, pr.r * 0.44, pr.h);
        /* papan */
        const rings = [[1, '#f8fafc'], [0.75, '#ef4444'], [0.5, '#f8fafc'], [0.28, t.gold ? '#fbbf24' : '#ef4444']];
        rings.forEach(([frac, color]) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * frac, 0, Math.PI * 2); ctx.fill(); });
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.stroke();
      });
      timeEl.textContent = timeLeft + 's';
    });
    spawnTarget(); spawnTarget(); spawnTarget();
    timeEl.textContent = timeLeft + 's'; comboEl.textContent = 'x0';
  }
});

/* ============ MINI GOLF 3D ============ */
BG.register({
  id: 'golf3d', name: 'Mini Golf 3D', desc: 'Pukul bola ke lubang! 3 hole makin susah.', cat: '3d', icon: 'golf3d', tags: 'golf mini golf 3d putt',
  start(el, s) {
    const W = 560, H = 340;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Hole', 'gf-hole') + BG.hudPill('Pukulan', 'gf-strokes') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p id="gf-msg" style="text-align:center;font-weight:800;color:#ffd23f;min-height:1.3em">Ketuk untuk atur sudut... lalu atur tenaga!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const holeEl = el.querySelector('#gf-hole'), strokesEl = el.querySelector('#gf-strokes'), msgEl = el.querySelector('#gf-msg');
    const HOLES = [
      { walls: [], cupX: W - 70, wind: 0 },
      { walls: [{ x: W * 0.45, y: H - 90, w: 14, h: 92 }], cupX: W - 70, wind: 0 },
      { walls: [{ x: W * 0.32, y: 0, w: 14, h: H - 110 }, { x: W * 0.62, y: H - 130, w: 14, h: 130 }], cupX: W - 62, wind: 0 },
    ];
    let hole = 0, strokes = 0, phase = 'aim', ball = null, aim = 0.6, power = 0, dir = 1, over = false, totalStrokes = 0;

    function launchBall() {
      const holeDef = HOLES[hole];
      const angle = aim;               /* radian ke atas */
      const v = 4.2 + power * 8.5;     /* px/frame */
      ball = { x: 60, y: H - 34, vx: Math.cos(angle) * v, vy: -Math.sin(angle) * v, resting: false };
      strokes++; totalStrokes++; strokesEl.textContent = totalStrokes;
      phase = 'fly'; msgEl.textContent = '';
      BG.sfx('shoot');
    }
    canvas.addEventListener('pointerdown', () => {
      if (over) return;
      if (phase === 'aim') { phase = 'power'; return; }
      if (phase === 'power') { launchBall(); return; }
    });
    function resetHole() { ball = null; phase = 'aim'; aim = 0.6; power = 0; dir = 1; msgEl.textContent = 'Ketuk untuk atur sudut... lalu atur tenaga!'; }
    function nextHole() {
      hole++;
      if (hole >= HOLES.length) {
        over = true;
        BG.endScreen(canvas.parentElement, { score: Math.max(10, 3000 - totalStrokes * 150), bestKey: 'golf3d', title: 'Master Golf!', sub: 'Selesai 3 hole dengan ' + totalStrokes + ' pukulan.', scoreLabel: totalStrokes + ' pukulan', onRetry: retry3d(el, s, 'golf3d') });
        return;
      }
      holeEl.textContent = (hole + 1) + '/3'; resetHole();
    }
    s.raf(() => {
      const holeDef = HOLES[hole];
      const groundY = H - 34;
      /* fase */
      if (phase === 'aim') { aim += dir * 0.012; if (aim > 1.25 || aim < 0.12) dir *= -1; }
      if (phase === 'power') { power += dir * 0.016; if (power > 1 || power < 0) dir *= -1; }
      /* fisika bola */
      if (ball) {
        ball.vy += 0.155;
        ball.x += ball.vx; ball.y += ball.vy;
        /* dinding */
        for (const wDef of holeDef.walls) {
          if (ball.x + 6 > wDef.x && ball.x - 6 < wDef.x + wDef.w && ball.y + 6 > wDef.y && ball.y - 6 < wDef.y + wDef.h) {
            if (ball.vx > 0 && ball.x < wDef.x) ball.x = wDef.x - 6; else if (ball.vx < 0 && ball.x > wDef.x) ball.x = wDef.x + wDef.w + 6;
            ball.vx *= -0.62; BG.sfx('hit');
          }
        }
        /* tanah */
        if (ball.y > groundY - 7) {
          ball.y = groundY - 7;
          if (Math.abs(ball.vy) > 1.2) { ball.vy *= -0.55; ball.vx *= 0.82; BG.sfx('hit'); }
          else { ball.vy = 0; ball.vx *= 0.93; }
        }
        if (ball.x < 8) { ball.x = 8; ball.vx *= -0.5; }
        if (ball.x > W - 8) { ball.x = W - 8; ball.vx *= -0.5; }
        /* masuk lubang? */
        const cupDist = Math.abs(ball.x - holeDef.cupX);
        if (ball.y >= groundY - 9 && cupDist < 13 && Math.abs(ball.vx) < 3.4) {
          BG.sfx('win'); msgEl.textContent = hole < HOLES.length - 1 ? 'HOLE IN! Lanjut...' : 'HOLE IN!'; 
          const doneHole = hole;
          s.timeout(() => { if (!over) nextHole(); }, 900);
          ball = null; phase = 'fly';
          if (doneHole === HOLES.length - 1) { /* handled by nextHole via hole++ */ }
          return;
        }
        if (Math.abs(ball.vx) < 0.08 && ball.y >= groundY - 9) { ball = null; if (!over) { phase = 'aim'; msgEl.textContent = 'Ketuk untuk atur sudut... lalu atur tenaga!'; } }
      }
      /* gambar */
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1d4ed8'); g.addColorStop(0.55, '#7dd3fc'); g.addColorStop(0.62, '#166534'); g.addColorStop(1, '#14532d');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      /* bukit jauh */
      ctx.fillStyle = '#15803d';
      ctx.beginPath(); ctx.moveTo(0, H * 0.6); ctx.lineTo(W * 0.2, H * 0.42); ctx.lineTo(W * 0.4, H * 0.6); ctx.lineTo(W * 0.6, H * 0.46); ctx.lineTo(W * 0.85, H * 0.6); ctx.lineTo(W, H * 0.44); ctx.lineTo(W, H * 0.62); ctx.lineTo(0, H * 0.62); ctx.closePath(); ctx.fill();
      /* tanah fairway */
      ctx.fillStyle = '#22c55e'; roundRect2(ctx, 0, H - 36, W, 36, 0); ctx.fill();
      /* dinding hole */
      holeDef.walls.forEach(wDef => { ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3; ctx.fillRect(wDef.x, wDef.y, wDef.w, wDef.h); ctx.strokeRect(wDef.x, wDef.y, wDef.w, wDef.h); });
      /* lubang */
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.ellipse(holeDef.cupX, H - 32, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.stroke();
      /* bendera */
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(holeDef.cupX, H - 32); ctx.lineTo(holeDef.cupX, H - 108); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(holeDef.cupX, H - 108); ctx.lineTo(holeDef.cupX + 26, H - 100); ctx.lineTo(holeDef.cupX, H - 92); ctx.closePath(); ctx.fill();
      /* bola */
      if (ball) { ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      else { ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(60, H - 41, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      /* bidikan */
      if (phase === 'aim' || phase === 'power') {
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(60, H - 41);
        const len = phase === 'power' ? 40 + power * 80 : 75;
        ctx.lineTo(60 + Math.cos(aim) * len, H - 41 - Math.sin(aim) * len); ctx.stroke(); ctx.setLineDash([]);
      }
      /* power meter */
      if (phase === 'power') {
        ctx.fillStyle = '#111827'; ctx.fillRect(W / 2 - 110, 14, 220, 18);
        ctx.fillStyle = power > 0.75 ? '#ef4444' : '#4ade80'; ctx.fillRect(W / 2 - 110, 14, 220 * power, 18);
        ctx.strokeStyle = '#f8fafc'; ctx.strokeRect(W / 2 - 110, 14, 220, 18);
      }
      if (phase === 'aim' && hole === 0 && totalStrokes === 0) { /* tutorial cukup lewat msg */ }
    });
    function roundRect2(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
    holeEl.textContent = '1/3'; strokesEl.textContent = 0;
  }
});

/* ============ CARI BARANG 3D ============ */
BG.register({
  id: 'cari3d', name: 'Cari Barang 3D', desc: 'Barang apa yang hilang di kamar 3D? Temukan!', cat: '3d', icon: 'cari3d', tags: 'cari barang hidden object 3d kamar',
  start(el, s) {
    const W = 560, H = 340;
    const ITEMS = [
      { name: 'Kunci', draw: (ctx, x, y, sc) => { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 5 * sc; ctx.beginPath(); ctx.arc(x, y, 9 * sc, 0, Math.PI * 2); ctx.moveTo(x + 8 * sc, y); ctx.lineTo(x + 26 * sc, y); ctx.moveTo(x + 19 * sc, y); ctx.lineTo(x + 19 * sc, y + 8 * sc); ctx.moveTo(x + 25 * sc, y); ctx.lineTo(x + 25 * sc, y + 7 * sc); ctx.stroke(); } },
      { name: 'Buku', draw: (ctx, x, y, sc) => { ctx.fillStyle = '#3b82f6'; ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 2 * sc; ctx.fillRect(x - 13 * sc, y - 17 * sc, 26 * sc, 34 * sc); ctx.strokeRect(x - 13 * sc, y - 17 * sc, 26 * sc, 34 * sc); ctx.beginPath(); ctx.moveTo(x, y - 17 * sc); ctx.lineTo(x, y + 17 * sc); ctx.stroke(); } },
      { name: 'Apel', draw: (ctx, x, y, sc) => { ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5 * sc; ctx.beginPath(); ctx.arc(x, y, 12 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#166534'; ctx.beginPath(); ctx.moveTo(x, y - 12 * sc); ctx.quadraticCurveTo(x + 3 * sc, y - 19 * sc, x + 9 * sc, y - 21 * sc); ctx.stroke(); } },
      { name: 'Dompet', draw: (ctx, x, y, sc) => { ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3 * sc; ctx.beginPath(); ctx.roundRect(x - 15 * sc, y - 9 * sc, 30 * sc, 20 * sc, 4 * sc); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x + 6 * sc, y + 1 * sc, 3.4 * sc, 0, Math.PI * 2); ctx.fill(); } },
      { name: 'Jam', draw: (ctx, x, y, sc) => { ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3 * sc; ctx.beginPath(); ctx.arc(x, y, 13 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 8 * sc); ctx.moveTo(x, y); ctx.lineTo(x + 6 * sc, y + 2 * sc); ctx.stroke(); } },
      { name: 'Boneka', draw: (ctx, x, y, sc) => { ctx.fillStyle = '#f472b6'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5 * sc; ctx.beginPath(); ctx.arc(x, y - 10 * sc, 8 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y + 8 * sc, 11 * sc, 9 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } },
      { name: 'Vas', draw: (ctx, x, y, sc) => { ctx.fillStyle = '#4ecdc4'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5 * sc; ctx.beginPath(); ctx.moveTo(x - 8 * sc, y - 16 * sc); ctx.lineTo(x + 8 * sc, y - 16 * sc); ctx.quadraticCurveTo(x + 14 * sc, y, x + 10 * sc, y + 15 * sc); ctx.lineTo(x - 10 * sc, y + 15 * sc); ctx.quadraticCurveTo(x - 14 * sc, y, x - 8 * sc, y - 16 * sc); ctx.fill(); ctx.stroke(); } },
      { name: 'Lampu', draw: (ctx, x, y, sc) => { ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5 * sc; ctx.beginPath(); ctx.moveTo(x - 11 * sc, y + 2 * sc); ctx.lineTo(x + 11 * sc, y + 2 * sc); ctx.lineTo(x + 7 * sc, y - 12 * sc); ctx.lineTo(x - 7 * sc, y - 12 * sc); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#241239'; ctx.fillRect(x - 2.5 * sc, y + 2 * sc, 5 * sc, 12 * sc); ctx.beginPath(); ctx.arc(x, y + 17 * sc, 4 * sc, 0, Math.PI * 2); ctx.fill(); } },
    ];
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Dicari', 'cb-left') + BG.hudPill('Waktu', 'cb-time') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p id="cb-task" style="text-align:center;font-weight:800;color:#fde047;font-size:.95rem;min-height:1.4em"></p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const leftEl = el.querySelector('#cb-left'), timeEl = el.querySelector('#cb-time'), taskEl = el.querySelector('#cb-task');
    let timeLeft = 60, over = false, round = 1;
    const MAX_ROUNDS = 3;
    let targets = [], placed = [];

    function setupRound() {
      targets = BG.shuffle(ITEMS).slice(0, 9).map((it, i) => ({ item: it, x: 70 + (i % 3) * 170 + BG.rand(-26, 26), y: 78 + Math.floor(i / 3) * 82 + BG.rand(-14, 14), scale: BG.rand(78, 118) / 100 }));
      /* pilih 4 untuk dicari */
      const chosen = BG.shuffle(targets).slice(0, 4);
      placed = chosen.map(t => t.item.name);
      targets.forEach(t => { t.found = false; });
      updateTask();
    }
    function updateTask() {
      const left = targets.filter(t => !t.found && placed.includes(t.item.name));
      leftEl.textContent = left.map(t => t.item.name).join(', ') || 'Semua ketemu!';
      taskEl.textContent = 'Cari: ' + (left.map(t => t.item.name).join(' • ') || '—');
    }
    setupRound();
    s.interval(() => {
      if (over) return;
      timeLeft--; timeEl.textContent = timeLeft + 's';
      if (timeLeft <= 0) {
        over = true;
        BG.endScreen(canvas.parentElement, { score: (round - 1) * 300, bestKey: 'cari3d', win: false, title: 'Waktu Habis!', sub: 'Round ' + round + ' dari ' + MAX_ROUNDS + ' tidak selesai.', scoreLabel: 'Round ' + round, onRetry: retry3d(el, s, 'cari3d') });
      }
    }, 1000);
    s.on(canvas, 'pointerdown', e => {
      if (over) return;
      const p = BG.canvasPos(canvas, e);
      for (const t of targets) {
        if (t.found) continue;
        const dx = p.x - t.x, dy = p.y - t.y;
        if (Math.abs(dx) < 26 * t.scale && Math.abs(dy) < 24 * t.scale) {
          t.found = true; BG.sfx(t.item ? 'coin' : 'pop');
          const left = targets.filter(x => !x.found && placed.includes(x.item.name));
          if (!left.length) {
            round++;
            BG.sfx('win');
            if (round > MAX_ROUNDS) {
              over = true;
              BG.endScreen(canvas.parentElement, { score: 1000, bestKey: 'cari3d', title: 'Detektif Jago!', sub: 'Semua barang ketemu!', scoreLabel: 'Sempurna!', onRetry: retry3d(el, s, 'cari3d') });
            } else setupRound();
          } else updateTask();
          return;
        }
      }
      BG.sfx('click');
    });
    s.raf(() => {
      /* ruangan: dinding belakang, lantai, dinding samping */
      ctx.fillStyle = '#3f2d4e'; ctx.fillRect(0, 0, W, H);
      /* lantai */
      ctx.fillStyle = '#574a63';
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W * 0.13, H * 0.42); ctx.lineTo(W * 0.87, H * 0.42); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      /* dinding kiri */
      ctx.fillStyle = '#4b3a56';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.13, H * 0.42); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      /* dinding kanan */
      ctx.fillStyle = '#33243f';
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W * 0.87, H * 0.42); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      /* jendela dengan bulan */
      ctx.fillStyle = '#1e1b4b'; ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(W * 0.38, H * 0.08, W * 0.24, H * 0.2, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(W * 0.5, H * 0.17, 12, 0, Math.PI * 2); ctx.fill();
      /* rak */
      ctx.fillStyle = '#5b4632'; ctx.fillRect(30, H * 0.36, 130, 10); ctx.fillRect(W - 160, H * 0.5, 130, 10);
      /* objek */
      targets.forEach(t => {
        if (t.found) { ctx.globalAlpha = 0.22; }
        t.item.draw(ctx, t.x, t.y, t.scale);
        ctx.globalAlpha = 1;
        if (t.found) {
          ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.moveTo(t.x - 14, t.y); ctx.lineTo(t.x - 4, t.y + 12); ctx.lineTo(t.x + 16, t.y - 14); ctx.stroke();
        }
      });
      timeEl.textContent = timeLeft + 's';
    });
    timeEl.textContent = timeLeft + 's';
  }
});

/* ============ STACK 3D ============ */
BG.register({
  id: 'stack3d', name: 'Stack 3D', desc: 'Susun balok 3D setinggi mungkin di atas awan!', cat: '3d', icon: 'stack3d', tags: 'stack 3d susun balok tower',
  start(el, s) {
    const W = 420, H = 420;
    const COLORS = ['#22d3ee', '#f472b6', '#a3e635', '#facc15', '#a78bfa', '#fb923c'];
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Tinggi', 's3-score') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p style="text-align:center;font-size:.78rem;color:#b8a6d9">Ketuk layar untuk menjatuhkan balok</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#s3-score');
    let blocks = [{ x: W / 2 - 70, y: H - 56, w: 140, h: 24, color: COLORS[0] }];
    let current = null, dir = 1, speed = 2.4, score = 0, camera = 0, over = false;
    function newBlock() {
      const prev = blocks[blocks.length - 1];
      current = { x: dir > 0 ? -prev.w : W, y: prev.y - 25, w: prev.w, h: 24, color: COLORS[blocks.length % COLORS.length] };
    }
    newBlock();
    function drop() {
      if (over || !current) return;
      const prev = blocks[blocks.length - 1];
      const left = Math.max(current.x, prev.x), right = Math.min(current.x + current.w, prev.x + prev.w);
      if (right - left <= 4) {
        over = true; BG.sfx('bad');
        BG.endScreen(canvas.parentElement, { score, bestKey: 'stack3d', title: 'Roboh!', sub: 'Menara 3D setinggi ' + score + ' balok.', scoreLabel: score, onRetry: retry3d(el, s, 'stack3d') });
        return;
      }
      current.x = left; current.w = right - left;
      blocks.push(current); score++; scoreEl.textContent = score; BG.sfx('hit');
      current = null;
      if (score % 4 === 0) speed += 0.5;
      const topY = blocks[blocks.length - 1].y;
      if (topY < H * 0.45) camera = H * 0.45 - topY; else camera = 0;
      newBlock();
    }
    s.on(canvas, 'pointerdown', drop);
    s.on(window, 'keydown', e => { if (e.code === 'Space') { e.preventDefault(); drop(); } });
    s.raf(() => {
      if (current && !over) {
        current.x += dir * speed;
        if (current.x + current.w > W && dir > 0) dir = -1;
        if (current.x < 0 && dir < 0) dir = 1;
      }
      /* langit awan */
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#312e81'); g.addColorStop(1, '#7c3aed');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      [[40, 90], [180, 150], [330, 60], [120, 230], [380, 200]].forEach(([x, y], i) => { ctx.beginPath(); ctx.ellipse(x, y + (camera * 0.3 % 40), 40 + i * 6, 13, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.save(); ctx.translate(0, camera);
      const drawBlock3D = b => {
        const depth = 14;
        /* sisi atas */
        ctx.fillStyle = shade(b.color, 40); ctx.beginPath();
        ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + depth, b.y - depth); ctx.lineTo(b.x + b.w + depth, b.y - depth); ctx.lineTo(b.x + b.w, b.y); ctx.closePath(); ctx.fill();
        /* sisi kanan */
        ctx.fillStyle = shade(b.color, -45); ctx.beginPath();
        ctx.moveTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w + depth, b.y - depth); ctx.lineTo(b.x + b.w + depth, b.y + b.h - depth); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.closePath(); ctx.fill();
        /* muka depan */
        ctx.fillStyle = b.color; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5;
        ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h);
      };
      blocks.forEach(drawBlock3D);
      if (current) drawBlock3D(current);
      ctx.restore();
    });
    function shade(hex, amt) {
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
      r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    scoreEl.textContent = 0;
  }
});

/* ============ BOWLING 3D ============ */
BG.register({
  id: 'bowling3d', name: 'Bowling 3D', desc: 'Runtuhkan 10 pin! Bowling 3D sungguhan.', cat: '3d', icon: 'bowling3d', tags: 'bowling 3d pin boling',
  start(el, s) {
    const W = 480, H = 400, PIN_ROWS = [[4], [3], [2], [1]];
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Frame', 'bw-frame') + BG.hudPill('Poin', 'bw-score') + BG.hudPill('Pin', 'bw-pins') + '</div>' +
      '<canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p id="bw-msg" style="text-align:center;font-weight:800;color:#ffd23f;min-height:1.3em">Ketuk untuk mengunci bidikan... lalu kekuatan!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const frameEl = el.querySelector('#bw-frame'), scoreEl = el.querySelector('#bw-score'), pinsEl = el.querySelector('#bw-pins'), msgEl = el.querySelector('#bw-msg');
    const TOTAL_FRAMES = 3;
    let frame = 1, throwInFrame = 0, totalScore = 0, pins = [], aim = 0, aimDir = 1, power = 0, powerDir = 1, phase = 'aim', ball = null, fallenPins = 0, over = false;

    function resetPins() {
      pins = [];
      const baseY = H * 0.30, spread = 30;
      PIN_ROWS.forEach((row, ri) => {
        row.forEach((_, pi) => {
          const offset = (pi - (row.length - 1) / 2) * spread;
          pins.push({ x: W / 2 + offset, y: baseY + ri * 34, fallen: false, fallAnim: 0 });
        });
      });
      pinsEl.textContent = '10';
    }
    resetPins();

    function roll() {
      const startY = H - 36;
      const spreadAim = aim * 1.05;   /* -1 .. 1 → -1.05..1.05 */
      ball = { x: W / 2 + spreadAim * 70, y: startY, r: 15, vy: -(5 + power * 6.5), vx: aim * 1.6 };
      phase = 'roll'; msgEl.textContent = '';
      BG.sfx('shoot');
    }
    canvas.addEventListener('pointerdown', () => {
      if (over) return;
      if (phase === 'aim') { phase = 'power'; return; }
      if (phase === 'power') { roll(); return; }
    });
    s.raf(() => {
      if (over) return;
      if (phase === 'aim') { aim += aimDir * 0.022; if (aim > 1 || aim < -1) aimDir *= -1; }
      if (phase === 'power') { power += powerDir * 0.02; if (power > 1 || power < 0) powerDir *= -1; }
      /* gerak bola */
      if (ball) {
        ball.y += ball.vy; ball.x += ball.vx;
        ball.vy *= 0.996; ball.r = Math.max(4, 15 - (H - 36 - ball.y) * 0.028);
        /* tabrak pin */
        for (const pin of pins) {
          if (pin.fallen) continue;
          const d = Math.hypot(ball.x - pin.x, ball.y - pin.y);
          if (d < ball.r + 8) { pin.fallen = true; fallenPins++; BG.sfx('pop'); ball.vx *= 0.88; }
        }
        if (ball.y < H * 0.16) {
          /* lemparan selesai, hitung */
          const threw = fallenPins;
          totalScore += threw; scoreEl.textContent = totalScore;
          throwInFrame++;
          const remaining = pins.filter(p => !p.fallen).length;
          if (remaining === 0 || throwInFrame >= 2) {
            /* frame selesai */
            if (remaining === 0 && throwInFrame === 1) { totalScore += 10; msgEl.textContent = 'STRIKE! +10'; BG.sfx('win'); }
            throwInFrame = 0; frame++;
            if (frame > TOTAL_FRAMES) {
              over = true;
              BG.endScreen(canvas.parentElement, { score: totalScore, bestKey: 'bowling3d', title: 'Selesai!', sub: 'Total poin bowling: ' + totalScore, scoreLabel: totalScore + ' pin', onRetry: retry3d(el, s, 'bowling3d') });
              return;
            }
            frameEl.textContent = frame + '/' + TOTAL_FRAMES;
            resetPins();
            if (remaining === 0) { /* strike, frame auto-advance handled */ }
          } else {
            msgEl.textContent = remaining === 0 ? '' : 'Sisa ' + remaining + ' pin, lempar lagi!';
            /* hapus pin yang jatuh dari lemparan pertama */
            pins = pins.filter(p => !p.fallen);
            pinsEl.textContent = pins.length;
          }
          ball = null; fallbackPlaceBall();
          phase = 'aim';
        }
      }
      /* ===== render ===== */
      ctx.fillStyle = '#1c0a2e'; ctx.fillRect(0, 0, W, H);
      /* lane */
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#78350f'); grad.addColorStop(0.5, '#b45309'); grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(W * 0.36, H * 0.22); ctx.lineTo(W * 0.64, H * 0.22); ctx.lineTo(W * 0.94, H); ctx.lineTo(W * 0.06, H); ctx.closePath(); ctx.fill();
      /* panah arah di lane */
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      [0.55, 0.68, 0.81].forEach(t => { const ax = W * (0.5); const ay = H * t; const sc = (1 - t) * 30 + 10; ctx.beginPath(); ctx.moveTo(ax, ay - sc); ctx.lineTo(ax - sc * 0.66, ay + sc * 0.66); ctx.lineTo(ax + sc * 0.66, ay + sc * 0.66); ctx.closePath(); ctx.fill(); });
      /* sisi */
      ctx.fillStyle = '#2e1065'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.36, H * 0.22); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W * 0.64, H * 0.22); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      /* lampu */
      ctx.fillStyle = '#fde047';
      [[60, 40], [W - 60, 40], [W / 2, 20]].forEach(([x, y]) => { ctx.globalAlpha = .85; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      /* pin */
      pins.forEach(pin => {
        const sc = 1 - (H - pin.y) / H * 0.55;
        const pw = 8 * sc + 3, ph = 17 * sc + 5;
        if (pin.fallen) ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(pin.x - pw / 2, pin.y - ph, pw, ph, pw / 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(pin.x - pw / 2, pin.y - ph * 0.62); ctx.lineTo(pin.x + pw / 2, pin.y - ph * 0.62); ctx.stroke();
        ctx.globalAlpha = 1;
      });
      /* bola */
      const ballR = ball ? ball.r : 15, ballX = ball ? ball.x : W / 2 + aim * 70, ballY = ball ? ball.y : H - 36;
      ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      [[-0.3, -0.15], [0.18, 0.05], [-0.05, 0.3]].forEach(([ox, oy]) => { ctx.beginPath(); ctx.arc(ballX + ox * ballR, ballY + oy * ballR, ballR * 0.16, 0, Math.PI * 2); ctx.fill(); });
      /* aim arrow */
      if (phase === 'aim') {
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.setLineDash([7, 7]);
        ctx.beginPath(); ctx.moveTo(W / 2 + aim * 70, H - 52); ctx.lineTo(W / 2 + aim * 70, H * 0.3); ctx.stroke(); ctx.setLineDash([]);
      }
      /* power meter */
      if (phase === 'power') {
        ctx.fillStyle = '#111827'; ctx.fillRect(W / 2 - 110, H - 20, 220, 13);
        ctx.fillStyle = power > 0.75 ? '#ef4444' : '#4ade80'; ctx.fillRect(W / 2 - 110, H - 20, 220 * power, 13);
      }
    });
    function fallbackPlaceBall() { /* posisi bola di-reset di render (phase aim) */ }
    frameEl.textContent = '1/' + TOTAL_FRAMES; scoreEl.textContent = 0;
    timeElSafe();
    function timeElSafe() {}
  }
});
