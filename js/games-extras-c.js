
/* ============ TEBAK MELODI ============ */
BG.register({
  id: 'tebakmelodi', name: 'Tebak Melodi', desc: 'Dengar nada, tebak judul lagu!', cat: 'kuis', icon: 'drum', tags: 'melodi lagu musik tebak',
  start(el, s) {
    const SONGS = [
      { name: 'Twinkle Twinkle Little Star', notes: [60, 60, 67, 67, 69, 69, 67] },
      { name: 'Ode to Joy', notes: [64, 64, 65, 67, 67, 65, 64, 62] },
      { name: 'Happy Birthday', notes: [67, 67, 69, 67, 72, 71] },
      { name: 'Gundul-Gundul Pacul', notes: [60, 62, 64, 60, 64, 62, 60] },
      { name: 'Potong Bebek Angsa', notes: [62, 64, 66, 64, 62, 60, 62] },
      { name: 'Bintang Kecil (Twinkle versi 2)', notes: [67, 67, 69, 69, 67, 67, 65] },
    ];
    const questions = BG.shuffle(SONGS).slice(0, 6);
    let idx = 0, score = 0, over = false, actx = null;
    el.innerHTML = '<div class="panel center-col" style="max-width:440px;text-align:center"><div class="hud" style="width:100%">' + BG.hudPill('Skor', 'tm-score') + '<div class="hud-pill">Lagu <b id="tm-num">1</b>/6</div></div>' +
      '<button class="btn btn-teal btn-block" id="tm-play" style="font-size:1.1rem">▶ Dengarkan</button>' +
      '<div class="choices" id="tm-choices" style="margin-top:8px"></div></div>';
    const scoreEl = el.querySelector('#tm-score'), numEl = el.querySelector('#tm-num'), playBtn = el.querySelector('#tm-play'), choicesEl = el.querySelector('#tm-choices');
    const noteFreq = n => 440 * Math.pow(2, (n - 69) / 12);
    function playMelody(notes) {
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        notes.forEach((n, i) => {
          const o = actx.createOscillator(), g = actx.createGain();
          o.type = 'triangle'; o.frequency.value = noteFreq(n);
          const t = actx.currentTime + i * 0.34;
          g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
          o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.34);
        });
      } catch (e) { /* audio unavailable */ }
    }
    function render() {
      const song = questions[idx];
      numEl.textContent = idx + 1;
      const opts = BG.shuffle([song.name].concat(BG.shuffle(SONGS.filter(x => x.name !== song.name)).slice(0, 3).map(x => x.name)));
      choicesEl.innerHTML = opts.map(n => '<button class="choice-btn" data-n="' + n + '" style="font-size:.8rem">' + n + '</button>').join('');
    }
    playBtn.addEventListener('click', () => { playMelody(questions[idx].notes); BG.sfx('click'); });
    choicesEl.addEventListener('click', e => {
      const btn = e.target.closest('.choice-btn'); if (!btn || over) return;
      const correct = questions[idx].name;
      if (btn.dataset.n === correct) { score += 15; BG.sfx('good'); btn.classList.add('correct'); } else { BG.sfx('bad'); btn.classList.add('wrong'); }
      scoreEl.textContent = score; over = true;
      s.timeout(() => { over = false; idx++; if (idx >= questions.length) BG.endScreen(el.querySelector('.panel').parentElement, { score, bestKey: 'tebakmelodi', title: 'Konduktor!', sub: 'Kamu punya kuping emas: ' + score + ' poin.', onRetry: exRetry(el, s, 'tebakmelodi') }); else render(); }, 700);
    });
    render();
  }
});

/* ============ PANCING IKAN ============ */
BG.register({
  id: 'pancingikan', name: 'Pancing Ikan', desc: 'Kait ikan dengan timing sempurna!', cat: 'arcade', icon: 'fish', tags: 'pancing ikan fishing',
  start(el, s) {
    const W = 440, H = 340;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'pi-score') + BG.hudPill('Waktu', 'pi-time') + '</div><canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p id="pi-msg" style="text-align:center;font-weight:800;color:#ffd23f;min-height:1.3em">Ketuk "KAIT!" saat ikan memakan umpan!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#pi-score'), timeEl = el.querySelector('#pi-time'), msgEl = el.querySelector('#pi-msg');
    let score = 0, timeLeft = 45, over = false, frame = 0, phase = 'waiting', fishX = 0, biteAt = 0;
    let meter = 0, meterDir = 1;
    const FISHES = [['Ikan Mujair', 10, '#facc15'], ['Lele', 15, '#9ca3af'], ['Gurame', 25, '#fb923c'], ['Mas Koki', 20, '#f472b6'], ['Koi Emas', 50, '#fde047']];
    let currentFish = FISHES[0];

    s.interval(() => { if (over) return; timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) { over = true; BG.endScreen(canvas.parentElement, { score, bestKey: 'pancingikan', title: 'Selesai Mancing!', sub: 'Hasil: ' + score + ' poin.', onRetry: exRetry(el, s, 'pancingikan') }); } }, 1000);

    function newFish() {
      currentFish = BG.pick(FISHES);
      phase = 'waiting'; fishX = -30; biteAt = frame + BG.rand(90, 200);
      msgEl.textContent = 'Menunggu ikan...';
    }
    function render() {
      ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#075985'; ctx.fillRect(0, H * 0.55, W, H * 0.45);
      /* dermaga */
      ctx.fillStyle = '#78350f'; ctx.fillRect(0, H * 0.5, W * 0.34, 14);
      /* joran */
      ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.5); ctx.lineTo(W * 0.52, H * 0.24); ctx.stroke();
      /* tali */
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W * 0.52, H * 0.24); ctx.lineTo(W * 0.52, H * 0.6); ctx.stroke();
      /* pelampung */
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(W * 0.52, H * 0.6 + Math.sin(frame / 18) * 3, 7, 0, Math.PI * 2); ctx.fill();
      /* ikan berenang */
      if (phase === 'waiting' || phase === 'bite') {
        if (fishX < W * 0.52 - 40) fishX += 1.6;
        ctx.font = '26px serif'; ctx.textAlign = 'center';
        ctx.fillText('🐟', fishX, H * 0.72);
        if (phase === 'waiting' && frame > biteAt && fishX > W * 0.52 - 60) {
          phase = 'bite'; msgEl.textContent = 'IKAN NYANGKUT! KETUK SEKARANG!'; msgEl.style.color = '#4ade80'; BG.sfx('pop');
        }
      }
      /* meter timing saat bite */
      if (phase === 'hooking') {
        meter += meterDir * 0.022; if (meter > 1 || meter < 0) meterDir *= -1;
        const zoneW = 0.3, zx = W / 2 - (W * zoneW) / 2, zy = H * 0.35;
        ctx.fillStyle = '#111827'; ctx.fillRect(W * 0.15, zy, W * 0.7, 22);
        ctx.fillStyle = '#166534'; ctx.fillRect(zx, zy, W * zoneW, 22);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(W * 0.15 + meter * W * 0.7 - 3, zy - 3, 6, 28);
        msgEl.textContent = 'Ketuk KAIT di ZONA HIJAU!';
      }
      timeEl.textContent = timeLeft + 's';
    }
    canvas.addEventListener('pointerdown', () => {
      if (over) return;
      if (phase === 'bite') { phase = 'hooking'; meter = 0; meterDir = 1; return; }
      if (phase === 'hooking') {
        const inZone = meter > 0.35 && meter < 0.65;
        if (inZone) {
          score += currentFish[1]; scoreEl.textContent = score; BG.sfx('coin');
          msgEl.textContent = 'Dapat ' + currentFish[0] + '! +' + currentFish[1]; msgEl.style.color = '#fbbf24';
        } else { BG.sfx('bad'); msgEl.textContent = 'Lepas! Ikan kabur...'; msgEl.style.color = '#fb7185'; }
        newFish();
      } else if (phase === 'waiting') { msgEl.textContent = 'Sabar... belum nyangkut!'; BG.sfx('click'); }
    });
    s.raf(() => { if (over) return; frame++; render(); });
    newFish();
    timeEl.textContent = timeLeft + 's';
  }
});

/* ============ DART BUG ============ */
BG.register({
  id: 'dartbug', name: 'Dart Bug', desc: 'Lempar panah ke papan!', cat: 'arcade', icon: 'dart', tags: 'dart panah lempar',
  start(el, s) {
    const W = 400, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'dt-score') + BG.hudPill('Panah', 'dt-left') + '</div><canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p id="dt-msg" style="text-align:center;font-weight:800;color:#ffd23f">Ketuk untuk mengunci arah, ketuk lagi untuk ketinggian!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#dt-score'), leftEl = el.querySelector('#dt-left'), msgEl = el.querySelector('#dt-msg');
    let darts = 5, score = 0, phase = 'h', aimX = 0, dirX = 1, aimY = 0, dirY = 1, over = false;
    const cx = W / 2, cy = H * 0.42, R = 105;

    s.on(canvas, 'pointerdown', () => {
      if (over) return;
      if (phase === 'h') { phase = 'v'; msgEl.textContent = 'Ketuk untuk ketinggian!'; return; }
      /* melempar! */
      const d = Math.hypot(aimX, aimY);
      const rings = [[18, 50], [40, 30], [62, 20], [84, 10], [105, 5]];
      let pts = 0;
      for (const [r, p] of rings) if (d <= r) { pts = p; break; }
      score += pts; scoreEl.textContent = score;
      msgEl.textContent = pts >= 30 ? 'KEREN! +' + pts : pts >= 10 ? 'Bagus +' + pts : 'Kurang tepat +' + pts;
      darts--; leftEl.textContent = darts;
      BG.sfx(pts >= 30 ? 'coin' : 'hit');
      if (darts <= 0) {
        over = true;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'dartbug', title: 'Selesai!', sub: 'Skor dart: ' + score, scoreLabel: score, onRetry: exRetry(el, s, 'dartbug') });
      } else { phase = 'h'; aimX = 0; dirX = 1; aimY = 0; dirY = 1; }
    });
    s.raf(() => {
      if (phase === 'h') { aimX += dirX * 2.1; if (aimX > R || aimX < -R) dirX *= -1; }
      else { aimY += dirY * 2.1; if (aimY > R || aimY < -R) dirY *= -1; }
      ctx.fillStyle = '#17102a'; ctx.fillRect(0, 0, W, H);
      const rings = [[R, '#f8fafc'], [84, '#ef4444'], [62, '#f8fafc'], [40, '#ef4444'], [18, '#fbbf24']];
      rings.forEach(([r, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#241239'; ctx.lineWidth = 2; ctx.stroke(); });
      ctx.strokeStyle = '#241239'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      /* bidikan */
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3.5; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.arc(cx + aimX, cy + aimY, 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(cx + aimX, cy + aimY, 3, 0, Math.PI * 2); ctx.fill();
    });
    leftEl.textContent = darts;
  }
});

/* ============ PANCO BUG ============ */
BG.register({
  id: 'pancobug', name: 'Panco Bug', desc: 'Adu kuat! Pencet secepat-cepatnya!', cat: 'arcade', icon: 'arm', tags: 'panco arm wrestle adu',
  start(el, s) {
    let bar = 0, over = false, timeLeft = 15, rounds = 0; const WIN_TARGET = 5;
    el.innerHTML = '<div class="panel center-col" style="max-width:420px;text-align:center"><div class="hud" style="width:100%">' + BG.hudPill('Menang', 'pc-wins') + BG.hudPill('Waktu', 'pc-time') + '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;justify-content:center;width:100%;margin:6px 0">' +
        '<span style="font-size:2rem">🐛</span>' +
        '<div id="pc-track" style="flex:1;height:26px;background:#241239;border:3px solid var(--ink);border-radius:999px;position:relative;overflow:hidden">' +
          '<div id="pc-fill" style="position:absolute;left:0;top:0;bottom:0;width:50%;background:linear-gradient(90deg,#4ade80,#22c55e)"></div>' +
        '</div>' +
        '<span style="font-size:2rem">🤖</span>' +
      '</div>' +
      '<button class="btn btn-lime btn-block" id="pc-mash" style="font-size:1.5rem;padding:20px">PANCET! 💪</button>' +
      '<p id="pc-msg" style="color:#d9c9f2;font-size:.82rem">Dorong sampai ujung kanan!</p></div>';
    const fillEl = el.querySelector('#pc-fill'), winsEl = el.querySelector('#pc-wins'), timeEl = el.querySelector('#pc-time'), mashBtn = el.querySelector('#pc-mash'), msgEl = el.querySelector('#pc-msg');
    let wins = 0;
    s.interval(() => { if (over) return; timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) finish(); }, 1000);
    s.interval(() => {
      if (over) return;
      bar = Math.min(100, Math.max(-100, bar + (bar > 0 ? -1.6 : 1.1) + (Math.random() - 0.5) * 2));
      updateBar();
    }, 50);
    function updateBar() { fillEl.style.width = (50 + bar / 2) + '%'; fillEl.style.background = bar >= 0 ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,#fb7185,#ef4444)'; }
    mashBtn.addEventListener('pointerdown', () => {
      if (over) return;
      bar = Math.min(100, bar + 7.5);
      BG.sfx('click'); updateBar();
      if (bar >= 100) {
        wins++; winsEl.textContent = wins; BG.sfx('coin');
        bar = 0; updateBar();
        msgEl.textContent = 'Menang ronde! Streak hattrick: ' + wins;
        if (wins >= WIN_TARGET) { over = true; finish(); }
      }
    });
    function finish() {
      over = true;
      BG.endScreen(el.querySelector('.panel').parentElement, { score: wins * 100, bestKey: 'pancobug', win: wins > 0, title: wins >= WIN_TARGET ? 'JUARA PANCET!' : 'Waktu Habis!', sub: 'Ronde dimenangkan: ' + wins, scoreLabel: wins + ' ronde', onRetry: exRetry(el, s, 'pancobug') });
    }
    timeEl.textContent = timeLeft + 's'; winsEl.textContent = wins;
  }
});

/* ============ KIPER BUG ============ */
BG.register({
  id: 'kiperbug', name: 'Kiper Bug', desc: 'Selamatkan gawang 5 tendangan!', cat: 'arcade', icon: 'goal', tags: 'kiper goalkeeper penyelamat',
  start(el, s) {
    const W = 400, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Selamat', 'kp-saves') + BG.hudPill('Sisa', 'kp-left') + '</div><canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="racer-controls" style="max-width:420px">' +
        '<button class="rc-btn" data-d="0" style="font-size:1.3rem">⬅</button>' +
        '<button class="rc-btn" data-d="1" style="font-size:1.3rem">▲</button>' +
        '<button class="rc-btn" data-d="2" style="font-size:1.3rem">➡</button>' +
      '</div>' +
      '<p id="kp-msg" style="text-align:center;font-weight:800;color:#ffd23f;min-height:1.3em">Penendang siap... kamu belum tahu arahnya!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const savesEl = el.querySelector('#kp-saves'), leftEl = el.querySelector('#kp-left'), msgEl = el.querySelector('#kp-msg');
    let saves = 0, shots = 5, over = false, phase = 'aim', ball = null, kickerLane = 1, diveLane = 1, ballX = W / 2;

    function nextShot() {
      phase = 'aim'; kickerLane = BG.rand(0, 2);
      ball = { x: W / 2, y: H - 40, vy: 0, vx: 0 };
      msgEl.textContent = 'Penendang siap... tebak arah!';
    }
    function dive(lane) {
      if (phase !== 'aim' || over) return;
      diveLane = lane; phase = 'fly';
      const targetX = [W * 0.2, W * 0.5, W * 0.8][kickerLane];
      ball.vx = (targetX - W / 2) / 38; ball.vy = -7.2;
      msgEl.textContent = kickerLane === lane ? 'SELAMA...T!' : 'GOL...';
    }
    el.querySelectorAll('[data-d]').forEach(btn => btn.addEventListener('pointerdown', e => { e.preventDefault(); dive(+btn.dataset.d); }));
    s.raf(() => {
      if (over) return;
      if (phase === 'fly' && ball) {
        ball.vy += 0.16; ball.x += ball.vx; ball.y += ball.vy;
        if (ball.y < H * 0.38) {
          /* bola mencapai gawang */
          if (diveLane === kickerLane) { saves++; savesEl.textContent = saves; msgEl.textContent = 'SELAMA...T! ⬅⬆➡'; BG.sfx('coin'); } else { msgEl.textContent = 'GOL!'; BG.sfx('bad'); }
          shots--; leftEl.textContent = shots;
          if (shots <= 0) {
            over = true;
            BG.endScreen(canvas.parentElement, { score: saves * 100, bestKey: 'kiperbug', win: saves >= 3, title: saves >= 3 ? 'Kiper Hebat!' : 'Kebobolan!', sub: 'Penyelamatan: ' + saves + ' dari 5 tendangan.', scoreLabel: saves + '/5', onRetry: exRetry(el, s, 'kiperbug') });
          } else nextShot();
        }
      }
      /* gambar */
      ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, W, H);
      /* gawang */
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 6;
      ctx.strokeRect(W * 0.08, H * 0.3, W * 0.84, H * 0.42);
      ctx.lineWidth = 1.4; ctx.globalAlpha = .55;
      for (let x = W * 0.08; x < W * 0.92; x += 22) { ctx.beginPath(); ctx.moveTo(x, H * 0.3); ctx.lineTo(x, H * 0.72); ctx.stroke(); }
      ctx.globalAlpha = 1;
      /* penendang */
      ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(W / 2, H - 34, 16, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      /* kiper (bug) */
      const diveX = [W * 0.2, W * 0.5, W * 0.8][phase === 'fly' ? diveLane : 1];
      drawMiniBug(ctx, diveX, H * 0.52, 19, '#b9f542');
      /* bola */
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(ball ? ball.x : W / 2, ball ? ball.y : H - 44, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    savesEl.textContent = saves; leftEl.textContent = shots;
    nextShot();
  }
});
