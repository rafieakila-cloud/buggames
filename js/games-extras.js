/* Buggames — Game EKSTRA (bagian 1/3) */
'use strict';

function exRetry(el, s, id) { return () => { el.innerHTML = ''; BG.games.find(g => g.id === id).start(el, s); }; }

/* ============ SOKOBAN ============ */
BG.register({
  id: 'sokoban', name: 'Sokoban', desc: 'Dorong kotak ke target!', cat: 'puzzle', icon: 'box', tags: 'sokoban dorong kotak puzzle',
  start(el, s) {
    const LEVELS = [
      ['########', '#  .   #', '#  $   #', '#  @   #', '########'],
      ['#########', '#       #', '# $ .   #', '# @     #', '#########'],
      ['#########', '# .   . #', '# $   $ #', '#   @   #', '#########'],
    ];
    let level = 0, grid = [], px = 1, py = 1, moves = 0, over = false;
    el.innerHTML = '<div class="panel center-col" style="max-width:380px"><div class="hud" style="width:100%">' + BG.hudPill('Level', 'sk-level') + BG.hudPill('Langkah', 'sk-moves') + '</div>' +
      '<div class="board" id="sk-board" style="grid-template-columns:repeat(9,40px);grid-auto-rows:40px;gap:3px"></div>' +
      '<p style="text-align:center;font-size:.8rem;color:#d9c9f2">Dorong kotak 🟧 ke titik hijau!</p></div>';
    const boardEl = el.querySelector('#sk-board'), levelEl = el.querySelector('#sk-level'), movesEl = el.querySelector('#sk-moves');
    function load(lv) {
      level = lv; moves = 0;
      grid = LEVELS[lv].map(r => r.split(''));
      for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) if (grid[r][c] === '@') { px = c; py = r; grid[r][c] = ' '; }
      render();
    }
    function render() {
      levelEl.textContent = (level + 1) + '/3'; movesEl.textContent = moves;
      let html = '';
      for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) {
        const v = grid[r][c];
        let bg = '#1b0f2e', content = '';
        if (v === '#') bg = '#4b5563';
        else if (v === '.') { content = '<div style="width:14px;height:14px;border-radius:50%;background:#4ade80"></div>'; }
        else if (v === '$') { content = '<div style="width:24px;height:24px;background:#fb923c;border:3px solid #241239;border-radius:5px"></div>'; }
        if (c === px && r === py) content = '<div style="font-size:1.3rem">🐛</div>';
        html += '<div class="cell" style="background:' + bg + ';border:none">' + content + '</div>';
      }
      boardEl.innerHTML = html;
    }
    function tryMove(dx, dy) {
      if (over) return;
      const nx = px + dx, ny = py + dy;
      if (grid[ny] && grid[ny][nx] === '#') return;
      const target = grid[ny] && grid[ny][nx];
      if (target === '$') {
        const bx = nx + dx, by = ny + dy;
        if (!grid[by] || grid[by][bx] === '#' || grid[by][bx] === '$') return;
        grid[by][bx] = '$'; grid[ny][nx] = ' ';
      }
      px = nx; py = ny; moves++; BG.sfx('click'); render();
      if (grid.every(row => row.every(cell => cell !== '.'))) {
        /* semua goal tertutup (kotak di atas goal) */
        const goalsLeft = grid.flat().filter(v => v === '.').length;
        if (goalsLeft === 0) {
          if (level + 1 < LEVELS.length) { BG.sfx('win'); load(level + 1); }
          else {
            over = true;
            BG.endScreen(el.querySelector('.panel').parentElement, { score: Math.max(10, 1000 - moves * 10), bestKey: 'sokoban', title: 'Sokoban Legend!', sub: 'Semua level selesai dalam ' + moves + ' langkah!', scoreLabel: 'Selesai!', onRetry: exRetry(el, s, 'sokoban') });
          }
        }
      }
    }
    boardEl.style.gridTemplateColumns = 'repeat(9,40px)';
    s.on(window, 'keydown', e => { const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }; const d = m[e.key]; if (d) { e.preventDefault(); tryMove(d[0], d[1]); } });
    el.querySelector('.panel').insertAdjacentHTML('beforeend', '<div class="dpad"><span></span><button data-d="up">▲</button><span></span><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button></div>');
    el.querySelectorAll('.dpad button').forEach(b => b.addEventListener('click', () => { const d = b.dataset.d; tryMove(d === 'right' ? 1 : d === 'left' ? -1 : 0, d === 'down' ? 1 : d === 'up' ? -1 : 0); }));
    load(0);
  }
});

/* ============ MASTERMIND ============ */
BG.register({
  id: 'mastermind', name: 'Mastermind', desc: 'Tebak kode 4 warna!', cat: 'puzzle', icon: 'code', tags: 'mastermind kode warna',
  start(el, s) {
    const COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a78bfa'];
    const code = Array.from({ length: 4 }, () => BG.rand(0, 5));
    let guesses = [], current = [], over = false; const MAX = 8;
    el.innerHTML = '<div class="panel center-col" style="max-width:420px"><h3>Pecahkan Kode 4 Warna!</h3>' +
      '<div id="mm-rows" style="display:flex;flex-direction:column;gap:6px"></div>' +
      '<div id="mm-cur" style="display:flex;gap:8px;margin:6px 0;padding:8px;background:#241239;border-radius:12px"></div>' +
      '<div id="mm-colors" style="display:flex;gap:8px"></div>' +
      '<button class="btn btn-lime" id="mm-check" style="padding:8px 26px">CEK</button></div>';
    const rowsEl = el.querySelector('#mm-rows'), curEl = el.querySelector('#mm-cur'), colorsEl = el.querySelector('#mm-colors');
    colorsEl.innerHTML = COLORS.map((c, i) => '<button class="cell" data-c="' + i + '" style="width:42px;height:42px;background:' + c + ';border-radius:50%"></button>').join('');
    function render() {
      rowsEl.innerHTML = guesses.map(g =>
        '<div style="display:flex;gap:8px;align-items:center">' +
        g.pick.map(p => '<div style="width:34px;height:34px;border-radius:50%;background:' + COLORS[p] + ';border:2px solid #241239"></div>').join('') +
        '<div style="display:flex;gap:3px;margin-left:8px;flex-wrap:wrap;width:60px">' + g.fb.map(f => '<div style="width:12px;height:12px;border-radius:50%;background:' + (f === 2 ? '#111' : f === 1 ? '#f8fafc' : '#4b5563') + '"></div>').join('') + '</div></div>'
      ).join('');
      curEl.innerHTML = current.concat(Array(4 - current.length).fill(-1)).map(c => '<div style="width:38px;height:38px;border-radius:50%;background:' + (c >= 0 ? COLORS[c] : '#3a2054') + ';border:3px solid #241239"></div>').join('');
    }
    colorsEl.addEventListener('click', e => { const btn = e.target.closest('[data-c]'); if (!btn || current.length >= 4 || over) return; current.push(+btn.dataset.c); BG.sfx('click'); render(); });
    el.querySelector('#mm-check').addEventListener('click', () => {
      if (current.length < 4 || over) { BG.sfx('bad'); return; }
      /* feedback */
      const fb = Array(4).fill(0); const codeLeft = code.slice(), pickLeft = current.slice();
      for (let i = 0; i < 4; i++) if (pickLeft[i] === codeLeft[i]) { fb[i] = 2; codeLeft[i] = -1; pickLeft[i] = -1; }
      for (let i = 0; i < 4; i++) { if (pickLeft[i] < 0) continue; const j = codeLeft.indexOf(pickLeft[i]); if (j >= 0) { fb[i] = 1; codeLeft[j] = -1; } }
      guesses.push({ pick: current.slice(), fb });
      current = [];
      const wins = fb.every(f => f === 2);
      render();
      if (wins) {
        over = true; BG.sfx('win');
        BG.endScreen(el.querySelector('.panel').parentElement, { score: (MAX - guesses.length + 1) * 100, bestKey: 'mastermind', title: 'Jenius!', sub: 'Kode pecah dalam ' + guesses.length + ' tebakan!', scoreLabel: guesses.length + ' tebakan', onRetry: exRetry(el, s, 'mastermind') });
      } else if (guesses.length >= MAX) {
        over = true; BG.sfx('lose');
        BG.endScreen(el.querySelector('.panel').parentElement, { score: 0, bestKey: 'mastermind', win: false, title: 'Kode Aman!', sub: 'Kode-nya: ' + code.map(c => '●').join(''), scoreLabel: 'Gagal', onRetry: exRetry(el, s, 'mastermind') });
      } else BG.sfx('pop');
    });
    render();
  }
});

/* ============ BINGO BUG ============ */
BG.register({
  id: 'bingo', name: 'Bingo Bug', desc: 'Lengkapi baris lebih dulu!', cat: 'kuis', icon: 'cards', tags: 'bingo kartu angka',
  start(el, s) {
    const N = 24;
    function makeCard() {
      const pool = BG.shuffle(Array.from({ length: 75 }, (_, i) => i + 1));
      return pool.slice(0, N);
    }
    const player = makeCard(), ai = makeCard();
    const playerMask = Array(N).fill(false), aiMask = Array(N).fill(false);
    let called = [], over = false, timer = null;
    el.innerHTML = '<div class="panel center-col" style="max-width:440px"><div class="hud" style="width:100%">' + BG.hudPill('Dipanggil', 'bg-count') + '</div>' +
      '<div style="display:flex;gap:14px;justify-content:center;width:100%">' +
        '<div><h4 style="text-align:center;color:#4ade80;margin-bottom:6px">KAMU</h4><div class="board" id="bg-you" style="grid-template-columns:repeat(5,44px);grid-auto-rows:44px;gap:3px"></div></div>' +
        '<div><h4 style="text-align:center;color:#ff6b9d;margin-bottom:6px">BUGGY</h4><div class="board" id="bg-ai" style="grid-template-columns:repeat(5,44px);grid-auto-rows:44px;gap:3px"></div></div>' +
      '</div>' +
      '<p id="bg-last" style="text-align:center;font-size:2rem;font-weight:900;color:#fbbf24">–</p>' +
      '<button class="btn btn-lime" id="bg-next">Panggil Angka</button></div>';
    const youEl = el.querySelector('#bg-you'), aiEl = el.querySelector('#bg-ai'), lastEl = el.querySelector('#bg-last'), countEl = el.querySelector('#bg-count');
    const calledSet = new Set();
    function lineDone(mask) {
      const lines = [];
      for (let r = 0; r < 5; r++) { const row = [0,1,2,3,4].map(c => r * 5 + c); if (row.every(i => mask[i])) lines.push(row); }
      for (let c = 0; c < 5; c++) { const col = [0,1,2,3,4].map(r => r * 5 + c); if (col.every(i => mask[i])) lines.push(col); }
      if ([0,6,12,18,24].every(i => mask[i])) lines.push('d1');
      if ([4,8,12,16,20].every(i => mask[i])) lines.push('d2');
      return lines.length > 0;
    }
    function render() {
      countEl.textContent = called.length + '/75';
      youEl.innerHTML = player.map((n, i) => '<button class="cell" data-i="' + i + '" style="font-size:.85rem;background:' + (playerMask[i] ? '#166534' : '#3a2054') + '">' + n + '</button>').join('');
      aiEl.innerHTML = ai.map((n, i) => '<div class="cell" style="font-size:.85rem;background:' + (aiMask[i] ? '#7f1d1d' : '#3a2054') + ';border-color:#241239">' + n + '</div>').join('');
    }
    function callNumber() {
      if (over) return;
      const remaining = []; for (let n = 1; n <= 75; n++) if (!calledSet.has(n)) remaining.push(n);
      if (!remaining.length) return;
      const n = BG.pick(remaining); calledSet.add(n); called.push(n);
      lastEl.textContent = n;
      player.forEach((v, i) => { if (v === n) playerMask[i] = true; });
      ai.forEach((v, i) => { if (v === n) aiMask[i] = true; });
      BG.sfx('pop'); render();
      if (lineDone(aiMask) && !lineDone(playerMask)) return finish(false);
      if (lineDone(playerMask) && !lineDone(aiMask)) return finish(true);
      if (lineDone(playerMask) && lineDone(aiMask)) return finish(true);
    }
    function finish(win) {
      over = true; clearInterval(timer);
      BG.endScreen(el.querySelector('.panel').parentElement, { score: win ? 500 : 0, bestKey: 'bingo', win, title: win ? 'BINGO!' : 'Buggy Menang!', sub: win ? 'Kartu lengkap lebih dulu!' : 'Buggy lebih dulu selesai.', scoreLabel: win ? 'Menang' : 'Kalah', onRetry: exRetry(el, s, 'bingo') });
    }
    el.querySelector('#bg-next').addEventListener('click', callNumber);
    youEl.addEventListener('click', e => { const cell = e.target.closest('.cell'); if (!cell || over) return; const i = +cell.dataset.i; if (calledSet.has(player[i])) { playerMask[i] = !playerMask[i]; BG.sfx('click'); render(); if (lineDone(playerMask)) finish(true); } });
    timer = s.interval(callNumber, 1600);
    render();
  }
});

/* ============ SLOT SPIN ============ */
BG.register({
  id: 'slotspin', name: 'Slot Spin', desc: 'Putar slot, kejar jackpot!', cat: 'kuis', icon: 'slot', tags: 'slot casino jackpot',
  start(el, s) {
    const SYMS = ['🍒', '🍋', '⭐', '🐞', '🍀', '🔔'];
    let balance = 100, spins = 0, over = false, spinning = false;
    el.innerHTML = '<div class="panel center-col" style="max-width:380px;text-align:center"><div style="font-size:.8rem;letter-spacing:2px;color:#b8a6d9">SALDO COIN</div>' +
      '<div id="sl-balance" style="font-size:2rem;font-weight:900;color:#fbbf24">100</div>' +
      '<div id="sl-reels" style="font-size:4rem;letter-spacing:.15em;background:#241239;border-radius:16px;padding:8px 18px;border:3px solid var(--ink)">🍒🍋⭐</div>' +
      '<p id="sl-msg" style="min-height:1.4em;font-weight:800;color:#4ade80">Taruh 10 coin per putaran!</p>' +
      '<button class="btn btn-lime btn-block" id="sl-spin">PUTAR (-10)</button></div>';
    const balEl = el.querySelector('#sl-balance'), reelsEl = el.querySelector('#sl-reels'), msgEl = el.querySelector('#sl-msg'), spinBtn = el.querySelector('#sl-spin');
    function render() { balEl.textContent = balance; }
    spinBtn.addEventListener('click', () => {
      if (spinning || over || balance < 10) { if (balance < 10 && !over) finish(); return; }
      spinning = true; balance -= 10; spins++; render(); msgEl.textContent = '';
      spinBtn.disabled = true;
      let ticks = 0;
      const iv = setInterval(() => {
        reelsEl.textContent = BG.shuffle(SYMS).slice(0, 3).join('');
        ticks++;
        if (ticks >= 12) {
          clearInterval(iv);
          const r = [BG.pick(SYMS), BG.pick(SYMS), BG.pick(SYMS)];
          reelsEl.textContent = r.join('');
          const wins = r[0] === r[1] && r[1] === r[2] ? 200 : (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) ? 30 : 0;
          balance += wins; render();
          msgEl.textContent = wins === 200 ? 'JACKPOT! +200!' : wins === 30 ? 'Menang kecil! +30' : 'Zonk...';
          msgEl.style.color = wins > 0 ? '#4ade80' : '#fb7185';
          BG.sfx(wins > 0 ? 'coin' : 'bad');
          spinning = false; spinBtn.disabled = false;
          if (balance >= 500 || balance <= 0) finish();
        }
      }, 70);
    });
    function finish() {
      over = true;
      BG.endScreen(el.querySelector('.panel').parentElement, { score: balance, bestKey: 'slotspin', title: balance >= 500 ? 'Sultan Slot!' : 'Bangkrut!', sub: 'Sisa saldo: ' + balance + ' coin. Total putaran: ' + spins, scoreLabel: balance, onRetry: exRetry(el, s, 'slotspin') });
    }
    render();
  }
});

/* ============ RODA HOKI ============ */
BG.register({
  id: 'rodhoki', name: 'Roda Hoki', desc: 'Putar roda, menangkan hadiah!', cat: 'kuis', icon: 'wheel', tags: 'roda hoki wheel spin',
  start(el, s) {
    const SEGMENTS = [10, 50, 100, 200, 500, 50, 100, 0];
    const COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a78bfa', '#f472b6', '#475569'];
    let spins = 5, earned = 0, spinning = false, angle = 0, over = false;
    el.innerHTML = '<div class="panel center-col" style="max-width:400px;text-align:center"><div class="hud" style="width:100%">' + BG.hudPill('Sisa Putaran', 'rh-spins') + BG.hudPill('Koin', 'rh-earned') + '</div>' +
      '<canvas id="rh-canvas" width="300" height="300" style="max-width:280px"></canvas>' +
      '<button class="btn btn-lime btn-block" id="rh-spin">PUTAR!</button></div>';
    const canvas = el.querySelector('#rh-canvas'), ctx = canvas.getContext('2d');
    const spinsEl = el.querySelector('#rh-spins'), earnedEl = el.querySelector('#rh-earned'), spinBtn = el.querySelector('#rh-spin');
    function draw() {
      const cx = 150, cy = 150, R = 138;
      ctx.clearRect(0, 0, 300, 300);
      for (let i = 0; i < 8; i++) {
        const a0 = angle + i * Math.PI / 4, a1 = a0 + Math.PI / 4;
        ctx.fillStyle = COLORS[i]; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a0 + Math.PI / 8); ctx.fillStyle = '#fff'; ctx.font = '900 15px Trebuchet MS'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(SEGMENTS[i], R - 12, 0); ctx.restore();
      }
      ctx.fillStyle = '#241239'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
      /* penunjuk */
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(150, 2); ctx.lineTo(138, 26); ctx.lineTo(162, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    spinBtn.addEventListener('click', () => {
      if (spinning || spins <= 0 || over) return;
      spinning = true; spins--; spinsEl.textContent = spins; spinBtn.disabled = true;
      const target = angle + Math.PI * 6 + Math.random() * Math.PI * 2;
      const start = angle, dur = 2200, t0 = performance.now();
      function frame(now) {
        const p = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        angle = start + (target - start) * ease;
        draw();
        if (p < 1) { requestAnimationFrame(frame); return; }
        /* hitung segmen yang ditunjuk */
        const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(((Math.PI * 1.5 - norm) + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 4)) % 8;
        const prize = SEGMENTS[idx];
        earned += prize; earnedEl.textContent = earned;
        BG.sfx(prize > 100 ? 'win' : 'coin');
        spinning = false; spinBtn.disabled = false;
        if (spins <= 0) {
          over = true;
          BG.endScreen(el.querySelector('.panel').parentElement, { score: earned, bestKey: 'rodhoki', title: 'Selesai!', sub: 'Total koin dari 5 putaran: ' + earned, scoreLabel: earned + ' koin', onRetry: exRetry(el, s, 'rodhoki') });
        }
      }
      requestAnimationFrame(frame);
    });
    spinsEl.textContent = spins; draw();
  }
});
