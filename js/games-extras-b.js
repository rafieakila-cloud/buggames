/* Buggames — Game EKSTRA (bagian 2/3) */
'use strict';

function exRetry(el, s, id) { return () => { el.innerHTML = ''; BG.games.find(g => g.id === id).start(el, s); }; }

/* ============ TEBAK HARGA ============ */
BG.register({
  id: 'tebakharga', name: 'Tebak Harga', desc: 'Kira-kira berapa harganya?', cat: 'kuis', icon: 'tag', tags: 'tebak harga belanja quiz',
  start(el, s) {
    const ITEMS = [
      ['1 kg cabai merah keriting', 45000], ['1 ekor ayam kampung', 55000], ['1 kg telur ayam negeri', 26000], ['1 liter minyak goreng', 16000],
      ['1 kg gula pasir', 15000], ['1 bungkus mie goreng instan', 3500], ['1 loyang martabak manis', 85000], ['1 gelas kopi kekinian', 18000],
      ['1 pair sepatu lari branded', 850000], ['1 unit motor bebek baru', 19000000], ['1 kg daging sapi has dalam', 130000], ['1 buah semangka besar', 35000],
    ];
    const questions = BG.shuffle(ITEMS).slice(0, 8);
    let idx = 0, score = 0, over = false;
    el.innerHTML = '<div class="panel center-col" style="max-width:440px"><div class="hud" style="width:100%">' + BG.hudPill('Skor', 'th-score') + '<div class="hud-pill">Soal <b id="th-num">1</b>/8</div></div>' +
      '<div class="big-question" id="th-q" style="font-size:1.2rem"></div><div class="choices" id="th-choices"></div></div>';
    const scoreEl = el.querySelector('#th-score'), numEl = el.querySelector('#th-num'), qEl = el.querySelector('#th-q'), choicesEl = el.querySelector('#th-choices');
    function rp(n) { return 'Rp ' + n.toLocaleString('id-ID'); }
    function render() {
      const [item, price] = questions[idx];
      numEl.textContent = idx + 1; qEl.textContent = 'Berapa harga ' + item + '?';
      const opts = new Set([price]);
      while (opts.size < 4) opts.add(Math.round(price * (0.55 + Math.random() * 1.6) / 500) * 500);
      choicesEl.innerHTML = BG.shuffle([...opts]).map(v => '<button class="choice-btn" data-v="' + v + '" style="font-size:.85rem">' + rp(v) + '</button>').join('');
    }
    choicesEl.addEventListener('click', e => {
      const btn = e.target.closest('.choice-btn'); if (!btn || over) return;
      const correct = questions[idx][1];
      if (+btn.dataset.v === correct) { score += 10; BG.sfx('good'); btn.classList.add('correct'); } else { BG.sfx('bad'); btn.classList.add('wrong'); }
      scoreEl.textContent = score; over = true;
      s.timeout(() => { over = false; idx++; if (idx >= questions.length) BG.endScreen(el.querySelector('.panel').parentElement, { score, bestKey: 'tebakharga', title: 'Selesai!', sub: 'Kamu jago nebak harga: ' + score + ' poin.', onRetry: exRetry(el, s, 'tebakharga') }); else render(); }, 700);
    });
    render();
  }
});

/* ============ REVERSI ============ */
BG.register({
  id: 'reversi', name: 'Reversi 6x6', desc: 'Klaim wilayah! Lawan Buggy.', cat: 'puzzle', icon: 'cards', tags: 'reversi othello papan',
  start(el, s) {
    const N = 6;
    el.innerHTML = '<div class="panel center-col" style="max-width:360px"><h3>Reversi 6×6</h3>' +
      '<div class="board" id="rv-board" style="grid-template-columns:repeat(6,52px);grid-auto-rows:52px;gap:4px;background:#166534;padding:6px;border-radius:10px"></div>' +
      '<p id="rv-status" style="text-align:center;font-weight:800;color:#ffd23f">Kamu = ⚫ vs Buggy = ⚪</p></div>';
    const boardEl = el.querySelector('#rv-board'), status = el.querySelector('#rv-status');
    let grid = Array.from({ length: N }, () => Array(N).fill(0));
    grid[2][2] = 2; grid[3][3] = 2; grid[2][3] = 1; grid[3][2] = 1; /* 1 kamu, 2 ai */
    let over = false, turn = 1;
    const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    function flips(g, r, c, mark) {
      const opp = mark === 1 ? 2 : 1;
      let out = [];
      for (const [dr, dc] of DIRS) {
        const line = [];
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < N && cc >= 0 && cc < N && g[rr][cc] === opp) { line.push([rr, cc]); rr += dr; cc += dc; }
        if (rr >= 0 && rr < N && cc >= 0 && cc < N && g[rr][cc] === mark && line.length) out = out.concat(line);
      }
      return out;
    }
    function legalMoves(g, mark) {
      const moves = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c] && flips(g, r, c, mark).length) moves.push([r, c, flips(g, r, c, mark).length]);
      return moves;
    }
    function render() {
      boardEl.innerHTML = grid.map((row, r) => row.map((v, c) =>
        '<button class="cell" data-r="' + r + '" data-c="' + c + '" style="border:none;background:#22c55e;border-radius:6px;font-size:1.4rem">' + (v === 1 ? '⚫' : v === 2 ? '⚪' : '') + '</button>'
      ).join('')).join('');
    }
    function applyMove(g, r, c, mark) {
      const fl = flips(g, r, c, mark);
      g[r][c] = mark; fl.forEach(([rr, cc]) => { g[rr][cc] = mark; });
      return fl.length;
    }
    function count(g) { return [g.flat().filter(v => v === 1).length, g.flat().filter(v => v === 2).length]; }
    function endCheck() {
      const youMoves = legalMoves(grid, 1), aiMoves = legalMoves(grid, 2);
      if (youMoves.length === 0 && aiMoves.length === 0) {
        over = true;
        const [y, a] = count(grid);
        const win = y > a;
        BG.endScreen(el.querySelector('.panel').parentElement, { score: y * 10, bestKey: 'reversi', win, title: y === a ? 'Seri!' : win ? 'Kamu Menang!' : 'Buggy Menang!', sub: 'Pion kamu ' + y + ' — ' + a + ' Buggy.', scoreLabel: y + ' - ' + a, onRetry: exRetry(el, s, 'reversi') });
        return true;
      }
      return false;
    }
    boardEl.addEventListener('click', e => {
      const cell = e.target.closest('[data-r]'); if (!cell || over || turn !== 1) return;
      const r = +cell.dataset.r, c = +cell.dataset.c;
      if (grid[r][c]) return;
      const fl = flips(grid, r, c, 1);
      if (!fl.length) { BG.sfx('bad'); return; }
      applyMove(grid, r, c, 1); BG.sfx('pop'); turn = 2; render();
      if (endCheck()) return;
      status.textContent = 'Buggy mikir...';
      s.timeout(aiTurn, 550);
    });
    function aiTurn() {
      if (over) return;
      const moves = legalMoves(grid, 2);
      if (!moves.length) { turn = 1; status.textContent = 'Buggy pass. Giliranmu!'; return; }
      moves.sort((a, b) => b[2] - a[2]);
      const cornerMoves = moves.filter(([r, c]) => (r === 0 || r === N - 1) && (c === 0 || c === N - 1));
      const pick = cornerMoves.length ? cornerMoves[0] : moves[0];
      applyMove(grid, pick[0], pick[1], 2); BG.sfx('click'); turn = 1; render();
      if (endCheck()) return;
      status.textContent = 'Giliranmu!';
    }
    render();
  }
});

/* ============ FRUIT SLICER ============ */
BG.register({
  id: 'fruitslicer', name: 'Fruit Slicer', desc: 'Tebas buah! Jangan tebas bom!', cat: 'arcade', icon: 'fruit', tags: 'fruit slicer tebas swipe',
  start(el, s) {
    const W = 440, H = 380;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Skor', 'fs-score') + BG.hudPill('Waktu', 'fs-time') + '</div><canvas width="' + W + '" height="' + H + '"></canvas></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#fs-score'), timeEl = el.querySelector('#fs-time');
    let score = 0, timeLeft = 40, over = false, frame = 0;
    const FRUITS = [{ e: '🍎', v: 10 }, { e: '🍉', v: 15 }, { e: '🍌', v: 10 }, { e: '🍇', v: 15 }, { e: '⭐', v: 40 }];
    const items = [];
    let trail = [];

    s.interval(() => { if (over) return; timeLeft--; timeEl.textContent = timeLeft + 's'; if (timeLeft <= 0) { over = true; BG.endScreen(canvas.parentElement, { score, bestKey: 'fruitslicer', title: 'Waktu Habis!', sub: 'Tebasan: ' + score + ' poin.', onRetry: exRetry(el, s, 'fruitslicer') }); } }, 1000);

    function spawn() { const f = BG.pick(FRUITS); items.push({ x: BG.rand(40, W - 40), y: H + 20, vx: (Math.random() - 0.5) * 2.4, vy: -(7 + Math.random() * 3.5), r: 20, bomb: Math.random() < 0.14, ...f }); }
    canvas.addEventListener('pointermove', e => { const p = BG.canvasPos(canvas, e); trail.push({ x: p.x, y: p.y, t: Date.now() }); if (trail.length > 14) trail.shift(); sliceAt(p); });
    canvas.addEventListener('pointerdown', e => { const p = BG.canvasPos(canvas, e); trail.push({ x: p.x, y: p.y, t: Date.now() }); sliceAt(p); });
    function sliceAt(p) {
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (Math.hypot(p.x - it.x, p.y - it.y) < it.r + 6) {
          if (it.bomb) { over = true; BG.sfx('bad'); BG.endScreen(canvas.parentElement, { score, bestKey: 'fruitslicer', win: false, title: 'BOOM!', sub: 'Kamu menebas bom! Skor: ' + score, onRetry: exRetry(el, s, 'fruitslicer') }); return; }
          score += it.v; scoreEl.textContent = score; BG.sfx(it.v >= 40 ? 'coin' : 'pop');
          items.splice(i, 1);
        }
      }
    }
    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 30 === 0) spawn();
      items.forEach(it => { it.vy += 0.18; it.x += it.vx; it.y += it.vy; });
      for (let i = items.length - 1; i >= 0; i--) if (items[i].y > H + 40) items.splice(i, 1);
      ctx.fillStyle = '#0c2a4a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.1)';
      [[60, 80], [200, 40], [350, 110]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill(); });
      items.forEach(it => { ctx.font = (it.bomb ? 30 : 34) + 'px serif'; ctx.textAlign = 'center'; ctx.fillText(it.bomb ? '💣' : it.e, it.x, it.y); });
      /* jejak tebasan */
      if (trail.length > 1) {
        ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.shadowColor = '#7dd3fc'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y); trail.forEach(t => ctx.lineTo(t.x, t.y)); ctx.stroke(); ctx.shadowBlur = 0;
      }
    });
    timeEl.textContent = timeLeft + 's';
  }
});

/* ============ KETAPEL BUG ============ */
BG.register({
  id: 'ketapel', name: 'Ketapel Bug', desc: 'Tembak tumpukan kotak!', cat: 'arcade', icon: 'sling', tags: 'ketapel sling bowling',
  start(el, s) {
    const W = 560, H = 360;
    el.innerHTML = '<div class="stage"><div class="hud">' + BG.hudPill('Sisa Tembakan', 'kt-shots') + BG.hudPill('Kotak', 'kt-left') + '</div><canvas width="' + W + '" height="' + H + '"></canvas>' +
      '<p id="kt-msg" style="text-align:center;font-weight:800;color:#ffd23f">Seret dari Buggy, lepas untuk menembak!</p></div>';
    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const shotsEl = el.querySelector('#kt-shots'), leftEl = el.querySelector('#kt-left'), msgEl = el.querySelector('#kt-msg');
    let shots = 6, boxes = [], ball = null, drag = null, over = false, level = 1;
    function buildLevel(lv) {
      boxes = [];
      const baseX = 380, baseY = H - 46;
      const layouts = [
        [[0, 0], [0, -34], [0, -68], [38, 0], [38, -34], [76, 0]],
        [[0, 0], [0, -34], [0, -68], [38, 0], [38, -34], [38, -68], [76, 0], [76, -34]],
        [[0, 0], [0, -34], [0, -68], [0, -102], [38, 0], [38, -34], [76, 0], [114, 0], [38, -68]],
      ];
      layouts[lv - 1].forEach(([ox, oy]) => boxes.push({ x: baseX + ox, y: baseY + oy - 30, w: 34, h: 32, alive: true }));
      leftEl.textContent = boxes.length;
    }
    buildLevel(1);
    const anchor = { x: 90, y: H - 110 };

    function fire(vx, vy) { ball = { x: anchor.x, y: anchor.y, vx, vy }; BG.sfx('shoot'); }
    s.on(canvas, 'pointerdown', e => {
      if (over || ball) return;
      const p = BG.canvasPos(canvas, e);
      if (Math.hypot(p.x - anchor.x, p.y - anchor.y) < 50) drag = { x: p.x, y: p.y };
    });
    s.on(canvas, 'pointermove', e => { if (drag) drag.cur = BG.canvasPos(canvas, e); });
    s.on(canvas, 'pointerup', () => {
      if (!drag || !drag.cur || over) { drag = null; return; }
      const dx = anchor.x - drag.cur.x, dy = anchor.y - drag.cur.y;
      const power = Math.min(15, Math.hypot(dx, dy) / 9);
      const ang = Math.atan2(dy, dx);
      fire(Math.cos(ang) * power, Math.sin(ang) * power - 1.2);
      shots--; shotsEl.textContent = shots;
      drag = null;
    });
    s.raf(() => {
      if (over) return;
      if (ball) {
        ball.vy += 0.32; ball.x += ball.vx; ball.y += ball.vy;
        for (const b of boxes) {
          if (!b.alive) continue;
          if (ball.x + 7 > b.x && ball.x - 7 < b.x + b.w && ball.y + 7 > b.y && ball.y - 7 < b.y + b.h) {
            b.alive = false; BG.sfx('pop'); leftEl.textContent = boxes.filter(x => x.alive).length;
          }
        }
        if (ball.y > H + 30 || ball.x > W + 30 || ball.x < -30) {
          ball = null;
          const left = boxes.filter(x => x.alive).length;
          if (left === 0) {
            if (level < 3) { BG.sfx('win'); level++; shots = 6; shotsEl.textContent = shots; buildLevel(level); msgEl.textContent = 'LEVEL ' + level + '! Target lebih banyak!'; }
            else { over = true; BG.endScreen(canvas.parentElement, { score: 900, bestKey: 'ketapel', title: 'Jago Ketapel!', sub: 'Semua target hancur 3 level!', scoreLabel: 'Sempurna!', onRetry: exRetry(el, s, 'ketapel') }); }
          } else if (shots <= 0) {
            over = true;
            BG.endScreen(canvas.parentElement, { score: (6 - shots) * 0 + (boxes.length - left) * 100, bestKey: 'ketapel', win: false, title: 'Kehabisan Tembakan!', sub: 'Sisa kotak: ' + left, onRetry: exRetry(el, s, 'ketapel') });
          } else msgEl.textContent = 'Sisa kotak: ' + left + ' — tembakan: ' + shots;
        }
      }
      /* gambar */
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#166534');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#14532d'; ctx.fillRect(0, H - 46, W, 46);
      /* ketapel */
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(anchor.x - 14, H - 46); ctx.lineTo(anchor.x - 6, anchor.y); ctx.moveTo(anchor.x + 14, H - 46); ctx.lineTo(anchor.x + 6, anchor.y); ctx.stroke();
      ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(anchor.x - 8, anchor.y); ctx.lineTo(anchor.x + 8, anchor.y); ctx.stroke();
      /* karet */
      if (drag && drag.cur) {
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(anchor.x - 8, anchor.y); ctx.lineTo(drag.cur.x, drag.cur.y); ctx.lineTo(anchor.x + 8, anchor.y); ctx.stroke();
        drawBugBall(ctx, drag.cur.x, drag.cur.y);
      } else if (!ball) drawBugBall(ctx, anchor.x, anchor.y);
      if (ball) drawBugBall(ctx, ball.x, ball.y);
      /* kotak target */
      boxes.forEach(b => {
        if (!b.alive) return;
        ctx.fillStyle = '#a16207'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h / 2); ctx.lineTo(b.x + b.w, b.y + b.h / 2); ctx.stroke();
      });
    });
    function drawBugBall(ctx, x, y) { drawMiniBug(ctx, x, y, 11, '#b9f542'); }
    shotsEl.textContent = shots;
  }
});

/* ============ BOM WAKTU ============ */
BG.register({
  id: 'bomwaktu', name: 'Bom Waktu', desc: 'Potong kabel yang benar sebelum meledak!', cat: 'puzzle', icon: 'bomb', tags: 'bom waktu wires defuse',
  start(el, s) {
    let round = 0; const TOTAL = 5;
    el.innerHTML = '<div class="panel center-col" style="max-width:400px;text-align:center"><div class="hud" style="width:100%">' + BG.hudPill('Ronde', 'bw-round') + BG.hudPill('Waktu', 'bw-time') + '</div>' +
      '<h2 id="bw-bomb" style="font-size:3rem">💣</h2>' +
      '<p id="bw-hint" style="font-weight:800;color:#fbbf24;min-height:2em"></p>' +
      '<div id="bw-wires" style="display:flex;gap:10px;justify-content:center"></div></div>';
    const roundEl = el.querySelector('#bw-round'), timeEl = el.querySelector('#bw-time'), hintEl = el.querySelector('#bw-hint'), wiresEl = el.querySelector('#bw-wires');
    const WIRE_COLORS = [
      { name: 'MERAH', hex: '#ef4444' }, { name: 'KUNING', hex: '#facc15' }, { name: 'HIJAU', hex: '#22c55e' }, { name: 'BIRU', hex: '#3b82f6' },
    ];
    let correctIdx = -1, timer = null, over = false, timeLeft = 10;

    function clueFor(idx, wires) {
      const hints = [
        'Potong kabel yang BUKAN ' + wires[(idx + 1) % wires.length].name,
        'Potong kabel ' + wires[idx].name,
        'Jangan potong kabel ' + wires.map((w, i) => i !== idx ? w.name : null).filter(Boolean)[0],
        wires[idx].hex === '#facc15' || wires[idx].hex === '#22c55e' ? 'Kabel yang harus dipotong cerah warnanya' : 'Kabel yang harus dipotong gelap warnanya',
      ];
      return BG.pick(hints);
    }
    function newRound() {
      round++; roundEl.textContent = round;
      const wires = BG.shuffle(WIRE_COLORS.slice());
      correctIdx = BG.rand(0, wires.length - 1);
      hintEl.textContent = clueFor(correctIdx, wires);
      wiresEl.innerHTML = wires.map((w, i) => '<button class="choice-btn" data-i="' + i + '" style="background:' + w.hex + ';color:#111;border-color:#241239;min-width:76px;font-weight:900">' + w.name + '</button>').join('');
      timeLeft = Math.max(4, 11 - round);
      clearInterval(timer);
      timer = s.interval(() => {
        if (over) return;
        timeLeft--; timeEl.textContent = timeLeft + 's';
        if (timeLeft <= 0) explode();
      }, 1000);
      timeEl.textContent = timeLeft + 's';
      wiresEl.style.pointerEvents = 'auto';
    }
    wiresEl.addEventListener('click', e => {
      const btn = e.target.closest('.choice-btn'); if (!btn || over) return;
      if (+btn.dataset.i === correctIdx) {
        BG.sfx('coin');
        if (round >= TOTAL) {
          over = true; clearInterval(timer);
          BG.endScreen(el.querySelector('.panel').parentElement, { score: 500, bestKey: 'bomwaktu', title: 'Bom Dilempar!', sub: 'Semua bom berhasil dijinakkan!', scoreLabel: 'Defused!', onRetry: exRetry(el, s, 'bomwaktu') });
        } else newRound();
      } else explode();
    });
    function explode() {
      over = true; clearInterval(timer); BG.sfx('bad');
      el.querySelector('#bw-bomb').textContent = '💥';
      wiresEl.style.pointerEvents = 'none';
      BG.endScreen(el.querySelector('.panel').parentElement, { score: (round - 1) * 100, bestKey: 'bomwaktu', win: false, title: 'BOOM!', sub: 'Ronde ' + round + ' — salah potong kabel.', scoreLabel: 'Ledakan!', onRetry: exRetry(el, s, 'bomwaktu') });
    }
    timeEl.textContent = timeLeft + 's';
    newRound();
  }
});
