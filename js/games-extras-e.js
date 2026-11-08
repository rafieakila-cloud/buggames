/* Buggames — Game EKSTRA (bagian 4/4) */
'use strict';

function exRetry(el, s, id) { return () => { el.innerHTML = ''; BG.games.find(g => g.id === id).start(el, s); }; }

/* ============ MATADOR BUG ============ */
BG.register({
  id: 'matadorbug', name: 'Matador Bug', desc: 'Kembung si banteng! Elus di saat yang tepat!', cat: 'arcade', icon: 'bull', tags: 'matador banteng dodgy timing',
  start(el, s) {
    let round = 0, lives = 3, score = 0; const TOTAL = 10;
    el.innerHTML = '<div class="panel center-col" style="max-width:420px;text-align:center"><div class="hud" style="width:100%">' + BG.hudPill('Skor', 'mt-score') + BG.hudPill('Nyawa', 'mt-lives') + '<div class="hud-pill">Banteng <b id="mt-round">1</b>/' + TOTAL + '</div></div>' +
      '<div style="font-size:4.5rem;margin:4px" id="mt-bull">🐂</div>' +
      '<p id="mt-msg" style="min-height:1.4em;font-weight:800;color:#ffd23f">Banteng akan menyerang... siap?</p>' +
      '<button class="btn btn-lime btn-block" id="mt-dodge" style="font-size:1.3rem;padding:18px">ELAK! 🤸</button>' +
      '<div style="height:18px;background:#241239;border-radius:9px;overflow:hidden;width:100%;border:2px solid var(--ink)"><div id="mt-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#4ade80,#facc15,#ef4444)"></div></div></div>';
    const bullEl = el.querySelector('#mt-bull'), msgEl = el.querySelector('#mt-msg'), dodgeBtn = el.querySelector('#mt-dodge'), barEl = el.querySelector('#mt-bar');
    const scoreEl = el.querySelector('#mt-score'), livesEl = el.querySelector('#mt-lives'), roundEl = el.querySelector('#mt-round');
    let charge = 0, charging = true, dodged = false, attacking = false;

    s.interval(() => {
      if (!charging || over()) return;
      charge += 1.6 + round * 0.35;
      barEl.style.width = Math.min(100, charge) + '%';
      bullEl.style.transform = 'scale(' + (1 + Math.min(0.5, charge / 130)) + ')';
      if (charge >= 100) { charging = false; bullCharge(); }
    }, 30);
    function bullCharge() {
      attacking = true;
      s.timeout(() => {
        if (over()) return;
        if (!dodged) { lives--; livesEl.textContent = lives; BG.sfx('bad'); msgEl.textContent = 'KETABRAK! Banteng mengganpmu!'; }
        else { score += 10; scoreEl.textContent = score; BG.sfx('good'); msgEl.textContent = 'Selamat! Kamu dodged dengan anggun!'; }
        dodged = false; attacking = false;
        nextRound();
      }, 420);
    }
    function nextRound() {
      round++;
      if (round > TOTAL || lives <= 0) return finish();
      roundEl.textContent = round;
      charge = 0; charging = true;
      barEl.style.width = '0%'; bullEl.style.transform = 'scale(1)';
      msgEl.textContent = 'Banteng menyerang lagi...';
    }
    dodgeBtn.addEventListener('pointerdown', () => {
      if (over() || !attacking && charge < 55) { msgEl.textContent = 'Terlalu cepat/lambat! Tunggu banteng mendekat!'; BG.sfx('bad'); return; }
      dodged = true;
    });
    function over() { return lives <= 0 || round > TOTAL; }
    function finish() {
      charging = false;
      BG.endScreen(el.querySelector('.panel').parentElement, { score, bestKey: 'matadorbug', win: lives > 0, title: lives <= 0 ? 'Babak Belur!' : 'Matador Legendaris!', sub: 'Kamu menghindari ' + score / 10 + ' banteng.', scoreLabel: score + ' poin', onRetry: exRetry(el, s, 'matadorbug') });
    }
    livesEl.textContent = lives; scoreEl.textContent = score; roundEl.textContent = round + 1;
  }
});

/* ============ KASTIL BERTAHAN ============ */
BG.register({
  id: 'kastilbetahan', name: 'Kastil Bertahan', desc: 'Jaga kastil dari gempuran bug!', cat: 'arcade', icon: 'castle', tags: 'kastil tower defense bertahan',
  start(el, s) {
    const W = 460, H = 340;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'kb-score') + BG.hudPill('Kastil', 'kb-hp') + BG.hudPill('Gelombang', 'kb-wave') + '</div><canvas width="' + W + '" height="' + H + '" style="cursor:crosshair"></canvas>' +
      '<p style="text-align:center;font-size:.78rem;color:#b8a6d9">Ketuk bug untuk menembaknya!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#kb-score'), hpEl = el.querySelector('#kb-hp'), waveEl = el.querySelector('#kb-wave');
    let score = 0, hp = 10, wave = 1, over = false, frame = 0, spawnRate = 55;
    let bugs = [];
    const CASTLE_X = W - 70;

    s.on(canvas, 'pointerdown', e => {
      if (over) return;
      const p = BG.canvasPos(canvas, e);
      let hitIdx = -1;
      for (let i = bugs.length - 1; i >= 0; i--) if (Math.hypot(p.x - bugs[i].x, p.y - bugs[i].y) < bugs[i].r + 6) { hitIdx = i; break; }
      if (hitIdx >= 0) { score += 10; scoreEl.textContent = score; bugs.splice(hitIdx, 1); BG.sfx('pop'); }
    });
    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % spawnRate === 0) bugs.push({ x: -20, y: H * 0.72 + Math.sin(frame * 0.7) * 40, vx: 0.9 + wave * 0.22, r: 14 + wave * 0.6, hp: 1 + Math.floor(wave / 3) });
      bugs.forEach(b => b.x += b.vx);
      bugs = bugs.filter(b => {
        if (b.x > CASTLE_X - 10) { hp -= 1; hpEl.textContent = hp; BG.sfx('bad'); return false; }
        return true;
      });
      if (frame % 700 === 0) { wave++; waveEl.textContent = wave; spawnRate = Math.max(22, spawnRate - 4); }
      if (hp <= 0) {
        over = true;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'kastilbetahan', title: 'Kastil Jatuh!', sub: 'Kamu bertahan sampai gelombang ' + wave + '.', scoreLabel: score, onRetry: exRetry(el, s, 'kastilbetahan') });
      }
      /* gambar */
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e1b4b'); g.addColorStop(0.62, '#166534'); g.addColorStop(1, '#052e16');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3f3f46'; ctx.fillRect(0, H * 0.72, W, H * 0.28);
      /* kastil */
      ctx.fillStyle = '#a78bfa'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(CASTLE_X - 8, H * 0.72); ctx.lineTo(CASTLE_X - 8, H * 0.3); ctx.lineTo(CASTLE_X + 8, H * 0.3); ctx.lineTo(CASTLE_X + 34, H * 0.36); ctx.lineTo(CASTLE_X + 44, H * 0.3); ctx.lineTo(CASTLE_X + 62, H * 0.3); ctx.lineTo(CASTLE_X + 62, H * 0.72); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#241239'; ctx.fillRect(CASTLE_X + 18, H * 0.52, 18, 22);
      /* menara api */
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(CASTLE_X + 24, H * 0.24); ctx.lineTo(CASTLE_X + 30, H * 0.15); ctx.lineTo(CASTLE_X + 36, H * 0.24); ctx.closePath(); ctx.fill();
      /* bug musuh */
      bugs.forEach(b => drawMiniBug(ctx, b.x, b.y, b.r, '#ff5a5a'));
    });
    hpEl.textContent = hp; waveEl.textContent = wave; scoreEl.textContent = score;
  }
});

/* ============ KATAK LOMPAT ============ */
BG.register({
  id: 'kataklompat', name: 'Katak Lompat', desc: 'Lompat dari daun ke daun!', cat: 'arcade', icon: 'frog', tags: 'katak lompat lily pad jump',
  start(el, s) {
    const W = 440, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'kk-score') + '</div><canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p style="text-align:center;font-size:.78rem;color:#b8a6d9">Ketuk layar untuk melompat ke daun hijau!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#kk-score');
    let pads = [], frog = { y: 0 }, jumpY = 0, jumpV = 0, score = 0, over = false, frame = 0, started = false;

    function genPad(x) { return { x, y: H * 0.72 + BG.rand(-36, 36), r: BG.rand(19, 27), sway: Math.random() * 6.28 }; }
    for (let i = 0; i < 5; i++) pads.push(genPad(W * 0.3 + i * 110));
    let scrollX = 0;

    s.on(canvas, 'pointerdown', () => {
      if (over) return;
      if (!started) started = true;
      if (jumpY === 0) { jumpV = 8.6; BG.sfx('pop'); }
    });
    s.raf(() => {
      if (over) return;
      frame++;
      const speed = 2 + Math.floor(frame / 300) * 0.55;
      scrollX += started ? speed : 0;
      pads.forEach(p => { p.x -= started ? speed : 0; p.sway += 0.025; });
      pads = pads.filter(p => p.x > -40);
      while (pads.length < 5) pads.push(genPad(pads[pads.length - 1].x + 105 + BG.rand(0, 30)));
      /* fisika lompat */
      if (jumpY > 0 || jumpV > 0) { jumpY += jumpV; jumpV -= 0.34; if (jumpY <= 0) jumpY = 0; }
      /* apakah katak di atas daun? */
      const frogX = W * 0.28;
      const onPad = pads.some(p => Math.hypot(p.x - frogX, p.y - (H - 46)) < p.r + 14 && jumpY < 30);
      if (!onPad && jumpY === 0) {
        over = true; BG.sfx('bad');
        BG.endScreen(canvas.parentElement, { score, bestKey: 'kataklompat', title: 'Spdesert!', sub: 'Lompat sejauh ' + score + ' daun!', scoreLabel: score, onRetry: exRetry(el, s, 'kataklompat') });
      } else if (started && frame % 6 === 0) { score++; scoreEl.textContent = score; }
      /* render kolam */
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#164e63'); g.addColorStop(1, '#082f3e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      [[60, 90], [200, 50], [330, 140], [140, 220]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y + Math.sin(frame / 20 + x) * 3, 26, 6, 0, 0, Math.PI * 2); ctx.fill(); });
      /* daun */
      pads.forEach(p => {
        ctx.fillStyle = '#22c55e'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.42, Math.sin(p.sway) * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#166534'; ctx.beginPath(); ctx.moveTo(p.x - p.r * 0.5, p.y); ctx.lineTo(p.x + p.r * 0.5, p.y); ctx.stroke();
      });
      /* katak */
      const fy = H - 46 - jumpY;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(W * 0.28, H - 4, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
      drawMiniBug(ctx, W * 0.28, fy, 13, '#4ade80');
    });
    scoreEl.textContent = 0;
  }
});

/* ============ TEBAK SUARA HEWAN ============ */
BG.register({
  id: 'tebaksuara', name: 'Tebak Suara Hewan', desc: 'Dengar, tebak hewan apa!', cat: 'kuis', icon: 'ear', tags: 'suara hewan guess sound',
  start(el, s) {
    const ANIMALS = [
      { name: 'Kucing', play: a => mew(a) }, { name: 'Anjing', play: a => woof(a) }, { name: 'Sapi', play: a => moo(a) },
      { name: 'Ayam', play: a => cluck(a) }, { name: 'Bebek', play: a => quack(a) }, { name: 'Burung', play: a => chirp(a) },
    ];
    function tone(a, freq, dur, type, when, vol) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sawtooth'; o.frequency.value = freq;
      const t = a.currentTime + (when || 0);
      g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
    }
    function mew(a) { tone(a, 720, 0.28, 'sawtooth', 0, 0.15); tone(a, 940, 0.3, 'sawtooth', 0.24, 0.15); }
    function woof(a) { tone(a, 130, 0.12, 'square', 0, 0.3); tone(a, 110, 0.14, 'square', 0.18, 0.3); }
    function moo(a) { tone(a, 160, 0.8, 'sawtooth', 0, 0.22); }
    function cluck(a) { [0, 0.24, 0.48].forEach(t => tone(a, 480, 0.08, 'square', t, 0.2)); }
    function quack(a) { [0, 0.18, 0.36, 0.54].forEach(t => tone(a, 290, 0.12, 'sawtooth', t, 0.18)); }
    function chirp(a) { [0, 0.12, 0.3].forEach((t, i) => tone(a, 1800 + i * 400, 0.07, 'sine', t, 0.16)); }

    const questions = BG.shuffle(ANIMALS).slice(0, 6);
    let idx = 0, score = 0, over = false;
    el.innerHTML = '<div class="panel center-col" style="max-width:440px;text-align:center"><div class="hud" style="width:100%">' + BG.hudPill('Skor', 'ts-score') + '<div class="hud-pill">Hewan <b id="ts-num">1</b>/6</div></div>' +
      '<button class="btn btn-teal btn-block" id="ts-play" style="font-size:1.2rem">🔊 Dengarkan</button>' +
      '<div class="choices" id="ts-choices" style="margin-top:8px"></div></div>';
    const scoreEl = el.querySelector('#ts-score'), numEl = el.querySelector('#ts-num'), playBtn = el.querySelector('#ts-play'), choicesEl = el.querySelector('#ts-choices');
    let actx = null;
    function render() {
      numEl.textContent = idx + 1;
      const opts = BG.shuffle([questions[idx].name].concat(BG.shuffle(ANIMALS.filter(x => x.name !== questions[idx].name)).slice(0, 3).map(x => x.name)));
      choicesEl.innerHTML = opts.map(n => '<button class="choice-btn" data-n="' + n + '">' + n + '</button>').join('');
    }
    playBtn.addEventListener('click', () => {
      try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); questions[idx].play(actx); } catch (e) {}
      BG.sfx('click');
    });
    choicesEl.addEventListener('click', e => {
      const btn = e.target.closest('.choice-btn'); if (!btn || over) return;
      if (btn.dataset.n === questions[idx].name) { score += 15; BG.sfx('good'); btn.classList.add('correct'); } else { BG.sfx('bad'); btn.classList.add('wrong'); }
      scoreEl.textContent = score; over = true;
      s.timeout(() => { over = false; idx++; if (idx >= questions.length) BG.endScreen(el.querySelector('.panel').parentElement, { score, bestKey: 'tebaksuara', title: 'Zoologist!', sub: 'Kamu hafal semua suara hewan: ' + score + ' poin.', onRetry: exRetry(el, s, 'tebaksuara') }); else render(); }, 700);
    });
    render();
  }
});

/* ============ SALIN KODE ============ */
BG.register({
  id: 'salinkode', name: 'Salin Kode', desc: 'Pecahkan PIN 4 digit tersembunyi!', cat: 'puzzle', icon: 'code', tags: 'kode pin crack cracker',
  start(el, s) {
    const target = Array.from({ length: 4 }, () => BG.rand(1, 6));
    let attempts = 0, over = false;
    el.innerHTML = '<div class="panel center-col" style="max-width:380px;text-align:center"><h3>Kode 4 Digit (1-6)</h3>' +
      '<div id="sk2-hint" style="font-size:.85rem;color:#d9c9f2;min-height:1.4em">Tebak PIN 4 angka...</div>' +
      '<input id="sk2-input" type="number" min="1000" max="6666" placeholder="????" style="width:150px;text-align:center;font-size:2rem;font-weight:900;padding:10px;border-radius:12px;border:3px solid var(--ink);background:#fff8ec;letter-spacing:.3em">' +
      '<button class="btn btn-lime" id="sk2-go">COBA</button>' +
      '<div id="sk2-log" style="display:flex;flex-direction:column;gap:4px;max-height:150px;overflow:auto"></div></div>';
    const input = el.querySelector('#sk2-input'), hintEl = el.querySelector('#sk2-hint'), logEl = el.querySelector('#sk2-log');
    function feedback(guess) {
      const t = target.slice(), g = guess.slice(), fb = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) if (g[i] === t[i]) { fb[i] = 2; t[i] = -1; g[i] = -1; }
      for (let i = 0; i < 4; i++) { if (g[i] < 0) continue; const j = t.indexOf(g[i]); if (j >= 0) { fb[i] = 1; t[j] = -1; } }
      return fb;
    }
    el.querySelector('#sk2-go').addEventListener('click', () => {
      if (over) return;
      const v = input.value.trim();
      if (!/^[1-6]{4}$/.test(v)) { hintEl.textContent = 'Masukkan 4 angka 1-6!'; return; }
      attempts++;
      const fb = feedback(v.split('').map(Number));
      const marks = fb.map(f => f === 2 ? '🟢' : f === 1 ? '🟡' : '⚫').join(' ');
      const row = document.createElement('div'); row.innerHTML = '<span style="font-weight:800;letter-spacing:.2em">' + v + '</span> → ' + marks;
      logEl.prepend(row);
      if (fb.every(f => f === 2)) {
        over = true; BG.sfx('win');
        BG.endScreen(el.querySelector('.panel').parentElement, { score: Math.max(10, 600 - attempts * 40), bestKey: 'salinkode', lowerBetter: true, title: 'TERPECAH!', sub: 'Kode ' + v + ' bobol dalam ' + attempts + ' tebakan.', scoreLabel: attempts + ' tebakan', onRetry: exRetry(el, s, 'salinkode') });
      } else BG.sfx('click');
      input.value = ''; input.focus();
    });
  }
});

/* ============ DRUM BUG ============ */
BG.register({
  id: 'drumbug', name: 'Drum Bug', desc: 'Tirukan ritme drum!', cat: 'kuis', icon: 'drum', tags: 'drum ritme rhythm',
  start(el, s) {
    const COMPLETE = ['#ef4444', '#facc15', '#22c55e', '#3b82f6'];
    let seq = [], playerIdx = 0, round = 0, over = false, accepting = false;
    el.innerHTML = '<div class="panel center-col" style="max-width:400px;text-align:center"><div class="hud" style="width:100%">' + BG.hudPill('Level', 'dr2-level') + '</div>' +
      '<div id="dr2-pads" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%"></div>' +
      '<p id="dr2-msg" style="min-height:1.4em;font-weight:800;color:#ffd23f">Perhatikan ritmenya...</p></div>';
    const padsEl = el.querySelector('#dr2-pads'), levelEl = el.querySelector('#dr2-level'), msgEl = el.querySelector('#dr2-msg');
    padsEl.innerHTML = COMPLETE.map((c, i) => '<button class="cell" data-i="' + i + '" style="height:84px;background:' + c + ';border:4px solid #241239;border-radius:14px;opacity:.5;transition:all .1s;cursor:pointer"></button>').join('');
    const padEls = [...padsEl.querySelectorAll('.cell')];
    let actx = null;
    function beat(i, dur) {
      return new Promise(res => {
        padEls[i].style.opacity = '1'; padEls[i].style.transform = 'scale(1.06)';
        try {
          actx = actx || new (window.AudioContext || window.webkitAudioContext)();
          if (actx.state === 'suspended') actx.resume();
          const o = actx.createOscillator(), g = actx.createGain();
          o.type = 'square'; o.frequency.value = [180, 240, 320, 420][i];
          const t = actx.currentTime;
          g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.16));
          o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + (dur || 0.16) + 0.02);
        } catch (e) {}
        setTimeout(() => { padEls[i].style.opacity = '.5'; padEls[i].style.transform = 'scale(1)'; res(); }, (dur || 0.16) * 1000 + 80);
      });
    }
    async function playSeq() {
      accepting = false; msgEl.textContent = 'Dengar...';
      await new Promise(r => setTimeout(r, 480));
      for (const i of seq) { await beat(i, 0.22); await new Promise(r => setTimeout(r, 90)); }
      msgEl.textContent = 'Giliranmu!'; accepting = true; playerIdx = 0;
    }
    function nextRound() {
      round++; levelEl.textContent = round;
      seq.push(BG.rand(0, 3));
      playSeq();
    }
    padsEl.addEventListener('click', async e => {
      const pad = e.target.closest('.cell'); if (!pad || !accepting || over) return;
      const i = +pad.dataset.i;
      beat(i, 0.18);
      if (i === seq[playerIdx]) {
        playerIdx++;
        if (playerIdx === seq.length) { accepting = false; msgEl.textContent = 'Keren! Lanjut...'; s.timeout(nextRound, 700); }
      } else {
        over = true; accepting = false; BG.sfx('bad');
        BG.endScreen(el.querySelector('.panel').parentElement, { score: (round - 1) * 15, bestKey: 'drumbug', title: 'Salah Ritme!', sub: 'Kamu tahan sampai level ' + round + '.', scoreLabel: 'Level ' + round, onRetry: exRetry(el, s, 'drumbug') });
      }
    });
    nextRound();
  }
});

/* ============ LARI 100M BUG ============ */
BG.register({
  id: 'lari100m', name: 'Lari 100m Bug', desc: 'Pencet secepat-cepatnya lawan 3 bug!', cat: 'arcade', icon: 'runner', tags: 'lari sprint 100m race',
  start(el, s) {
    let my = 0, ai = [0, 0, 0], over = false, started = false, countdown = 3, wins = 0;
    const AI_NAMES = ['Flash Bug', 'Speedy', 'Kilat'];
    el.innerHTML = '<div class="panel center-col" style="max-width:460px;text-align:center"><div style="font-size:.8rem;letter-spacing:2px;color:#b8a6d9">LARI 100 METER</div>' +
      '<h1 id="lr-count" style="font-size:4rem;color:#ffd23f;margin:4px 0">3</h1>' +
      '<div id="lr-track" style="display:flex;flex-direction:column;gap:6px;width:100%"></div>' +
      '<button class="btn btn-lime btn-block" id="lr-mash" style="font-size:1.5rem;padding:18px">LARI! 🏃</button></div>';
    const countEl = el.querySelector('#lr-count'), trackEl = el.querySelector('#lr-track'), mashBtn = el.querySelector('#lr-mash');

    function drawTrack() {
      const all = [{ name: 'KAMU', v: my, color: '#b9f542' }].concat(AI_NAMES.map((n, i) => ({ name: n, v: ai[i], color: ['#facc15', '#22d3ee', '#fb7185'][i] })));
      trackEl.innerHTML = all.map(r => '<div style="display:flex;align-items:center;gap:8px"><span style="width:72px;text-align:right;font-size:.7rem;font-weight:800;color:' + r.color + '">' + r.name + '</span><div style="flex:1;height:18px;background:#241239;border-radius:9px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, r.v) + '%;background:' + r.color + ';transition:width .08s"></div></div></div>').join('');
    }
    s.interval(() => {
      if (over) return;
      if (countdown > 0) { countdown--; countEl.textContent = countdown === 0 ? 'GO!' : countdown; BG.sfx('click'); if (countdown === 0) started = true; drawTrack(); return; }
      /* AI lari otomatis */
      for (let i = 0; i < 3; i++) ai[i] += 0.9 + Math.random() * 1.35;
      drawTrack();
      const maxAi = Math.max(...ai);
      if (my >= 100 || maxAi >= 100) {
        over = true;
        const won = my >= 100 && my >= maxAi;
        BG.endScreen(el.querySelector('.panel').parentElement, { score: won ? 500 : 0, bestKey: 'lari100m', win: won, title: won ? 'Juara 1!' : 'Kalah!', sub: won ? 'Kaki baja! Flying finish!' : 'Lari lebih kencang lagi!', scoreLabel: won ? 'Menang!' : 'Kalah', onRetry: exRetry(el, s, 'lari100m') });
      }
    }, 100);
    mashBtn.addEventListener('pointerdown', () => { if (!started || over) return; my += 2.1; BG.sfx('click'); drawTrack(); });
    drawTrack();
  }
});

/* ============ DETEKTIF BUG ============ */
BG.register({
  id: 'detektifbug', name: 'Detektif Bug', desc: 'Cari bug maling keju!', cat: 'puzzle', icon: 'magnify', tags: 'detektif keju mystery tebak',
  start(el, s) {
    /* 8 tersangka: atribut unik */
    const SUSPECTS = [
      { name: 'Buggy Si Kutu', color: '#ef4444' }, { name: 'Nona Kecoa', color: '#f97316' }, { name: 'Laba-Laba', color: '#facc15' }, { name: 'Semut Merah', color: '#a78bfa' },
      { name: 'Kupu-Kupu', color: '#22c55e' }, { name: 'Belalang', color: '#3b82f6' }, { name: 'Capung', color: '#f472b6' }, { name: 'Kumbang', color: '#9ca3af' },
    ];
    const guilty = BG.rand(0, SUSPECTS.length - 1);
    let questionsLeft = 6, over = false;
    const ASKABLE = [
      { q: 'Apakah malingnya berwarna merah/oranye?', test: i => [0, 1].includes(i) },
      { q: 'Apakah malingnya berwarna kuning/ungu?', test: i => [2, 3].includes(i) },
      { q: 'Apakah malingnya berwarna hijau/biru?', test: i => [4, 5].includes(i) },
      { q: 'Apakah tersangka nomor 1 atau 2?', test: i => i < 2 },
      { q: 'Apakah tersangka nomor 4 atau 5?', test: i => i === 3 || i === 4 },
      { q: 'Apakah tersangka nomor 7 atau 8?', test: i => i >= 6 },
      { q: 'Apakah dia ada di barisan depan (1, 3, 5, 7)?', test: i => i % 2 === 0 },
    ];
    el.innerHTML = '<div class="panel center-col" style="max-width:480px"><div class="hud" style="width:100%">' + BG.hudPill('Sisa Tanya', 'dt2-left') + '</div>' +
      '<h3>Siapa yang mencuri keju? 🧀</h3>' +
      '<p style="font-size:.72rem;color:#b8a6d9">Mode tuduh: klik "TUDUH!" lalu klik kartu tersangka.</p>' +
      '<div id="dt2-suspects" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%"></div>' +
      '<p id="dt2-log" style="min-height:2.2em;font-size:.82rem;color:#d9c9f2;text-align:center">Tanya untuk mempersempit tersangka!</p>' +
      '<div id="dt2-ask" style="display:flex;flex-direction:column;gap:6px;width:100%"></div>' +
      '<button class="btn btn-pink btn-block" id="dt2-accuse">TUDUH! ☝</button></div>';
    const susEl = el.querySelector('#dt2-suspects'), logEl = el.querySelector('#dt2-log'), askEl = el.querySelector('#dt2-ask'), leftEl = el.querySelector('#dt2-left');
    let accuseMode = false;
    const asked = new Set();
    const askList = () => ASKABLE.map((q, i) => i).filter(i => !asked.has(i));
    function renderSuspects() {
      susEl.innerHTML = SUSPECTS.map((t, i) =>
        '<button class="cell" data-i="' + i + '" style="background:' + t.color + ';border-color:' + (accuseMode ? '#fbbf24' : '#241239') + ';flex-direction:column;padding:4px;cursor:' + (accuseMode ? 'pointer' : 'default') + '"><div style="font-size:1.3rem">🐛</div><span style="font-size:.55rem;color:#111;font-weight:800">' + (i + 1) + '. ' + t.name + '</span></button>'
      ).join('');
    }
    function renderAsk() {
      askEl.innerHTML = askList().map(i => '<button class="choice-btn" data-i="' + i + '" style="font-size:.75rem;padding:9px 8px">' + ASKABLE[i].q + '</button>').join('') || '<p style="text-align:center;color:#fbbf24">Pertanyaan habis — tuduh sekarang!</p>';
    }
    askEl.addEventListener('click', e => {
      const btn = e.target.closest('.choice-btn'); if (!btn || over || accuseMode) return;
      const i = +btn.dataset.i, answer = ASKABLE[i].test(guilty);
      asked.add(i);
      questionsLeft = Math.max(0, questionsLeft - 1); leftEl.textContent = questionsLeft;
      logEl.textContent = '"' + ASKABLE[i].q.replace('Apakah ', '').replace('?', '') + '?" → ' + (answer ? 'YA! 🔍' : 'BUKAN 🙅');
      BG.sfx('click');
      renderAsk();
      if (questionsLeft <= 0) logEl.textContent += ' (Habis — tuduh!)';
    });
    suElClick();
    function suElClick() {
      susEl.addEventListener('click', e => {
        const btn = e.target.closest('.cell'); if (!btn || over) return;
        if (!accuseMode) { logEl.textContent = 'Ketuk "TUDUH!" dulu, baru klik tersangka!'; return; }
        const chosen = +btn.dataset.i;
        over = true;
        const win = chosen === guilty;
        BG.sfx(win ? 'win' : 'lose');
        BG.endScreen(el.querySelector('.panel').parentElement, {
          score: win ? questionsLeft * 100 + 100 : 0, bestKey: 'detektifbug', win,
          title: win ? 'TERTANGKAP!' : 'Salah Tuduh!',
          sub: win ? 'Maling keju ketangkap! Sisa pertanyaan: ' + questionsLeft : 'Malingnya kabur! Yang bersalah: ' + SUSPECTS[guilty].name,
          scoreLabel: win ? 'Terpecahkan!' : 'Gagal',
          onRetry: exRetry(el, s, 'detektifbug'),
        });
      });
    }
    askEl.style.pointerEvents = 'auto';
    el.querySelector('#dt2-accuse').addEventListener('click', () => {
      if (over) return;
      accuseMode = !accuseMode;
      el.querySelector('#dt2-accuse').textContent = accuseMode ? 'BATAL TUDUH' : 'TUDUH! ☝';
      el.querySelector('#dt2-accuse').style.background = accuseMode ? '#78350f' : '';
      logEl.textContent = accuseMode ? 'Pilih kartu tersangka yang maling!' : 'Ok, lanjut tanya...';
      BG.sfx('click');
      renderSuspects();
    });
    renderSuspects(); renderAsk();
    leftEl.textContent = questionsLeft;
  }
});
