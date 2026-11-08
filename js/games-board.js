/* Buggames — Game PUZZLE & PAPAN */
'use strict';

function restartBtn(el, session, rebuild) {
  const btn = BG.el('<button class="btn btn-teal btn-block" style="margin-top:10px">Acak Ulang</button>');
  btn.addEventListener('click', () => { BG.sfx('click'); rebuild(); });
  el.appendChild(btn);
}
function rebuildGame(el, session, id) {
  el.innerHTML = '';
  BG.games.find(g => g.id === id).start(el, session);
}

/* ============ 16. TIGA SERANGKAI ============ */
BG.register({
  id: 'tictactoe', name: 'Tiga Serangkai', desc: 'Halangi 3 di garis lurus vs komputer!', cat: 'puzzle', icon: 'tictactoe', tags: 'tic tac toe silang bulat',
  start(el, s) {
    el.innerHTML = '<div class="panel center-col" style="max-width:360px"><h3>Kamu = 🐛 vs Komputer = ✕</h3>' +
      '<div class="board" id="ttt-board" style="grid-template-columns:repeat(3,88px);grid-auto-rows:88px"></div>' +
      '<p id="ttt-status" style="text-align:center;font-weight:800;color:#ffd23f">Giliranmu!</p></div>';
    const boardEl = el.querySelector('#ttt-board'), status = el.querySelector('#ttt-status');
    let cells = Array(9).fill(''), over = false;
    const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const winnerOf = b => { for (const [a,c,d] of WINS) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; return b.every(v => v) ? 'draw' : null; };
    function render() {
      boardEl.innerHTML = cells.map((v, i) => '<button class="cell" data-i="' + i + '" style="font-size:2.4rem">' + (v === 'bug' ? '🐛' : v === 'x' ? '✕' : '') + '</button>').join('');
    }
    boardEl.addEventListener('click', e => {
      const btn = e.target.closest('.cell'); if (!btn || over) return;
      const i = +btn.dataset.i; if (cells[i]) return;
      cells[i] = 'bug'; BG.sfx('pop'); render();
      let w = winnerOf(cells);
      if (w) return finish(w);
      status.textContent = 'Komputer mikir...';
      s.timeout(() => {
        if (over) return;
        const mv = bestMove(cells); cells[mv] = 'x'; BG.sfx('click'); render();
        w = winnerOf(cells);
        if (w) finish(w); else status.textContent = 'Giliranmu!';
      }, 380);
    });
    function bestMove(b) {
      /* menang > blok > tengah > pojok > acak */
      const tryFind = mark => { for (const [a,c,d] of WINS) { const line = [b[a],b[c],b[d]]; if (line.filter(v => v === mark).length === 2 && line.includes('')) return [a,c,d][line.indexOf('')]; } return -1; };
      let m = tryFind('x'); if (m >= 0) return m;
      m = tryFind('bug'); if (m >= 0) return m;
      if (!b[4]) return 4;
      for (const c of [0,2,6,8]) if (!b[c]) return c;
      return b.findIndex(v => !v);
    }
    function finish(w) {
      over = true;
      const win = w === 'bug';
      BG.endScreen(el.querySelector('.panel').parentElement, {
        score: win ? 100 : 0, bestKey: 'tictactoe', win,
        title: w === 'draw' ? 'Seri!' : win ? 'Kamu Menang!' : 'Komputer Menang!',
        sub: w === 'draw' ? 'Imbang seru!' : win ? 'Buggy bangga sama kamu!' : 'Coba taktik lain!',
        scoreLabel: win ? 'Menang' : w === 'draw' ? 'Seri' : 'Kalah',
        onRetry: () => rebuildGame(el, s, 'tictactoe'),
      });
    }
    render();
  }
});

/* ============ 17. SAMBUNG EMPAT ============ */
BG.register({
  id: 'connect4', name: 'Sambung Empat', desc: 'Susun 4 koin bug sejajar!', cat: 'puzzle', icon: 'connect4', tags: 'connect four sambung empat',
  start(el, s) {
    const COLS = 7, ROWS = 6;
    el.innerHTML = '<div class="panel center-col"><h3>Kamu <span style="color:#ffd23f">●</span> vs Komputer <span style="color:#ff6b9d">●</span></h3>' +
      '<div class="board" id="c4-board" style="grid-template-columns:repeat(7,46px);grid-auto-rows:46px"></div>' +
      '<p id="c4-status" style="text-align:center;font-weight:800;color:#ffd23f">Giliranmu! Ketuk kolom.</p></div>';
    const boardEl = el.querySelector('#c4-board'), status = el.querySelector('#c4-status');
    let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0)), over = false;
    const YOU = 1, AI = 2;

    function dropRow(g, col) { for (let r = ROWS - 1; r >= 0; r--) if (!g[r][col]) return r; return -1; }
    function checkWin(g, mark) {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (g[r][c] !== mark) continue;
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        for (const [dr, dc] of dirs) {
          let ok = true;
          for (let i = 1; i < 4; i++) { const rr = r + dr * i, cc = c + dc * i; if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || g[rr][cc] !== mark) { ok = false; break; } }
          if (ok) return true;
        }
      }
      return false;
    }
    function isFull(g) { return g[0].every(v => v); }
    function render() {
      let html = '';
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = grid[r][c];
        const color = v === YOU ? '#ffd23f' : v === AI ? '#ff6b9d' : '#1b0f2e';
        html += '<button class="cell" data-c="' + c + '" style="border-radius:50%;font-size:0;padding:0;background:radial-gradient(circle at 40% 35%, ' + color + ' 60%, #241239 130%)"></button>';
      }
      boardEl.innerHTML = html;
    }
    boardEl.addEventListener('click', e => {
      const btn = e.target.closest('.cell'); if (!btn || over) return;
      const col = +btn.dataset.c;
      const r = dropRow(grid, col); if (r < 0) return;
      grid[r][col] = YOU; BG.sfx('pop'); render();
      if (checkWin(grid, YOU)) return finish(true);
      if (isFull(grid)) return finish(null);
      status.textContent = 'Komputer mikir...';
      s.timeout(() => {
        if (over) return;
        const col = aiMove(); grid[dropRow(grid, col)][col] = AI; BG.sfx('click'); render();
        if (checkWin(grid, AI)) return finish(false);
        if (isFull(grid)) return finish(null);
        status.textContent = 'Giliranmu!';
      }, 350);
    });
    function aiMove() {
      /* menang > blok > tengah > acak */
      for (const mark of [AI, YOU]) for (let c = 0; c < COLS; c++) {
        const r = dropRow(grid, c); if (r < 0) continue;
        grid[r][c] = mark; const win = checkWin(grid, mark); grid[r][c] = 0;
        if (win) return c;
      }
      const pref = [3, 2, 4, 1, 5, 0, 6];
      for (const c of pref) if (dropRow(grid, c) >= 0) return c;
      return 0;
    }
    function finish(youWon) {
      over = true;
      BG.endScreen(el.querySelector('.panel').parentElement, {
        score: youWon ? 100 : 0, bestKey: 'connect4', win: youWon !== false,
        title: youWon === null ? 'Penuh!' : youWon ? 'Kamu Menang!' : 'Komputer Menang!',
        sub: youWon === null ? 'Tidak ada yang bisa menyambung 4.' : youWon ? 'Strategi jeli!' : 'Komputer kali ini lebih lihai.',
        scoreLabel: youWon === null ? 'Seri' : youWon ? 'Menang' : 'Kalah',
        onRetry: () => rebuildGame(el, s, 'connect4'),
      });
    }
    render();
  }
});

/* ============ 18. BOM BUG (minesweeper) ============ */
BG.register({
  id: 'minesweeper', name: 'Bom Bug', desc: 'Buka semua kotak tanpa kena bom!', cat: 'puzzle', icon: 'mine', tags: 'minesweeper bom kapal',
  start(el, s) {
    const N = 9, MINES = 10;
    el.innerHTML = '<div class="panel center-col" style="max-width:400px"><div class="hud" style="width:100%">' +
      BG.hudPill('Bom', 'ms-mines') + BG.hudPill('Waktu', 'ms-time') +
      '<button class="btn btn-pink" id="ms-flag" style="padding:8px 14px;font-size:.75rem">Mode: Buka</button></div>' +
      '<div class="board" id="ms-board" style="grid-template-columns:repeat(9,34px);grid-auto-rows:34px;gap:3px"></div>' +
      '<p id="ms-status" style="text-align:center;font-weight:800;color:#ffd23f">Ketuk kotak untuk membuka. Tahan/klik kanan untuk bendera.</p></div>';
    const boardEl = el.querySelector('#ms-board'), minesEl = el.querySelector('#ms-mines'), timeEl = el.querySelector('#ms-time'),
      status = el.querySelector('#ms-status'), flagBtn = el.querySelector('#ms-flag');
    let mines = new Set(), revealed = new Set(), flags = new Set(), over = false, flagMode = false, seconds = 0, started = false;
    const key = (r, c) => r + ',' + c;
    const idx = i => [Math.floor(i / N), i % N];

    function place() {
      mines.clear();
      while (mines.size < MINES) mines.add(BG.rand(0, N * N - 1));
    }
    function neighbors(i) {
      const [r, c] = idx(i), out = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc);
      }
      return out;
    }
    function count(i) { return neighbors(i).filter(n => mines.has(n)).length; }
    function reveal(i) {
      if (revealed.has(i) || flags.has(i)) return;
      revealed.add(i);
      if (count(i) === 0 && !mines.has(i)) neighbors(i).forEach(reveal);
    }
    function checkWin() { return revealed.size === N * N - MINES; }

    flagBtn.addEventListener('click', () => { flagMode = !flagMode; flagBtn.textContent = flagMode ? 'Mode: Bendera' : 'Mode: Buka'; BG.sfx('click'); });

    s.interval(() => { if (started && !over) { seconds++; timeEl.textContent = seconds + 's'; } }, 1000);

    boardEl.addEventListener('contextmenu', e => e.preventDefault());
    boardEl.addEventListener('click', e => {
      const cell = e.target.closest('.cell'); if (!cell || over) return;
      const i = +cell.dataset.i;
      if (!started) { started = true; place(); if (mines.has(i)) { mines.delete(i); mines.add((i + 7) % (N * N)); } }
      if (flagMode) {
        flags.has(i) ? flags.delete(i) : flags.add(i); BG.sfx('click');
      } else {
        if (flags.has(i) || revealed.has(i)) return;
        if (mines.has(i)) { over = true; BG.sfx('bad'); showAll(false); return; }
        reveal(i); BG.sfx('pop');
        if (checkWin()) { over = true; showAll(true); }
      }
      render();
    });
    function showAll(win) {
      render();
      s.timeout(() => {
        BG.endScreen(el.querySelector('.panel').parentElement, {
          score: win ? Math.max(100, 1000 - seconds * 5) : 0, bestKey: 'minesweeper', win,
          title: win ? 'Aman Sentosa!' : 'BOOM!',
          sub: win ? 'Selesai dalam ' + seconds + ' detik.' : 'Kamu menginjak bom bug!',
          scoreLabel: win ? seconds + 's' : 'BOOM',
          onRetry: () => rebuildGame(el, s, 'minesweeper'),
        });
      }, 450);
    }
    function render() {
      let html = '';
      for (let i = 0; i < N * N; i++) {
        let cls = 'cell', content = '';
        if (revealed.has(i)) {
          const n = count(i);
          content = n > 0 ? n : '';
          cls += ' tile-num';
        } else if (flags.has(i)) { content = '🚩'; }
        else if (over && mines.has(i)) { content = '🐞'; cls += ' tile-num'; }
        html += '<button class="' + cls + '" data-i="' + i + '" style="font-size:.9rem">' + content + '</button>';
      }
      boardEl.innerHTML = html;
      minesEl.textContent = MINES - flags.size;
    }
    render();
  }
});

/* ============ 19. LIGHTS OUT ============ */
BG.register({
  id: 'lightsout', name: 'Lights Out', desc: 'Matikan semua lampu!', cat: 'puzzle', icon: 'lightsout', tags: 'lights out lampu mati',
  start(el, s) {
    const N = 5;
    el.innerHTML = '<div class="panel center-col" style="max-width:380px"><div class="hud" style="width:100%">' +
      BG.hudPill('Langkah', 'lo-moves') + '</div>' +
      '<div class="board" id="lo-board" style="grid-template-columns:repeat(5,56px);grid-auto-rows:56px"></div>' +
      '<p style="text-align:center;color:#d9c9f2;font-size:.85rem">Ketuk kotak: dia & 4 tetangganya berbalik. Matikan SEMUA lampu!</p></div>';
    const boardEl = el.querySelector('#lo-board'), movesEl = el.querySelector('#lo-moves');
    let grid = Array.from({ length: N }, () => Array(N).fill(false)), moves = 0, over = false;

    /* bikin papan pasti bisa diselesaikan */
    function scramble() {
      grid = Array.from({ length: N }, () => Array(N).fill(false));
      const presses = BG.rand(6, 12);
      for (let i = 0; i < presses; i++) toggleAt(BG.rand(0, N - 1), BG.rand(0, N - 1), true);
      if (grid.flat().every(v => !v)) toggleAt(2, 2, true);
    }
    function toggleAt(r, c, silent) {
      const cells = [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [rr, cc] of cells) if (rr >= 0 && rr < N && cc >= 0 && cc < N) grid[rr][cc] = !grid[rr][cc];
    }
    function render() {
      boardEl.innerHTML = grid.map((row, r) => row.map((on, c) =>
        '<button class="cell" data-r="' + r + '" data-c="' + c + '" style="font-size:1.6rem;background:' + (on ? '#ffd23f' : '#241239') + ';box-shadow:' + (on ? '0 0 18px rgba(255,210,63,.45)' : 'none') + '">' + (on ? '💡' : '') + '</button>'
      ).join('')).join('');
      movesEl.textContent = moves;
    }
    boardEl.addEventListener('click', e => {
      const cell = e.target.closest('.cell'); if (!cell || over) return;
      toggleAt(+cell.dataset.r, +cell.dataset.c); moves++; BG.sfx('click'); render();
      if (grid.flat().every(v => !v)) {
        over = true;
        BG.endScreen(el.querySelector('.panel').parentElement, {
          score: Math.max(10, 500 - moves * 10), bestKey: 'lightsout',
          title: 'Gelap Gulita!', sub: 'Semua lampu mati dalam ' + moves + ' langkah.', scoreLabel: moves + ' langkah',
          onRetry: () => rebuildGame(el, s, 'lightsout'),
        });
      }
    });
    scramble(); render();
  }
});

/* ============ 20. GESER ANGKA (15 puzzle) ============ */
BG.register({
  id: 'sliding', name: 'Geser Angka', desc: 'Susun angka 1-15 berurutan!', cat: 'puzzle', icon: 'sliding', tags: 'sliding puzzle geser 15 fifteen',
  start(el, s) {
    const N = 4;
    el.innerHTML = '<div class="panel center-col" style="max-width:360px"><div class="hud" style="width:100%">' + BG.hudPill('Langkah', 'sl-moves') + '</div>' +
      '<div class="board" id="sl-board" style="grid-template-columns:repeat(4,70px);grid-auto-rows:70px"></div>' +
      '<p style="text-align:center;color:#d9c9f2;font-size:.85rem">Geser kotak ke ruang kosong sampai urut 1-15!</p></div>';
    const boardEl = el.querySelector('#sl-board'), movesEl = el.querySelector('#sl-moves');
    let tiles = [], moves = 0, over = false;

    function solved() { return tiles.slice(0, 15).every((v, i) => v === i + 1) && tiles[15] === 0; }
    function shuffleTiles() {
      tiles = Array.from({ length: 16 }, (_, i) => (i + 1) % 16); /* 1..15, 0 */
      /* kocok pakai langkah legal supaya pasti bisa diselesaikan */
      let blank = 15;
      for (let i = 0; i < 300; i++) {
        const r = Math.floor(blank / N), c = blank % N, opts = [];
        if (r > 0) opts.push(blank - N); if (r < N - 1) opts.push(blank + N);
        if (c > 0) opts.push(blank - 1); if (c < N - 1) opts.push(blank + 1);
        const swap = BG.pick(opts);
        [tiles[blank], tiles[swap]] = [tiles[swap], tiles[blank]];
        blank = swap;
      }
      if (solved()) shuffleTiles();
    }
    function render() {
      boardEl.innerHTML = tiles.map((v, i) => v === 0
        ? '<div class="cell" style="background:#17102a;border-style:dashed;cursor:default"></div>'
        : '<button class="cell tile-num" data-i="' + i + '" style="font-size:1.5rem">' + v + '</button>').join('');
      movesEl.textContent = moves;
    }
    boardEl.addEventListener('click', e => {
      const cell = e.target.closest('.cell'); if (!cell || cell.dataset.i === undefined || over) return;
      const i = +cell.dataset.i, blank = tiles.indexOf(0);
      const r = Math.floor(i / N), c = i % N, br = Math.floor(blank / N), bc = blank % N;
      if (Math.abs(r - br) + Math.abs(c - bc) === 1) {
        [tiles[i], tiles[blank]] = [tiles[blank], tiles[i]];
        moves++; BG.sfx('click'); render();
        if (solved()) {
          over = true;
          BG.endScreen(el.querySelector('.panel').parentElement, {
            score: Math.max(10, 2000 - moves * 5), bestKey: 'sliding',
            title: 'Rapi!', sub: 'Tersusun dalam ' + moves + ' langkah.', scoreLabel: moves + ' langkah',
            onRetry: () => rebuildGame(el, s, 'sliding'),
          });
        }
      }
    });
    shuffleTiles(); render();
  }
});

/* ============ 21. 2048 BUG ============ */
BG.register({
  id: 't2048', name: '2048 Bug', desc: 'Gabungkan angka jadi 2048!', cat: 'puzzle', icon: 't2048', tags: '2048 angka gabung',
  start(el, s) {
    el.innerHTML = '<div class="panel center-col" style="max-width:360px"><div class="hud" style="width:100%">' + BG.hudPill('Skor', 't2-score') + '</div>' +
      '<div class="board" id="t2-board" style="grid-template-columns:repeat(4,72px);grid-auto-rows:72px;gap:8px"></div>' +
      '<p style="text-align:center;color:#d9c9f2;font-size:.85rem">Geser (swipe) atau pakai tombol panah.</p></div>';
    const boardEl = el.querySelector('#t2-board'), scoreEl = el.querySelector('#t2-score');
    let grid = Array.from({ length: 4 }, () => Array(4).fill(0)), score = 0, over = false;
    const TILE_COLORS = { 2: '#fef3c7', 4: '#fde68a', 8: '#fdba74', 16: '#fb923c', 32: '#ff6b9d', 64: '#f43f5e', 128: '#a78bfa', 256: '#8b5cf6', 512: '#4ecdc4', 1024: '#22d3ee', 2048: '#ffd23f' };

    function spawn() {
      const empty = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!grid[r][c]) empty.push([r, c]);
      if (!empty.length) return;
      const [r, c] = BG.pick(empty);
      grid[r][c] = Math.random() < 0.88 ? 2 : 4;
    }
    function slide(row) {
      let arr = row.filter(v => v);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; arr.splice(i + 1, 1); }
      }
      while (arr.length < 4) arr.push(0);
      return arr;
    }
    function move(dir) {
      if (over) return;
      const before = JSON.stringify(grid);
      for (let i = 0; i < 4; i++) {
        let line = [grid[i][0], grid[i][1], grid[i][2], grid[i][3]];
        if (dir === 'up' || dir === 'down') line = [grid[0][i], grid[1][i], grid[2][i], grid[3][i]];
        if (dir === 'right' || dir === 'down') line.reverse();
        line = slide(line);
        if (dir === 'right' || dir === 'down') line.reverse();
        for (let j = 0; j < 4; j++) {
          if (dir === 'up' || dir === 'down') grid[j][i] = line[j]; else grid[i][j] = line[j];
        }
      }
      if (JSON.stringify(grid) !== before) { spawn(); BG.sfx('click'); } else BG.sfx('bad');
      scoreEl.textContent = score;
      render();
      if (!canMove()) {
        over = true;
        BG.endScreen(el.querySelector('.panel').parentElement, {
          score, bestKey: 't2048', title: 'Penuh!', sub: 'Tidak ada gerakan tersisa. Skor kamu ' + score + '.',
          onRetry: () => rebuildGame(el, s, 't2048'),
        });
      }
    }
    function canMove() {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        if (!grid[r][c]) return true;
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
      }
      return false;
    }
    function render() {
      boardEl.innerHTML = grid.map(row => row.map(v =>
        '<div class="cell" style="font-size:' + (v >= 1024 ? '1.1rem' : '1.5rem') + ';background:' + (v ? TILE_COLORS[v] || '#ffd23f' : '#1b0f2e') + ';color:' + (v >= 8 && v < 256 ? '#241239' : '#fff') + ';border-color:#241239">' + (v || '') + '</div>'
      ).join('')).join('');
    }
    s.on(window, 'keydown', e => {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    });
    let touch = null;
    s.on(boardEl, 'pointerdown', e => { touch = { x: e.clientX, y: e.clientY }; });
    s.on(boardEl, 'pointerup', e => {
      if (!touch) return;
      const dx = e.clientX - touch.x, dy = e.clientY - touch.y; touch = null;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    spawn(); spawn(); render();
  }
});

/* ============ 22. LABIRIN BUG ============ */
BG.register({
  id: 'maze', name: 'Labirin Bug', desc: 'Antar Buggy ke taman bunga di ujung labirin!', cat: 'puzzle', icon: 'maze', tags: 'maze labirin jalan',
  start(el, s) {
    const COLS = 13, ROWS = 9, CELL = 34;
    el.innerHTML = '<div class="panel center-col" style="max-width:480px"><div class="hud" style="width:100%">' + BG.hudPill('Waktu', 'mz-time') + '</div>' +
      '<canvas id="mz-canvas" width="' + COLS * CELL + '" height="' + ROWS * CELL + '" style="border:3px solid var(--ink);border-radius:14px;max-width:100%;touch-action:none"></canvas>' +
      '<div class="dpad"><span></span><button data-d="up">▲</button><span></span><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button></div></div>';
    const canvas = el.querySelector('#mz-canvas'), ctx = canvas.getContext('2d'), timeEl = el.querySelector('#mz-time');
    let time = 0, over = false;
    s.interval(() => { if (!over) { time++; timeEl.textContent = time + 's'; } }, 1000);

    /* generate maze: recursive backtracker */
    const W = COLS, H = ROWS;
    const walls = Array.from({ length: H }, () => Array.from({ length: W }, () => ({ t: true, r: true, b: true, l: true, v: false })));
    const stack = [[0, 0]]; walls[0][0].v = true;
    while (stack.length) {
      const [r, c] = stack[stack.length - 1];
      const nbs = [];
      if (r > 0 && !walls[r - 1][c].v) nbs.push([r - 1, c, 't']);
      if (c < W - 1 && !walls[r][c + 1].v) nbs.push([r, c + 1, 'r']);
      if (r < H - 1 && !walls[r + 1][c].v) nbs.push([r + 1, c, 'b']);
      if (c > 0 && !walls[r][c - 1].v) nbs.push([r, c - 1, 'l']);
      if (!nbs.length) { stack.pop(); continue; }
      const [nr, nc, dir] = BG.pick(nbs);
      walls[nr][nc].v = true;
      if (dir === 't') { walls[r][c].t = false; walls[nr][nc].b = false; }
      if (dir === 'r') { walls[r][c].r = false; walls[nr][nc].l = false; }
      if (dir === 'b') { walls[r][c].b = false; walls[nr][nc].t = false; }
      if (dir === 'l') { walls[r][c].l = false; walls[nr][nc].r = false; }
      stack.push([nr, nc]);
    }
    let px = 0, py = 0; const goal = { x: W - 1, y: H - 1 };

    function tryMove(dx, dy) {
      const cell = walls[py][px];
      if (dx === 1 && cell.r) return; if (dx === -1 && cell.l) return;
      if (dy === 1 && cell.b) return; if (dy === -1 && cell.t) return;
      px = Math.max(0, Math.min(W - 1, px + dx)); py = Math.max(0, Math.min(H - 1, py + dy));
      BG.sfx('click'); draw();
      if (px === goal.x && py === goal.y && !over) {
        over = true;
        BG.endScreen(el.querySelector('.panel').parentElement, {
          score: Math.max(10, 3000 - time * 20), bestKey: 'maze',
          title: 'Sampai!', sub: 'Labirin selesai dalam ' + time + ' detik.', scoreLabel: time + 's',
          onRetry: () => rebuildGame(el, s, 'maze'),
        });
      }
    }
    s.on(window, 'keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') tryMove(0, -1);
      else if (k === 'arrowdown' || k === 's') tryMove(0, 1);
      else if (k === 'arrowleft' || k === 'a') tryMove(-1, 0);
      else if (k === 'arrowright' || k === 'd') tryMove(1, 0);
    });
    el.querySelectorAll('.dpad button').forEach(b => b.addEventListener('click', () => {
      const d = b.dataset.d;
      tryMove(d === 'right' ? 1 : d === 'left' ? -1 : 0, d === 'down' ? 1 : d === 'up' ? -1 : 0);
    }));
    let touch = null;
    s.on(canvas, 'pointerdown', e => { touch = { x: e.clientX, y: e.clientY }; });
    s.on(canvas, 'pointerup', e => {
      if (!touch) return;
      const dx = e.clientX - touch.x, dy = e.clientY - touch.y; touch = null;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      tryMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0, Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0);
    });

    function draw() {
      ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#e7ff8f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
        const x = c * CELL, y = r * CELL, cell = walls[r][c];
        if (cell.t) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); ctx.stroke(); }
        if (cell.l) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); ctx.stroke(); }
        if (r === H - 1 && cell.b) { ctx.beginPath(); ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (c === W - 1 && cell.r) { ctx.beginPath(); ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
      }
      /* bunga tujuan */
      const gx = goal.x * CELL + CELL / 2, gy = goal.y * CELL + CELL / 2;
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx.fillStyle = '#ff6b9d'; ctx.beginPath(); ctx.arc(gx + Math.cos(a) * 8, gy + Math.sin(a) * 8, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(gx, gy, 5, 0, Math.PI * 2); ctx.fill();
      /* buggy */
      drawMiniBug(ctx, px * CELL + CELL / 2, py * CELL + CELL / 2, 11, '#b9f542');
    }
    draw();
  }
});

/* ============ 23. MENARA HANOI ============ */
BG.register({
  id: 'hanoi', name: 'Menara Hanoi', desc: 'Pindahkan 4 cakram ke tiang kanan!', cat: 'puzzle', icon: 'hanoi', tags: 'hanoi menara cakram',
  start(el, s) {
    const DISKS = 4;
    el.innerHTML = '<div class="panel center-col" style="max-width:440px"><div class="hud" style="width:100%">' + BG.hudPill('Langkah', 'hn-moves') + '</div>' +
      '<div id="hn-board" style="display:flex;gap:10px;justify-content:center;width:100%"></div>' +
      '<p style="text-align:center;color:#d9c9f2;font-size:.85rem">Ketuk tiang untuk angkat/letakkan cakram. Cakram besar gak boleh di atas kecil! (Minimal ' + (Math.pow(2, DISKS) - 1) + ' langkah)</p></div>';
    const boardEl = el.querySelector('#hn-board'), movesEl = el.querySelector('#hn-moves');
    let pegs = [Array.from({ length: DISKS }, (_, i) => DISKS - i), [], []], selected = -1, moves = 0, over = false;
    const DISK_W = [150, 118, 86, 54];
    const DISK_COLORS = ['#ff6b9d', '#ffd23f', '#4ecdc4', '#a3e635'];

    function render() {
      boardEl.innerHTML = pegs.map((peg, i) =>
        '<button class="cell" data-peg="' + i + '" style="flex:1;height:190px;display:flex;flex-direction:column-reverse;align-items:center;justify-content:flex-start;gap:4px;padding:8px 4px;border-color:' + (selected === i ? '#ffd23f' : 'var(--ink)') + '">' +
          peg.map(d => '<div style="width:' + DISK_W[d - 1] + 'px;height:20px;border-radius:10px;background:' + DISK_COLORS[d - 1] + ';border:3px solid #241239"></div>').join('') +
        '</button>').join('');
      movesEl.textContent = moves;
    }
    boardEl.addEventListener('click', e => {
      const pegBtn = e.target.closest('[data-peg]'); if (!pegBtn || over) return;
      const i = +pegBtn.dataset.peg;
      if (selected === -1) { if (pegs[i].length) { selected = i; BG.sfx('click'); } }
      else {
        if (selected === i) { selected = -1; render(); return; }
        const disk = pegs[selected][pegs[selected].length - 1];
        const top = pegs[i][pegs[i].length - 1];
        if (top === undefined || top > disk) {
          pegs[i].push(pegs[selected].pop()); moves++; BG.sfx('pop');
          selected = -1; render();
          if (pegs[2].length === DISKS) {
            over = true;
            BG.endScreen(el.querySelector('.panel').parentElement, {
              score: Math.max(10, 1000 - moves * 20), bestKey: 'hanoi',
              title: 'Sempurna!', sub: 'Selesai dalam ' + moves + ' langkah (minimal ' + (Math.pow(2, DISKS) - 1) + ').', scoreLabel: moves + ' langkah',
              onRetry: () => rebuildGame(el, s, 'hanoi'),
            });
          }
        } else { BG.sfx('bad'); selected = -1; render(); }
      }
      render();
    });
    render();
  }
});

/* ============ 24. SUDOKU MINI 4x4 ============ */
BG.register({
  id: 'sudoku', name: 'Sudoku Mini', desc: 'Isi angka 1-4. Tiap baris, kolom, kotak harus unik!', cat: 'puzzle', icon: 'sudoku', tags: 'sudoku angka logika',
  start(el, s) {
    const PUZZLES = [
      { clue: [1,0,0,4, 0,4,1,0, 0,1,4,0, 4,0,0,1], sol: [1,2,3,4, 3,4,1,2, 2,1,4,3, 4,3,2,1] },
      { clue: [1,0,3,0, 0,0,0,1, 0,1,0,3, 2,0,1,0], sol: [1,4,3,2, 3,2,4,1, 4,1,2,3, 2,3,1,4] },
      { clue: [2,0,0,3, 0,3,2,0, 3,0,0,2, 0,2,3,0], sol: [2,1,4,3, 4,3,2,1, 3,4,1,2, 1,2,3,4] },
      { clue: [0,4,0,2, 2,0,4,0, 0,2,0,4, 4,0,2,0], sol: [3,4,1,2, 2,1,4,3, 1,2,3,4, 4,3,2,1] },
    ];
    /* pakai puzzle yang valid saja */
    function validSolution(sol) {
      const ok = (arr) => new Set(arr).size === 4 && arr.every(v => v >= 1 && v <= 4);
      for (let i = 0; i < 4; i++) {
        if (!ok([sol[i*4], sol[i*4+1], sol[i*4+2], sol[i*4+3]])) return false;
        if (!ok([sol[i], sol[i+4], sol[i+8], sol[i+12]])) return false;
      }
      for (const off of [0, 2, 8, 10]) if (!ok([sol[off], sol[off+1], sol[off+4], sol[off+5]])) return false;
      return true;
    }
    const valid = PUZZLES.filter(p => validSolution(p.sol));
    const puzzle = BG.pick(valid);
    let grid = puzzle.clue.slice(), selected = -1, over = false;

    el.innerHTML = '<div class="panel center-col" style="max-width:340px"><h3>Sudoku Mini 4×4</h3>' +
      '<div class="board" id="sd-board" style="grid-template-columns:repeat(4,64px);grid-auto-rows:64px;gap:4px"></div>' +
      '<div id="sd-pad" style="display:flex;gap:8px"></div></div>';
    const boardEl = el.querySelector('#sd-board'), padEl = el.querySelector('#sd-pad');

    function render() {
      boardEl.innerHTML = grid.map((v, i) => {
        const fixed = puzzle.clue[i] !== 0;
        const boxBorder = ((Math.floor(i / 2) % 2 === 1) ? 'border-bottom-width:5px;' : '') + ((i % 4 === 1) ? 'border-right-width:5px;' : '');
        return '<button class="cell" data-i="' + i + '" style="font-size:1.6rem;' + boxBorder + (selected === i ? 'outline:3px solid #ffd23f;' : '') +
          (fixed ? 'color:#ffd23f;' : 'color:#fff;cursor:pointer;') + '">' + (v || '') + '</button>';
      }).join('');
      padEl.innerHTML = [1,2,3,4].map(n => '<button class="btn btn-teal" data-n="' + n + '" style="padding:10px 18px;font-size:1.2rem">' + n + '</button>').join('') +
        '<button class="btn btn-ghost" data-n="0" style="padding:10px 14px">⌫</button>';
    }
    boardEl.addEventListener('click', e => { const cell = e.target.closest('.cell'); if (!cell || over) return; const i = +cell.dataset.i; if (puzzle.clue[i]) return; selected = i; BG.sfx('click'); render(); });
    padEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-n]'); if (!btn || selected < 0 || over) return;
      grid[selected] = +btn.dataset.n; BG.sfx('click'); render();
      if (grid.every(v => v !== 0)) {
        const solved = grid.every((v, i) => v === puzzle.sol[i]);
        over = true;
        BG.endScreen(el.querySelector('.panel').parentElement, {
          score: solved ? 400 : 0, bestKey: 'sudoku', win: solved,
          title: solved ? 'Jenius!' : 'Masih Salah', sub: solved ? 'Semua angka tepat.' : 'Ada angka yang salah, coba lagi!',
          scoreLabel: solved ? 'Benar!' : 'Salah',
          onRetry: () => rebuildGame(el, s, 'sudoku'),
        });
      }
    });
    render();
  }
});

/* ============ 25. TEBAK KATA (wordle) ============ */
BG.register({
  id: 'wordle', name: 'Tebak Kata', desc: 'Tebak kata Indonesia 5 huruf dalam 6 tebakan!', cat: 'puzzle', icon: 'wordle', tags: 'wordle tebak kata lima huruf',
  start(el, s) {
    const pool = ['BUNGA','HUJAN','MOBIL','RUMAH','GAJAH','PANCI','GELAS','LILIN','KASUR','PINTU','PAGAR','KEBUN','TAMAN','HUTAN','SAWAH','PULAU','JALAN','PASAR','MURID','SISWA','SOPIR','BEBEK','JERUK','NANAS','JAMBU','BAYAM','TOMAT','TALAS','BERAS','GARAM','TELUR','GULAI','SAYUR','PAKET','HARGA','CINTA','RINDU','TAKUT','MARAH','SEDIH','INDAH','JELEK','BESAR','KECIL','CEPAT','KOTOR','BASAH','GELAP','SUNYI','RAMAI','PENUH','SEMUA','ORANG','TEMAN','KAWAN','BAPAK','KAKAK','PAMAN','KAKEK','NENEK','KELAS','PAPAN','KAPUR','KAMAR','DAPUR','RUANG','UJUNG','SUDUT','BULAT','KOTAK','GARIS','TITIK','WARNA','MERAH','HIJAU','PUTIH','HITAM'].filter(w => w.length === 5);
    const answer = BG.pick(pool);
    const ROWS_MAX = 6, LEN = answer.length;
    let guesses = [], current = '', over = false;

    el.innerHTML = '<div class="panel center-col" style="max-width:380px"><h3>Tebak Kata (' + LEN + ' huruf)</h3>' +
      '<div id="wl-grid"></div>' +
      '<p id="wl-msg" style="min-height:1.4em;text-align:center;font-weight:800;color:#ffd23f"></p>' +
      '<div id="wl-kb" style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center"></div></div>';
    const gridEl = el.querySelector('#wl-grid'), msgEl = el.querySelector('#wl-msg'), kbEl = el.querySelector('#wl-kb');

    const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    function renderKb(states) {
      kbEl.innerHTML = KEY_ROWS.map(row => row.split('').map(ch =>
        '<button class="choice-btn" data-k="' + ch + '" style="padding:10px 0;min-width:30px;font-size:.8rem;' +
          (states[ch] === 'correct' ? 'background:#22c55e;color:#241239;' : states[ch] === 'present' ? 'background:#eab308;color:#241239;' : states[ch] === 'absent' ? 'opacity:.4;' : '') +
        '">' + ch + '</button>').join('')).join('') +
        '<button class="choice-btn" data-k="ENTER" style="padding:10px 12px;font-size:.7rem;background:#4ecdc4;color:#241239">OK</button>' +
        '<button class="choice-btn" data-k="BKSP" style="padding:10px 12px;font-size:.8rem">⌫</button>';
    }
    function evaluate(guess) {
      const res = Array(LEN).fill('absent'), ans = answer.split('');
      for (let i = 0; i < LEN; i++) if (guess[i] === ans[i]) { res[i] = 'correct'; ans[i] = null; }
      for (let i = 0; i < LEN; i++) {
        if (res[i] === 'correct') continue;
        const j = ans.indexOf(guess[i]);
        if (j >= 0) { res[i] = 'present'; ans[j] = null; }
      }
      return res;
    }
    function render() {
      let html = '';
      for (let r = 0; r < ROWS_MAX; r++) {
        html += '<div class="word-row">';
        for (let c = 0; c < LEN; c++) {
          let ch = '', cls = 'word-cell';
          if (r < guesses.length) { ch = guesses[r].word[c]; cls += ' ' + guesses[r].res[c]; }
          else if (r === guesses.length) ch = current[c] || '';
          html += '<div class="' + cls + '">' + ch + '</div>';
        }
        html += '</div>';
      }
      gridEl.innerHTML = html;
      const states = {};
      guesses.forEach(g => g.word.split('').forEach((ch, i) => {
        const cur = states[ch], rank = { absent: 1, present: 2, correct: 3 };
        if (!cur || rank[g.res[i]] > rank[cur]) states[ch] = g.res[i];
      }));
      renderKb(states);
    }
    function submit() {
      if (current.length !== LEN) { msgEl.textContent = 'Kurang hurufnya!'; BG.sfx('bad'); return; }
      const res = evaluate(current);
      guesses.push({ word: current, res });
      const win = current === answer;
      current = '';
      if (win || guesses.length >= ROWS_MAX) {
        over = true; render();
        BG.endScreen(el.querySelector('.panel').parentElement, {
          score: win ? (7 - guesses.length) * 100 : 0, bestKey: 'wordle', win,
          title: win ? 'Hebat!' : 'Yah, Mentok!', sub: win ? 'Kata "' + answer + '" ketahuan!' : 'Katanya: ' + answer,
          scoreLabel: win ? guesses.length + '/6' : 'Gagal',
          onRetry: () => rebuildGame(el, s, 'wordle'),
        });
        return;
      }
      BG.sfx(win ? 'win' : 'click'); msgEl.textContent = ''; render();
    }
    kbEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-k]'); if (!btn || over) return;
      const k = btn.dataset.k;
      if (k === 'ENTER') return submit();
      if (k === 'BKSP') { current = current.slice(0, -1); BG.sfx('click'); render(); return; }
      if (current.length < LEN) { current += k; BG.sfx('click'); render(); }
    });
    s.on(window, 'keydown', e => {
      if (over) return;
      const k = e.key.toUpperCase();
      if (k === 'ENTER') return submit();
      if (k === 'BACKSPACE') { current = current.slice(0, -1); render(); return; }
      if (/^[A-Z]$/.test(k) && current.length < LEN) { current += k; render(); }
    });
    render();
  }
});

/* ============ 26. KAPAL BUG (battleship) ============ */
BG.register({
  id: 'battleship', name: 'Kapal Bug', desc: 'Tenggelamkan kapal komputer duluan!', cat: 'puzzle', icon: 'battleship', tags: 'batalship kapal battleship tembak laut',
  start(el, s) {
    const N = 6, SHIPS = [3, 2, 2];
    el.innerHTML = '<div class="panel center-col" style="max-width:420px"><h3>Tembak Lautan Musuh!</h3>' +
      '<div class="board" id="bs-board" style="grid-template-columns:repeat(6,48px);grid-auto-rows:48px;gap:4px"></div>' +
      '<p id="bs-status" style="text-align:center;font-weight:800;color:#ffd23f">Ketuk kotak untuk menembak!</p>' +
      '<p style="text-align:center;font-size:.75rem;color:#b8a6d9">Kapal musuh: 3, 2, 2 petak. Kapal kamu sudah ditempatkan otomatis.</p></div>';
    const boardEl = el.querySelector('#bs-board'), status = el.querySelector('#bs-status');

    function placeShips() {
      const g = Array.from({ length: N }, () => Array(N).fill(0));
      for (const size of SHIPS) {
        for (let tries = 0; tries < 300; tries++) {
          const horiz = Math.random() < .5;
          const r = horiz ? BG.rand(0, N - 1) : BG.rand(0, N - size);
          const c = horiz ? BG.rand(0, N - size) : BG.rand(0, N - 1);
          let ok = true;
          for (let i = 0; i < size; i++) { if (horiz ? g[r][c + i] : g[r + i][c]) { ok = false; break; } }
          if (!ok) continue;
          for (let i = 0; i < size; i++) { if (horiz) g[r][c + i] = 1; else g[r + i][c] = 1; }
          break;
        }
      }
      return g;
    }
    const enemy = placeShips(), mine = placeShips();
    let shots = new Set(), enemyShots = new Set(), over = false;

    function remaining(g, shotSet, mark) {
      let left = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] === 1) {
        const key = r + ',' + c;
        if (mark === 'enemy' ? !shotSet.has(key) : !shotSet.has(key)) left++;
      }
      return left;
    }
    function render(reveal) {
      let html = '';
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const key = r + ',' + c, fired = shots.has(key);
        let content = '≈', bg = '#0e7490';
        if (fired) { if (enemy[r][c] === 1) { content = '💥'; bg = '#b91c1c'; } else { content = '•'; bg = '#155e75'; } }
        else if (reveal && enemy[r][c] === 1) { content = '🚢'; bg = '#7f1d1d'; }
        html += '<button class="cell" data-r="' + r + '" data-c="' + c + '" style="background:' + bg + ';font-size:1.2rem">' + content + '</button>';
      }
      boardEl.innerHTML = html;
    }
    boardEl.addEventListener('click', e => {
      const cell = e.target.closest('.cell'); if (!cell || over) return;
      const r = +cell.dataset.r, c = +cell.dataset.c, key = r + ',' + c;
      if (shots.has(key)) return;
      shots.add(key);
      const hit = enemy[r][c] === 1;
      BG.sfx(hit ? 'pop' : 'click');
      status.textContent = hit ? 'KENA! Tembak lagi!' : 'Meleset... giliran komputer.';
      const enemyLeft = remaining(enemy, shots, 'enemy');
      if (enemyLeft === 0) { over = true; render(true); return finish(true); }
      if (!hit) s.timeout(aiTurn, 650);
      render();
    });
    function aiTurn() {
      if (over) return;
      /* AI memburu petak yang mungkin: acak dari yang belum ditembak */
      const options = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!enemyShots.has(r + ',' + c)) options.push([r, c]);
      /* prioritaskan sebelah tebakan kena sebelumnya */
      const hits = [...enemyShots].filter(k => { const [r, c] = k.split(',').map(Number); return mine[r][c] === 1; });
      let target = null;
      for (const k of hits) {
        const [r, c] = k.split(',').map(Number);
        for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
          const nr = r + dr, nc = c + dc, nk = nr + ',' + nc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N && !enemyShots.has(nk)) { target = [nr, nc]; break; }
        }
        if (target) break;
      }
      const [r, c] = target || BG.pick(options);
      enemyShots.add(r + ',' + c);
      BG.sfx(mine[r][c] === 1 ? 'bad' : 'click');
      const mineLeft = remaining(mine, enemyShots, 'mine');
      status.textContent = mine[r][c] === 1 ? 'Kapalmu kena!' : 'Komputer meleset. Giliranmu!';
      if (mineLeft === 0) { over = true; render(true); return finish(false); }
      render();
    }
    function finish(win) {
      BG.endScreen(el.querySelector('.panel').parentElement, {
        score: win ? 1000 - enemyShots.size * 20 : 0, bestKey: 'battleship', win,
        title: win ? 'Armada Musnah!' : 'Kapalmu Tenggelam!',
        sub: win ? 'Semua kapal musuh karam.' : 'Komputer lebih dulu menenggelamkan armadamu.',
        scoreLabel: win ? 'Menang' : 'Kalah',
        onRetry: () => rebuildGame(el, s, 'battleship'),
      });
    }
    render();
  }
});

/* ============ 27. DOTS & BOXES ============ */
BG.register({
  id: 'dotsbox', name: 'Dots and Boxes', desc: 'Tutup kotak dengan garis, lawan AI!', cat: 'puzzle', icon: 'dotsbox', tags: 'dots and boxes garis kotak',
  start(el, s) {
    const DOTS = 4, BOX = DOTS - 1;
    el.innerHTML = '<div class="panel center-col" style="max-width:340px"><h3>Dots and Boxes</h3>' +
      '<div class="hud" style="width:100%">' + BG.hudPill('Kamu', 'db-you') + BG.hudPill('AI', 'db-ai') + '</div>' +
      '<div id="db-board" style="position:relative;width:240px;height:240px;margin:6px auto"></div>' +
      '<p id="db-status" style="text-align:center;font-weight:800;color:#ffd23f">Giliranmu! Ketuk garis.</p></div>';
    const boardEl = el.querySelector('#db-board'), youEl = el.querySelector('#db-you'), aiEl = el.querySelector('#db-ai'), status = el.querySelector('#db-status');
    /* garis horizontal & vertikal */
    let hLines = Array.from({ length: DOTS }, () => Array(BOX).fill(false));
    let vLines = Array.from({ length: BOX }, () => Array(DOTS).fill(false));
    let boxes = Array.from({ length: BOX }, () => Array(BOX).fill(0)); /* 0 kosong, 1 kamu, 2 ai */
    let you = 0, ai = 0, over = false, turn = 1;

    const dot = i => i * 70 + 20;
    function lineKey(t, r, c) { return t + ':' + r + ',' + c; }
    function hasLine(t, r, c) { return t === 'h' ? hLines[r][c] : vLines[r][c]; }
    function setLine(t, r, c) { if (t === 'h') hLines[r][c] = true; else vLines[r][c] = true; }
    function boxEdges(r, c) { return [hLines[r][c], hLines[r + 1][c], vLines[r][c], vLines[r][c + 1]]; }
    function boxesCompletedBy(t, r, c) {
      const done = [];
      const around = t === 'h' ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]];
      for (const [br, bc] of around) {
        if (br < 0 || br >= BOX || bc < 0 || bc >= BOX) continue;
        if (boxes[br][bc]) continue;
        if (boxEdges(br, bc).every(Boolean)) done.push([br, bc]);
      }
      return done;
    }
    function render() {
      let html = '';
      /* titik */
      for (let r = 0; r < DOTS; r++) for (let c = 0; c < DOTS; c++) html += '<div style="position:absolute;left:' + (dot(c) - 6) + 'px;top:' + (dot(r) - 6) + 'px;width:12px;height:12px;border-radius:50%;background:#ffd23f;border:2px solid #241239"></div>';
      /* kotak */
      for (let r = 0; r < BOX; r++) for (let c = 0; c < BOX; c++) if (boxes[r][c]) html += '<div style="position:absolute;left:' + (dot(c) + 4) + 'px;top:' + (dot(r) + 4) + 'px;width:62px;height:62px;border-radius:8px;background:' + (boxes[r][c] === 1 ? 'rgba(255,210,63,.35)' : 'rgba(255,107,157,.35)') + ';display:grid;place-items:center;font-size:1.4rem">' + (boxes[r][c] === 1 ? '🐛' : '🤖') + '</div>';
      /* garis horizontal */
      for (let r = 0; r < DOTS; r++) for (let c = 0; c < BOX; c++) html += '<button data-t="h" data-r="' + r + '" data-c="' + c + '" aria-label="garis" style="position:absolute;left:' + (dot(c) + 2) + 'px;top:' + (dot(r) - 7) + 'px;width:66px;height:14px;border:none;border-radius:7px;cursor:pointer;background:' + (hLines[r][c] ? '#4ecdc4' : 'rgba(255,255,255,.14)') + '"></button>';
      /* garis vertikal */
      for (let r = 0; r < BOX; r++) for (let c = 0; c < DOTS; c++) html += '<button data-t="v" data-r="' + r + '" data-c="' + c + '" aria-label="garis" style="position:absolute;left:' + (dot(c) - 7) + 'px;top:' + (dot(r) + 2) + 'px;width:14px;height:66px;border:none;border-radius:7px;cursor:pointer;background:' + (vLines[r][c] ? '#4ecdc4' : 'rgba(255,255,255,.14)') + '"></button>';
      boardEl.innerHTML = html;
      youEl.textContent = you; aiEl.textContent = ai;
    }
    function allLines() {
      const out = [];
      for (let r = 0; r < DOTS; r++) for (let c = 0; c < BOX; c++) if (!hLines[r][c]) out.push(['h', r, c]);
      for (let r = 0; r < BOX; r++) for (let c = 0; c < DOTS; c++) if (!vLines[r][c]) out.push(['v', r, c]);
      return out;
    }
    function applyMove(t, r, c, who) {
      setLine(t, r, c);
      const done = boxesCompletedBy(t, r, c);
      done.forEach(([br, bc]) => { boxes[br][bc] = who; who === 1 ? you++ : ai++; });
      return done.length;
    }
    boardEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-t]'); if (!btn || over || turn !== 1) return;
      const t = btn.dataset.t, r = +btn.dataset.r, c = +btn.dataset.c;
      if (hasLine(t, r, c)) return;
      const gained = applyMove(t, r, c, 1);
      BG.sfx(gained ? 'coin' : 'click');
      render();
      if (allLines().length === 0) return finish();
      if (gained > 0) { status.textContent = 'Kotak milikmu! Lanjut lagi.'; return; }
      turn = 2; status.textContent = 'AI mikir...';
      s.timeout(aiMove, 550);
    });
    function aiMove() {
      if (over) return;
      const lines = allLines();
      /* 1. selesaikan kotak kalau bisa */
      for (const [t, r, c] of lines) { setLine(t, r, c); const done = boxesCompletedBy(t, r, c); setLineUndo(t, r, c); if (done.length) { doAi(t, r, c); return; } }
      /* 2. hindari kasih kotak: pilih garis yang tidak melengkapi kotak lawan */
      const safe = lines.filter(([t, r, c]) => {
        setLine(t, r, c);
        const gives = boxesCompletedBy(t, r, c).length > 0;
        setLineUndo(t, r, c);
        return !gives;
      });
      const pickLine = safe.length ? BG.pick(safe) : BG.pick(lines);
      doAi(pickLine[0], pickLine[1], pickLine[2]);
    }
    function setLineUndo(t, r, c) { if (t === 'h') hLines[r][c] = false; else vLines[r][c] = false; }
    function doAi(t, r, c) {
      const gained = applyMove(t, r, c, 2);
      BG.sfx(gained ? 'bad' : 'click');
      render();
      if (allLines().length === 0) return finish();
      if (gained > 0) { status.textContent = 'AI dapat kotak! Dia lanjut...'; s.timeout(aiMove, 550); return; }
      turn = 1; status.textContent = 'Giliranmu!';
    }
    function finish() {
      over = true;
      const win = you > ai;
      BG.endScreen(el.querySelector('.panel').parentElement, {
        score: you * 100, bestKey: 'dotsbox', win,
        title: you === ai ? 'Seri!' : win ? 'Kamu Menang!' : 'AI Menang!',
        sub: 'Kotak kamu ' + you + ' — ' + ai + ' AI.',
        scoreLabel: you + ' - ' + ai,
        onRetry: () => rebuildGame(el, s, 'dotsbox'),
      });
    }
    render();
  }
});
