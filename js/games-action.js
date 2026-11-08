/* Buggames — Game ARCADE (canvas) */
'use strict';

/* helper gambar bug mini */
function drawMiniBug(ctx, x, y, r, body) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.strokeStyle = '#241239';
  ctx.fillStyle = body || '#b9f542';
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -r * 0.85); ctx.lineTo(0, r * 0.85); ctx.stroke();
  ctx.fillStyle = '#241239';
  ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.15, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.15, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function heart(ctx, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 16, s / 16);
  ctx.fillStyle = color || '#ff5a5a'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-11, -3, -7, -10, 0, -5); ctx.bezierCurveTo(7, -10, 11, -3, 0, 5);
  ctx.fill(); ctx.stroke(); ctx.restore();
}
function stageWrap(el, hudHtml, canvasW, canvasH) {
  el.innerHTML = '<div class="stage"><div class="hud">' + hudHtml + '</div>' +
    '<canvas width="' + canvasW + '" height="' + canvasH + '"></canvas></div>';
  return { stage: el.firstElementChild, canvas: el.querySelector('canvas') };
}

/* ============ 1. ULAR BUG ============ */
BG.register({
  id: 'snake', name: 'Ular Bug', desc: 'Makan bug sebanyak mungkin, jangan nabrak!', cat: 'arcade', icon: 'snake', tags: 'ular arcade klasik',
  start(el, s) {
    const W = 480, H = 400, CELL = 20, COLS = W / CELL, ROWS = H / CELL;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'snk-score') + BG.hudPill('Level', 'snk-level'), W, H);
    const ctx = canvas.getContext('2d');
    let snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    let dir = { x: 1, y: 0 }, nextDir = dir, food = null, score = 0, speed = 150, dead = false, acc = 0;
    const scoreEl = el.querySelector('#snk-score'), levelEl = el.querySelector('#snk-level');

    function placeFood() {
      do { food = { x: BG.rand(0, COLS - 1), y: BG.rand(0, ROWS - 1) }; }
      while (snake.some(seg => seg.x === food.x && seg.y === food.y));
    }
    placeFood();

    function setDir(x, y) { if (x === -dir.x && y === -dir.y) return; nextDir = { x, y }; }
    s.on(window, 'keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') setDir(0, -1);
      else if (k === 'arrowdown' || k === 's') setDir(0, 1);
      else if (k === 'arrowleft' || k === 'a') setDir(-1, 0);
      else if (k === 'arrowright' || k === 'd') setDir(1, 0);
    });
    let touchStart = null;
    s.on(canvas, 'pointerdown', e => { touchStart = { x: e.clientX, y: e.clientY }; });
    s.on(canvas, 'pointerup', e => {
      if (!touchStart) return;
      const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0); else setDir(0, dy > 0 ? 1 : -1);
      touchStart = null;
    });

    function step() {
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        dead = true; BG.sfx('bad');
        BG.endScreen(canvas.parentElement, { score, bestKey: 'snake', title: 'Nabrak!', sub: 'Ular bug-mu menabrak. Hati-hati ya!', onRetry: () => { const p = canvas.closest('.stage').parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'snake').start(p, s); } });
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10; BG.sfx('coin');
        speed = Math.max(70, speed - 6);
        scoreEl.textContent = score; levelEl.textContent = Math.floor(score / 50) + 1;
        placeFood();
      } else snake.pop();
    }

    let last = 0;
    s.raf(t => {
      if (dead) { draw(); return; }
      if (!last) last = t;
      acc += t - last; last = t;
      if (acc >= speed) { acc = 0; step(); }
      draw();
    });

    function draw() {
      ctx.fillStyle = '#17102a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let x = 0; x < COLS; x += 2) for (let y = 0; y < ROWS; y += 2) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      drawMiniBug(ctx, food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 8, '#ff5a5a');
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#b9f542' : '#5fbf2a';
        ctx.strokeStyle = '#241239'; ctx.lineWidth = 2;
        const p = 2;
        ctx.beginPath(); ctx.roundRect(seg.x * CELL + p, seg.y * CELL + p, CELL - p * 2, CELL - p * 2, 6); ctx.fill(); ctx.stroke();
        if (i === 0) {
          ctx.fillStyle = '#241239';
          ctx.beginPath(); ctx.arc(seg.x * CELL + CELL * 0.35, seg.y * CELL + CELL * 0.4, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(seg.x * CELL + CELL * 0.65, seg.y * CELL + CELL * 0.4, 2, 0, Math.PI * 2); ctx.fill();
        }
      });
    }
  }
});

/* ============ 2. BREAKOUT BUG ============ */
BG.register({
  id: 'breakout', name: 'Breakout Bug', desc: 'Hancurkan semua bata dengan bola!', cat: 'arcade', icon: 'breakout', tags: 'breakout arkanoid bata',
  start(el, s) {
    const W = 480, H = 420;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'brk-score') + BG.hudPill('Nyawa', 'brk-lives'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#brk-score'), livesEl = el.querySelector('#brk-lives');
    let score = 0, lives = 3, over = false;
    const paddle = { x: W / 2 - 45, y: H - 26, w: 90, h: 12 };
    const ball = { x: W / 2, y: H - 60, vx: 3.4 * (Math.random() < .5 ? 1 : -1), vy: -3.8, r: 7 };
    const rows = 5, cols = 8, bw = 48, bh = 17, gap = 6, ox = (W - cols * (bw + gap) + gap) / 2, oy = 42;
    const colors = ['#ff6b9d', '#ffd23f', '#4ecdc4', '#a3e635', '#a78bfa'];
    let bricks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      bricks.push({ x: ox + c * (bw + gap), y: oy + r * (bh + gap), w: bw, h: bh, color: colors[r], alive: true });

    function movePaddle(clientX) {
      const r = canvas.getBoundingClientRect();
      paddle.x = (clientX - r.left) * W / r.width - paddle.w / 2;
      paddle.x = Math.max(4, Math.min(W - paddle.w - 4, paddle.x));
    }
    s.on(canvas, 'pointermove', e => movePaddle(e.clientX));
    s.on(canvas, 'pointerdown', e => movePaddle(e.clientX));

    s.raf(() => {
      if (over) return;
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
      if (ball.y < ball.r) ball.vy *= -1;
      if (ball.y > H + 20) {
        lives--; BG.sfx('bad'); livesEl.textContent = lives;
        if (lives <= 0) {
          over = true;
          BG.endScreen(canvas.parentElement, { score, bestKey: 'breakout', title: 'Bola Hilang!', sub: 'Bata belum hancur semua.', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'breakout').start(p, s); } });
          return;
        }
        ball.x = W / 2; ball.y = H - 60; ball.vx = 3.4 * (Math.random() < .5 ? 1 : -1); ball.vy = -3.8;
      }
      if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y < paddle.y + paddle.h && ball.x > paddle.x - 6 && ball.x < paddle.x + paddle.w + 6) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx = ((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)) * 4.5;
        BG.sfx('hit');
      }
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x > b.x - ball.r && ball.x < b.x + b.w + ball.r && ball.y > b.y - ball.r && ball.y < b.y + b.h + ball.r) {
          b.alive = false; ball.vy *= -1; score += 10; BG.sfx('pop'); scoreEl.textContent = score;
          break;
        }
      }
      if (bricks.every(b => !b.alive)) {
        over = true; score += 200;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'breakout', title: 'Bersih!', sub: 'Semua bata hancur. Buggy bangga!', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'breakout').start(p, s); } });
      }
      /* gambar */
      ctx.fillStyle = '#17102a'; ctx.fillRect(0, 0, W, H);
      bricks.forEach(b => { if (!b.alive) return; ctx.fillStyle = b.color; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 5); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#4ecdc4'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    livesEl.textContent = lives;
  }
});

/* ============ 3. PONG LAWAN AI ============ */
BG.register({
  id: 'pong', name: 'Pong Buggy', desc: 'Duel tenis meja vs komputer. Duluan 7 menang!', cat: 'arcade', icon: 'pong', tags: 'pong tenis vs ai',
  start(el, s) {
    const W = 480, H = 360;
    const { canvas } = stageWrap(el, BG.hudPill('Kamu', 'png-p') + BG.hudPill('Komputer', 'png-a'), W, H);
    const ctx = canvas.getContext('2d');
    const pEl = el.querySelector('#png-p'), aEl = el.querySelector('#png-a');
    let pScore = 0, aScore = 0, over = false;
    const ph = 74, pw = 12, aiH = 74;
    const player = { x: 16, y: H / 2 - ph / 2 }, ai = { x: W - 28, y: H / 2 - aiH / 2 };
    const ball = { x: W / 2, y: H / 2, vx: 4.2 * (Math.random() < .5 ? 1 : -1), vy: 2.4, r: 8 };

    s.on(canvas, 'pointermove', e => {
      const r = canvas.getBoundingClientRect();
      player.y = (e.clientY - r.top) * H / r.height - ph / 2;
      player.y = Math.max(0, Math.min(H - ph, player.y));
    });

    function resetBall(dir) { ball.x = W / 2; ball.y = H / 2; ball.vx = 4.2 * dir; ball.vy = (Math.random() * 4 - 2); }

    s.raf(() => {
      if (over) return;
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.y < ball.r || ball.y > H - ball.r) ball.vy *= -1;
      /* AI ngikutin bola pelan-pelan */
      const target = ball.y - aiH / 2;
      ai.y += Math.max(-3.1, Math.min(3.1, (target - ai.y) * 0.09));
      ai.y = Math.max(0, Math.min(H - aiH, ai.y));
      /* tabrakan paddle */
      if (ball.vx < 0 && ball.x - ball.r < player.x + pw && ball.x > player.x && ball.y > player.y - 6 && ball.y < player.y + ph + 6) {
        ball.vx = Math.min(9, Math.abs(ball.vx) * 1.08); ball.vy += ((ball.y - (player.y + ph / 2)) / (ph / 2)) * 2.2; BG.sfx('hit');
      }
      if (ball.vx > 0 && ball.x + ball.r > ai.x && ball.x < ai.x + pw && ball.y > ai.y - 6 && ball.y < ai.y + aiH + 6) {
        ball.vx = -Math.min(9, Math.abs(ball.vx) * 1.08); ball.vy += ((ball.y - (ai.y + aiH / 2)) / (aiH / 2)) * 2.2; BG.sfx('hit');
      }
      if (ball.x < -20) { aScore++; aEl.textContent = aScore; BG.sfx('bad'); resetBall(1); }
      if (ball.x > W + 20) { pScore++; pEl.textContent = pScore; BG.sfx('coin'); resetBall(-1); }
      if (pScore >= 7 || aScore >= 7) {
        over = true;
        const win = pScore >= 7;
        BG.endScreen(canvas.parentElement, { score: pScore * 100, bestKey: 'pong', win, title: win ? 'Menang!' : 'Kalah!', sub: 'Kamu ' + pScore + ' — ' + aScore + ' Komputer.', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'pong').start(p, s); } });
      }
      /* gambar */
      ctx.fillStyle = '#0d2418'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#4ecdc4'; ctx.lineWidth = 3; ctx.setLineDash([10, 12]);
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#4ecdc4'; ctx.fillRect(player.x, player.y, pw, ph);
      ctx.fillStyle = '#ff6b9d'; ctx.fillRect(ai.x, ai.y, pw, aiH);
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    });
  }
});

/* ============ 4. FLAPPY BUG ============ */
BG.register({
  id: 'flappy', name: 'Flappy Bug', desc: 'Kepakan sayap, hindari pipa!', cat: 'arcade', icon: 'flappy', tags: 'flappy terbang pipa',
  start(el, s) {
    const W = 420, H = 480;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'flp-score'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#flp-score');
    const bug = { x: 90, y: H / 2, vy: 0, r: 14 };
    let pipes = [], score = 0, over = false, frame = 0;
    const GAP = 148, SPEED = 2.35;

    function flap() { if (!over) { bug.vy = -6.4; BG.sfx('pop'); } }
    s.on(canvas, 'pointerdown', flap);
    s.on(window, 'keydown', e => { if (e.code === 'Space') { e.preventDefault(); flap(); } });

    function spawnPipe() { pipes.push({ x: W + 30, top: BG.rand(70, H - GAP - 90), passed: false }); }

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 95 === 0) spawnPipe();
      bug.vy += 0.34; bug.y += bug.vy;
      pipes.forEach(p => p.x -= SPEED);
      pipes = pipes.filter(p => p.x > -70);
      for (const p of pipes) {
        if (!p.passed && p.x + 30 < bug.x) { p.passed = true; score++; scoreEl.textContent = score; BG.sfx('coin'); }
        const inX = bug.x + bug.r > p.x && bug.x - bug.r < p.x + 56;
        if (inX && (bug.y - bug.r < p.top || bug.y + bug.r > p.top + GAP)) die();
      }
      if (bug.y > H - 20 || bug.y - bug.r < 0) die();
      /* gambar */
      ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      [[60, 90, 26], [220, 150, 20], [350, 60, 30]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + r, y + 6, r * 0.8, 0, Math.PI * 2); ctx.fill(); });
      pipes.forEach(p => {
        ctx.fillStyle = '#2f9e44'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(p.x, -4, 56, p.top, 8); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(p.x, p.top + GAP, 56, H - p.top - GAP + 4, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#43c465'; ctx.fillRect(p.x - 4, p.top - 14, 64, 16); ctx.fillRect(p.x - 4, p.top + GAP, 64, 16);
      });
      ctx.fillStyle = '#241239'; ctx.fillRect(0, H - 18, W, 18);
      drawMiniBug(ctx, bug.x, bug.y, bug.r, '#ffd23f');
    });
    function die() {
      if (over) return; over = true; BG.sfx('bad');
      BG.endScreen(canvas.parentElement, { score, bestKey: 'flappy', title: 'Jatuh!', sub: 'Kamu lewati ' + score + ' pipa.', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'flappy').start(p, s); } });
    }
  }
});

/* ============ 5. SPACE SHOOTER ============ */
BG.register({
  id: 'shooter', name: 'Bug Space Raid', desc: 'Tembak alien kutu dari luar angkasa!', cat: 'arcade', icon: 'shooter', tags: 'tembak space shooter alien',
  start(el, s) {
    const W = 420, H = 480;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'shp-score') + BG.hudPill('Nyawa', 'shp-lives'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#shp-score'), livesEl = el.querySelector('#shp-lives');
    let score = 0, lives = 3, over = false, frame = 0;
    const ship = { x: W / 2, y: H - 46, w: 40 };
    let bullets = [], enemies = [], enemyBullets = [], stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4 }));

    function moveShip(clientX) {
      const r = canvas.getBoundingClientRect();
      ship.x = Math.max(22, Math.min(W - 22, (clientX - r.left) * W / r.width));
    }
    s.on(canvas, 'pointermove', e => moveShip(e.clientX));
    s.on(canvas, 'pointerdown', e => { moveShip(e.clientX); fire(); });
    s.on(window, 'keydown', e => { if (e.code === 'Space') { e.preventDefault(); fire(); } });
    function fire() { if (over) return; bullets.push({ x: ship.x, y: ship.y - 18, vy: -7.5 }); BG.sfx('shoot'); }

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 52 === 0) enemies.push({ x: BG.rand(30, W - 30), y: -24, vy: 1.15 + frame / 1500, drift: Math.random() * 2 - 1 });
      bullets.forEach(b => b.y += b.vy);
      bullets = bullets.filter(b => b.y > -12);
      enemies.forEach(en => { en.y += en.vy; en.x += Math.sin((frame + en.y) / 40) * en.drift; if (Math.random() < 0.006) enemyBullets.push({ x: en.x, y: en.y + 12, vy: 3.4 }); });
      enemyBullets.forEach(b => b.y += b.vy);
      enemyBullets = enemyBullets.filter(b => b.y < H + 10);
      /* tabrakan peluru pemain vs musuh */
      for (const b of bullets) for (const en of enemies) {
        if (en.dead) continue;
        if (Math.abs(b.x - en.x) < 22 && Math.abs(b.y - en.y) < 16) { en.dead = true; b.dead = true; score += 10; scoreEl.textContent = score; BG.sfx('pop'); }
      }
      bullets = bullets.filter(b => !b.dead);
      /* musuh lolos atau nabrak */
      for (const en of enemies) {
        if (en.dead) continue;
        if (en.y > H - 30) { en.dead = true; lives--; livesEl.textContent = lives; BG.sfx('bad'); }
      }
      /* peluru musuh kena pemain */
      for (const b of enemyBullets) {
        if (Math.abs(b.x - ship.x) < 20 && Math.abs(b.y - ship.y) < 14) { b.dead = true; lives--; livesEl.textContent = lives; BG.sfx('bad'); }
      }
      enemyBullets = enemyBullets.filter(b => !b.dead);
      enemies = enemies.filter(e => !e.dead);
      stars.forEach(st => { st.y += 0.7; if (st.y > H) { st.y = 0; st.x = Math.random() * W; } });
      if (lives <= 0) {
        over = true;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'shooter', title: 'Pesawat Jatuh!', sub: 'Bumi aman... untuk saat ini.', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'shooter').start(p, s); } });
      }
      /* gambar */
      ctx.fillStyle = '#05051a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff'; stars.forEach(st => { ctx.globalAlpha = 0.4 + st.r * 0.3; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffd23f';
      bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 8, 4, 12));
      ctx.fillStyle = '#ff6b9d';
      enemyBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); });
      enemies.forEach(en => drawMiniBug(ctx, en.x, en.y, 13, '#ff6b9d'));
      /* pesawat */
      ctx.fillStyle = '#a78bfa'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ship.x, ship.y - 22); ctx.lineTo(ship.x + 20, ship.y + 14); ctx.lineTo(ship.x, ship.y + 6); ctx.lineTo(ship.x - 20, ship.y + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4ecdc4'; ctx.beginPath(); ctx.arc(ship.x, ship.y - 4, 5, 0, Math.PI * 2); ctx.fill();
    });
    livesEl.textContent = lives;
  }
});

/* ============ 6. WHACK-A-BUG ============ */
BG.register({
  id: 'whack', name: 'Pukul Bug!', desc: 'Pukul bug secepatnya sebelum ngumpet lagi!', cat: 'arcade', icon: 'whack', tags: 'pukul tikus whack mole',
  start(el, s) {
    const W = 420, H = 380;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'whk-score') + BG.hudPill('Waktu', 'whk-time'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#whk-score'), timeEl = el.querySelector('#whk-time');
    const HOLES = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) HOLES.push({ x: 70 + c * 140, y: 90 + r * 105 });
    let score = 0, timeLeft = 30, over = false, active = -1, golden = false, popAt = 0;

    s.interval(() => {
      if (over) return;
      timeLeft--; timeEl.textContent = timeLeft + 's';
      if (timeLeft <= 0) {
        over = true;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'whack', title: 'Waktu Habis!', sub: 'Bug yang kamu pukul: ' + (score / 10) + ' ekor.', scoreLabel: score, onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'whack').start(p, s); } });
      }
    }, 1000);
    s.interval(() => { if (!over) { active = BG.rand(0, 8); golden = Math.random() < 0.18; popAt = Date.now(); } }, 720);

    s.on(canvas, 'pointerdown', e => {
      if (over || active < 0) return;
      const p = BG.canvasPos(canvas, e);
      const hole = HOLES[active];
      if (Math.hypot(p.x - hole.x, p.y - hole.y) < 42 && Date.now() - popAt < 750) {
        score += golden ? 30 : 10; BG.sfx(golden ? 'coin' : 'pop'); scoreEl.textContent = score; active = -1;
      }
    });

    s.raf(() => {
      ctx.fillStyle = '#2d1b3d'; ctx.fillRect(0, 0, W, H);
      HOLES.forEach((h, i) => {
        ctx.fillStyle = '#140a24'; ctx.beginPath(); ctx.ellipse(h.x, h.y + 26, 46, 16, 0, 0, Math.PI * 2); ctx.fill();
        if (i === active && Date.now() - popAt < 750) {
          const up = Math.min(1, (Date.now() - popAt) / 110);
          drawMiniBug(ctx, h.x, h.y + 26 - 34 * up, 24, golden ? '#ffd23f' : '#b9f542');
        }
      });
    });
    timeEl.textContent = timeLeft + 's';
  }
});

/* ============ 7. BALON POP ============ */
BG.register({
  id: 'balloon', name: 'Balon Pop', desc: 'Letuskan balon yang naik ke langit!', cat: 'arcade', icon: 'balloon', tags: 'balon pop pecah',
  start(el, s) {
    const W = 420, H = 440;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'bln-score') + BG.hudPill('Waktu', 'bln-time'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#bln-score'), timeEl = el.querySelector('#bln-time');
    let balloons = [], score = 0, timeLeft = 30, over = false, frame = 0;
    const colors = ['#ff6b9d', '#4ecdc4', '#ffd23f', '#a3e635', '#a78bfa', '#fb923c'];

    s.interval(() => {
      if (over) return;
      timeLeft--; timeEl.textContent = timeLeft + 's';
      if (timeLeft <= 0) {
        over = true;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'balloon', title: 'Waktu Habis!', sub: 'Balon yang meletus: keren!', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'balloon').start(p, s); } });
      }
    }, 1000);

    s.on(canvas, 'pointerdown', e => {
      if (over) return;
      const p = BG.canvasPos(canvas, e);
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 6) {
          score += b.gold ? 30 : 10; BG.sfx(b.gold ? 'coin' : 'pop'); scoreEl.textContent = score; balloons.splice(i, 1); break;
        }
      }
    });

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 26 === 0) balloons.push({ x: BG.rand(34, W - 34), y: H + 40, r: BG.rand(20, 30), vy: 1.25 + Math.random() * 1.1 + frame / 1400, color: BG.pick(colors), gold: Math.random() < 0.12, sway: Math.random() * Math.PI * 2 });
      balloons.forEach(b => { b.y -= b.vy; b.sway += 0.02; b.x += Math.sin(b.sway) * 0.6; });
      balloons = balloons.filter(b => b.y > -60);
      ctx.fillStyle = '#1e3a5f'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      [[70, 70], [300, 120], [180, 40]].forEach(([x, y]) => { ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
      balloons.forEach(b => {
        ctx.fillStyle = b.gold ? '#ffd23f' : b.color; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 1.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(b.x, b.y + b.r * 1.15); ctx.lineTo(b.x - 4, b.y + b.r * 1.15 + 8); ctx.lineTo(b.x + 4, b.y + b.r * 1.15 + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    });
    timeEl.textContent = timeLeft + 's';
  }
});

/* ============ 8. HINDARI PESTISIDA ============ */
BG.register({
  id: 'dodge', name: 'Bug Dodge', desc: 'Hindari semprotan pestisida! Bertahanlah.', cat: 'arcade', icon: 'meteor', tags: 'hindari dodge pestisida bertahan',
  start(el, s) {
    const W = 420, H = 440;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'ddg-score') + BG.hudPill('Nyawa', 'ddg-lives'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#ddg-score'), livesEl = el.querySelector('#ddg-lives');
    let score = 0, lives = 3, over = false, frame = 0;
    const player = { x: W / 2, y: H - 46, r: 17 };
    let drops = [];

    function movePlayer(clientX) {
      const r = canvas.getBoundingClientRect();
      player.x = Math.max(player.r, Math.min(W - player.r, (clientX - r.left) * W / r.width));
    }
    s.on(canvas, 'pointermove', e => movePlayer(e.clientX));
    s.on(canvas, 'pointerdown', e => movePlayer(e.clientX));

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % Math.max(10, 34 - Math.floor(frame / 240)) === 0) drops.push({ x: Math.random() * W, y: -16, vy: 2.5 + frame / 420 + Math.random() * 1.5, r: BG.rand(7, 13) });
      if (frame % 30 === 0) { score += 10; scoreEl.textContent = score; }
      drops.forEach(d => d.y += d.vy);
      for (const d of drops) {
        if (!d.hit && Math.hypot(d.x - player.x, d.y - player.y) < d.r + player.r - 2) {
          d.hit = true; lives--; livesEl.textContent = lives; BG.sfx('bad');
        }
      }
      drops = drops.filter(d => d.y < H + 20 && !d.hit);
      if (lives <= 0) {
        over = true;
        BG.endScreen(canvas.parentElement, { score, bestKey: 'dodge', title: 'Kena Semprot!', sub: 'Kamu bertahan dengan skor ' + score + '.', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'dodge').start(p, s); } });
      }
      /* gambar: taman */
      ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#166534'; for (let i = 0; i < 6; i++) ctx.fillRect(i * 80 + 20, H - 30, 40, 30);
      ctx.fillStyle = '#86efac';
      drops.forEach(d => { ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * 0.7, d.r, 0, 0, Math.PI * 2); ctx.fill(); });
      drawMiniBug(ctx, player.x, player.y, player.r, '#ffd23f');
      for (let i = 0; i < 3; i++) if (i < lives) heart(ctx, 24 + i * 30, 22, 18);
    });
    livesEl.textContent = lives;
  }
});

/* ============ 9. LARI BUG (endless runner) ============ */
BG.register({
  id: 'dino', name: 'Lari Bug!', desc: 'Lompat kaktus, lari sejauh-jauhnya!', cat: 'arcade', icon: 'runner', tags: 'lari dino runner lompat endless',
  start(el, s) {
    const W = 480, H = 260;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'din-score') + BG.hudPill('Kecepatan', 'din-speed'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#din-score'), speedEl = el.querySelector('#din-speed');
    const bug = { y: H - 46, vy: 0, r: 15, grounded: true };
    let obstacles = [], score = 0, speed = 5, over = false, frame = 0;
    const GRAV = 0.55, JUMP = -11.5, GROUND = H - 46;

    function jump() { if (over) return; if (bug.grounded) { bug.vy = JUMP; bug.grounded = false; BG.sfx('pop'); } }
    s.on(canvas, 'pointerdown', jump);
    s.on(window, 'keydown', e => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } });

    s.raf(() => {
      if (over) return;
      frame++;
      speed = 5 + Math.floor(frame / 260);
      speedEl.textContent = 'x' + (speed / 5).toFixed(1);
      score++; scoreEl.textContent = Math.floor(score / 6);
      if (frame % Math.max(38, 78 - Math.floor(frame / 70)) === 0) obstacles.push({ x: W + 20, w: BG.rand(16, 30), h: BG.rand(28, 52) });
      bug.vy += GRAV; bug.y += bug.vy;
      if (bug.y >= GROUND) { bug.y = GROUND; bug.vy = 0; bug.grounded = true; }
      obstacles.forEach(o => o.x -= speed);
      obstacles = obstacles.filter(o => o.x > -40);
      for (const o of obstacles) {
        if (60 + bug.r > o.x && 60 - bug.r < o.x + o.w && bug.y + bug.r > H - 18 - o.h) { die(); return; }
      }
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fde68a'; ctx.fillRect(0, H - 18, W, 18);
      ctx.fillStyle = '#241239';
      obstacles.forEach(o => { ctx.fillRect(o.x, H - 18 - o.h, o.w, o.h); ctx.fillRect(o.x + o.w / 2 - 3, H - 18 - o.h - 8, 6, 8); });
      drawMiniBug(ctx, 60, bug.y, bug.r, '#b9f542');
    });
    function die() {
      over = true; BG.sfx('bad');
      BG.endScreen(canvas.parentElement, { score: Math.floor(score / 6), bestKey: 'dino', title: 'Kejatuhan Kaktus!', sub: 'Lari sejauh ' + Math.floor(score / 6) + ' meter.', scoreLabel: Math.floor(score / 6) + ' m', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'dino').start(p, s); } });
    }
  }
});

/* ============ 10. TANGKAP BUG ============ */
BG.register({
  id: 'catch', name: 'Tangkap Bug', desc: 'Tangkap bug merah, hindari kutu busuk!', cat: 'arcade', icon: 'basket', tags: 'tangkap catch ember daun',
  start(el, s) {
    const W = 420, H = 440;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'cat-score') + BG.hudPill('Nyawa', 'cat-lives') + BG.hudPill('Waktu', 'cat-time'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#cat-score'), livesEl = el.querySelector('#cat-lives'), timeEl = el.querySelector('#cat-time');
    let score = 0, lives = 3, timeLeft = 45, over = false, frame = 0;
    const basket = { x: W / 2, w: 78, y: H - 40 };
    let bugs = [];

    function moveBasket(clientX) {
      const r = canvas.getBoundingClientRect();
      basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, (clientX - r.left) * W / r.width));
    }
    s.on(canvas, 'pointermove', e => moveBasket(e.clientX));
    s.on(canvas, 'pointerdown', e => moveBasket(e.clientX));
    s.interval(() => {
      if (over) return;
      timeLeft--; timeEl.textContent = timeLeft + 's';
      if (timeLeft <= 0) finish();
    }, 1000);

    s.raf(() => {
      if (over) return;
      frame++;
      if (frame % 34 === 0) bugs.push({ x: Math.random() * (W - 40) + 20, y: -16, vy: 1.6 + Math.random() * 1.4 + frame / 1600, stink: Math.random() < 0.24, sway: Math.random() * 6 });
      bugs.forEach(b => { b.y += b.vy; b.sway += 0.03; b.x += Math.sin(b.sway) * 0.7; });
      for (const b of bugs) {
        if (!b.dead && b.y > basket.y - 8 && Math.abs(b.x - basket.x) < basket.w / 2 + 6) {
          b.dead = true;
          if (b.stink) { lives--; livesEl.textContent = lives; BG.sfx('bad'); }
          else { score += 10; scoreEl.textContent = score; BG.sfx('coin'); }
        }
      }
      bugs = bugs.filter(b => b.y < H + 20 && !b.dead);
      if (lives <= 0) finish();
      ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#166534'; ctx.fillRect(0, H - 16, W, 16);
      bugs.forEach(b => drawMiniBug(ctx, b.x, b.y, 11, b.stink ? '#a16207' : '#ff5a5a'));
      /* keranjang daun */
      ctx.fillStyle = '#fb923c'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(basket.x - basket.w / 2, basket.y); ctx.lineTo(basket.x + basket.w / 2, basket.y); ctx.lineTo(basket.x + basket.w / 2 - 8, basket.y + 24); ctx.lineTo(basket.x - basket.w / 2 + 8, basket.y + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i++) if (i < lives) heart(ctx, 22 + i * 28, 20, 16);
    });
    function finish() {
      if (over) return; over = true;
      BG.endScreen(canvas.parentElement, { score, bestKey: 'catch', title: lives <= 0 ? 'Keracunan!' : 'Waktu Habis!', sub: 'Bug tertangkap: ' + score / 10 + ' ekor.', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'catch').start(p, s); } });
    }
    livesEl.textContent = lives; timeEl.textContent = timeLeft + 's';
  }
});

/* ============ 11. STACK TOWER ============ */
BG.register({
  id: 'stack', name: 'Stack Tower', desc: 'Susun balok setinggi mungkin. Timing adalah segalanya!', cat: 'arcade', icon: 'stack', tags: 'stack tower susun timing',
  start(el, s) {
    const W = 360, H = 480;
    const { canvas } = stageWrap(el, BG.hudPill('Tinggi', 'stk-score'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#stk-score');
    const COLORS = ['#ff6b9d', '#ffd23f', '#4ecdc4', '#a3e635', '#a78bfa', '#fb923c'];
    let blocks = [{ x: W / 2 - 70, y: H - 50, w: 140, h: 26, color: COLORS[0] }];
    let current = null, dir = 1, speed = 2.6, score = 0, over = false, cameraY = 0;

    function newBlock() {
      const prev = blocks[blocks.length - 1];
      current = { x: dir > 0 ? -prev.w : W, y: prev.y - 27, w: prev.w, h: 26, color: COLORS[blocks.length % COLORS.length] };
    }
    newBlock();

    function drop() {
      if (over || !current) return;
      const prev = blocks[blocks.length - 1];
      const left = Math.max(current.x, prev.x), right = Math.min(current.x + current.w, prev.x + prev.w);
      if (right - left <= 4) {
        over = true; BG.sfx('bad');
        BG.endScreen(canvas.parentElement, { score, bestKey: 'stack', title: 'Roboh!', sub: 'Menara setinggi ' + score + ' balok.', scoreLabel: score, onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'stack').start(p, s); } });
        return;
      }
      current.x = left; current.w = right - left;
      blocks.push(current); score++; scoreEl.textContent = score; BG.sfx('hit');
      if (score % 4 === 0) speed += 0.5;
      current = null;
      /* kamera ikut naik kalau menara tinggi */
      if (blocks[blocks.length - 1].y < H / 2) cameraY = H / 2 - blocks[blocks.length - 1].y;
      newBlock();
    }
    s.on(canvas, 'pointerdown', drop);
    s.on(window, 'keydown', e => { if (e.code === 'Space') { e.preventDefault(); drop(); } });

    s.raf(() => {
      if (!over && current) {
        current.x += dir * speed;
        if (current.x + current.w > W && dir > 0) dir = -1;
        if (current.x < 0 && dir < 0) dir = 1;
      }
      ctx.fillStyle = '#150b26'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(0, cameraY);
      blocks.forEach(b => { ctx.fillStyle = b.color; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h); });
      if (current) { ctx.fillStyle = current.color; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3; ctx.fillRect(current.x, current.y, current.w, current.h); ctx.strokeRect(current.x, current.y, current.w, current.h); }
      ctx.restore();
    });
  }
});

/* ============ 12. PENALTI BUG ============ */
BG.register({
  id: 'penalty', name: 'Penalti Bug', desc: '5 tendangan penalti. Bobol gawangnya!', cat: 'arcade', icon: 'penalty', tags: 'penalti bola tendang gawang',
  start(el, s) {
    const W = 420, H = 400;
    const { canvas } = stageWrap(el, BG.hudPill('Gol', 'pen-score') + BG.hudPill('Sisa Tendangan', 'pen-left'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#pen-score'), leftEl = el.querySelector('#pen-left');
    let goals = 0, kicks = 5, ball = null, keeperZone = 1, msg = 'Klik di dalam gawang untuk menendang!', over = false;

    const GOAL = { x: 60, y: 70, w: W - 120, h: 110 };

    s.on(canvas, 'pointerdown', e => {
      if (over || ball) return;
      const p = BG.canvasPos(canvas, e);
      if (p.x > GOAL.x + 8 && p.x < GOAL.x + GOAL.w - 8 && p.y > GOAL.y && p.y < GOAL.y + GOAL.h) {
        keeperZone = BG.rand(0, 2);
        ball = { x: W / 2, y: H - 60, tx: p.x, ty: p.y, t: 0 };
        BG.sfx('shoot');
      }
    });

    s.raf(() => {
      /* gawang */
      ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
      ctx.strokeRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
      ctx.lineWidth = 1.5; ctx.globalAlpha = .5;
      for (let x = GOAL.x + 22; x < GOAL.x + GOAL.w; x += 22) { ctx.beginPath(); ctx.moveTo(x, GOAL.y); ctx.lineTo(x, GOAL.y + GOAL.h); ctx.stroke(); }
      ctx.globalAlpha = 1;
      /* keeper */
      const kw = GOAL.w / 3, keeperX = GOAL.x + keeperZone * kw + kw / 2;
      ctx.fillStyle = '#4ecdc4'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(keeperX - 20, GOAL.y + GOAL.h - 64, 40, 56, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd9b3'; ctx.beginPath(); ctx.arc(keeperX, GOAL.y + GOAL.h - 74, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      /* bola */
      if (ball) {
        ball.t += 0.035;
        const t = Math.min(1, ball.t), ease = 1 - Math.pow(1 - t, 2);
        const bx = ball.x + (ball.tx - ball.x) * ease, by = ball.y + (ball.ty - ball.y) * ease - Math.sin(t * Math.PI) * 40;
        const br = 11 - t * 5;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (t >= 1) {
          const zoneW = GOAL.w / 3;
          const ballZone = Math.floor((ball.tx - GOAL.x) / zoneW);
          const gol = ballZone !== keeperZone;
          if (gol) { goals++; BG.sfx('win'); msg = 'GOOOL!'; } else { BG.sfx('bad'); msg = 'Ditangkap keeper!'; }
          scoreEl.textContent = goals; kicks--; leftEl.textContent = kicks;
          ball = null;
          if (kicks <= 0) {
            over = true;
            BG.endScreen(canvas.parentElement, { score: goals * 100, bestKey: 'penalty', win: goals >= 3, title: goals >= 3 ? 'Jago Penalti!' : 'Kurang Beruntung', sub: 'Gol: ' + goals + ' dari 5 tendangan.', scoreLabel: goals + '/5 Gol', onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'penalty').start(p, s); } });
          }
        }
      } else {
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(W / 2, H - 60, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      /* pesan */
      ctx.fillStyle = '#241239'; ctx.font = '700 15px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.globalAlpha = .9; ctx.fillStyle = '#ffffff'; ctx.fillText(msg, W / 2, H - 12); ctx.globalAlpha = 1;
    });
    leftEl.textContent = kicks;
  }
});

/* ============ 13. PANAHAN BUG ============ */
BG.register({
  id: 'archery', name: 'Panahan Bug', desc: 'Bidik tepat di tengah papan target! 5 anak panah.', cat: 'arcade', icon: 'archery', tags: 'panah archery target',
  start(el, s) {
    const W = 420, H = 400;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'arc-score') + BG.hudPill('Panah', 'arc-left'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#arc-score'), leftEl = el.querySelector('#arc-left');
    let score = 0, arrows = 5, over = false, angle = 0, dirAng = 0.025, shot = null, targetX = W / 2;

    s.on(canvas, 'pointerdown', () => {
      if (over || shot) return;
      const rad = (angle - 90) * Math.PI / 180;
      shot = { x: 60, y: H - 60, vx: Math.cos(rad) * 13, vy: Math.sin(rad) * 13, stuck: [] };
      BG.sfx('shoot');
    });

    s.raf(() => {
      if (!shot) { angle += dirAng * 2.2; if (angle > 42 || angle < -42) dirAng *= -1; }
      else {
        shot.vy += 0.22; shot.x += shot.vx; shot.y += shot.vy;
        const tx = W - 70, ty = H - 150;
        if (!shot.done && Math.hypot(shot.x - tx, shot.y - ty) < 46) {
          const d = Math.hypot(shot.x - tx, shot.y - ty);
          const pts = d < 9 ? 100 : d < 20 ? 70 : d < 32 ? 40 : 10;
          score += pts; scoreEl.textContent = score; shot.done = true;
          BG.sfx(pts >= 70 ? 'coin' : 'hit');
          shot.stuck.push({ x: shot.x, y: shot.y, pts });
        }
        if (shot.x > W + 30 || shot.y > H + 20 || shot.done) {
          if (!shot.done) BG.sfx('bad');
          shot = null; arrows--; leftEl.textContent = arrows;
          if (arrows <= 0) {
            over = true;
            BG.endScreen(canvas.parentElement, { score, bestKey: 'archery', title: 'Selesai!', sub: 'Total poin panahan: ' + score, onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'archery').start(p, s); } });
          }
        }
      }
      /* gambar */
      const grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#fde68a'); grad.addColorStop(1, '#fdba74');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#166534'; ctx.fillRect(0, H - 46, W, 46);
      /* target */
      const tx = W - 70, ty = H - 150;
      [[46, '#ffffff'], [34, '#ff5a5a'], [22, '#ffffff'], [10, '#ffd23f']].forEach(([r, c]) => { ctx.fillStyle = c; ctx.strokeStyle = '#241239'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#241239'; ctx.fillRect(tx - 3, ty + 46, 6, H - 46 - ty - 46 + 46);
      /* busur */
      const rad = (angle - 90) * Math.PI / 180;
      ctx.strokeStyle = '#241239'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(60, H - 60, 30, rad - 0.9, rad + 0.9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60 + Math.cos(rad - 0.9) * 30, H - 60 + Math.sin(rad - 0.9) * 30); ctx.lineTo(60 + Math.cos(rad + 0.9) * 30, H - 60 + Math.sin(rad + 0.9) * 30); ctx.stroke();
      /* bidikan */
      if (!shot) {
        ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(36,18,57,.6)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(60, H - 60);
        let px = 60, py = H - 60, vx = Math.cos(rad) * 13, vy = Math.sin(rad) * 13;
        for (let i = 0; i < 26; i++) { vy += 0.22; px += vx; py += vy; ctx.lineTo(px, py); }
        ctx.stroke(); ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = '#241239'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(shot.x - shot.vx * 2, shot.y - shot.vy * 2); ctx.lineTo(shot.x, shot.y); ctx.stroke();
      }
    });
    leftEl.textContent = arrows; targetX = W - 70;
  }
});

/* ============ 14. ASTEROIDS ============ */
BG.register({
  id: 'asteroids', name: 'Asteroid Bug', desc: 'Hancurkan asteroid, jangan sampai kena!', cat: 'arcade', icon: 'asteroids', tags: 'asteroid luar angkasa luar',
  start(el, s) {
    const W = 420, H = 440;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'ast-score') + BG.hudPill('Nyawa', 'ast-lives'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#ast-score'), livesEl = el.querySelector('#ast-lives');
    let score = 0, lives = 3, over = false, invuln = 0;
    const ship = { x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 };
    let bullets = [], rocks = [];

    function spawnRock(size, x, y) {
      rocks.push({ x: x !== undefined ? x : Math.random() * W, y: y !== undefined ? y : Math.random() * H * 0.4, vx: (Math.random() - .5) * 2.2, vy: (Math.random() - .5) * 2.2, size: size || 3, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 0.05 });
    }
    for (let i = 0; i < 4; i++) spawnRock(3);

    const keys = {};
    s.on(window, 'keydown', e => { keys[e.key.toLowerCase()] = true; if (e.code === 'Space') { e.preventDefault(); shoot(); } });
    s.on(window, 'keyup', e => { keys[e.key.toLowerCase()] = false; });
    s.on(canvas, 'pointerdown', () => shoot());
    /* kontrol layar untuk Android: kiri, kanan, maju, tembak */
    const ctrl = BG.el('<div class="racer-controls">' +
      '<button class="rc-btn rc-steer" data-k="arrowleft" aria-label="Putar kiri">◀</button>' +
      '<button class="rc-btn rc-steer" data-k="arrowup" aria-label="Maju">▲</button>' +
      '<button class="rc-btn rc-steer" data-k="arrowright" aria-label="Putar kanan">▶</button>' +
      '<button class="rc-btn rc-fire" data-k="fire" aria-label="Tembak">TEMBAK</button>' +
    '</div>');
    el.querySelector('.stage').appendChild(ctrl);
    ctrl.querySelectorAll('.rc-btn').forEach(btn => {
      const k = btn.dataset.k;
      if (k === 'fire') { s.on(btn, 'pointerdown', e => { e.preventDefault(); shoot(); }); return; }
      s.on(btn, 'pointerdown', e => { e.preventDefault(); keys[k] = true; });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => s.on(btn, ev, () => { keys[k] = false; }));
    });
    function shoot() { if (over) return; bullets.push({ x: ship.x + Math.cos(ship.angle) * 18, y: ship.y + Math.sin(ship.angle) * 18, vx: Math.cos(ship.angle) * 6.5, vy: Math.sin(ship.angle) * 6.5, life: 62 }); BG.sfx('shoot'); }

    s.raf(() => {
      if (over) return;
      if (keys['arrowleft'] || keys['a']) ship.angle -= 0.075;
      if (keys['arrowright'] || keys['d']) ship.angle += 0.075;
      if (keys['arrowup'] || keys['w']) { ship.vx += Math.cos(ship.angle) * 0.14; ship.vy += Math.sin(ship.angle) * 0.14; }
      ship.vx *= 0.99; ship.vy *= 0.99; ship.x = (ship.x + ship.vx + W) % W; ship.y = (ship.y + ship.vy + H) % H;
      invuln = Math.max(0, invuln - 1);
      bullets.forEach(b => { b.x = (b.x + b.vx + W) % W; b.y = (b.y + b.vy + H) % H; b.life--; });
      bullets = bullets.filter(b => b.life > 0);
      rocks.forEach(r => { r.x = (r.x + r.vx + W) % W; r.y = (r.y + r.vy + H) % H; r.rot += r.vr; });
      /* peluru vs asteroid */
      for (const b of bullets) for (const r of rocks) {
        if (r.dead) continue;
        const rad = r.size * 13;
        if (Math.hypot(b.x - r.x, b.y - r.y) < rad) {
          r.dead = true; b.life = 0; score += (4 - r.size) * 20; scoreEl.textContent = score; BG.sfx('pop');
          if (r.size > 1) { spawnRock(r.size - 1, r.x - 8, r.y); spawnRock(r.size - 1, r.x + 8, r.y); }
        }
      }
      rocks = rocks.filter(r => !r.dead);
      /* asteroid vs kapal */
      if (invuln === 0) for (const r of rocks) {
        if (Math.hypot(ship.x - r.x, ship.y - r.y) < r.size * 13 + 10) {
          lives--; livesEl.textContent = lives; invuln = 110; BG.sfx('bad');
          ship.x = W / 2; ship.y = H / 2; ship.vx = ship.vy = 0;
          if (lives <= 0) over = true;
          break;
        }
      }
      if (rocks.length === 0) { for (let i = 0; i < 4 + Math.floor(score / 200); i++) spawnRock(3); }
      if (over) {
        BG.endScreen(canvas.parentElement, { score, bestKey: 'asteroids', title: 'Kapal Hancur!', sub: 'Skor akhir: ' + score, onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'asteroids').start(p, s); } });
        return;
      }
      ctx.fillStyle = '#05051a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      [[40, 60], [380, 120], [150, 400], [300, 250], [80, 300]].forEach(([x, y]) => { ctx.globalAlpha = .6; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#a3a3a3'; ctx.lineWidth = 3;
      rocks.forEach(r => {
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
        ctx.beginPath(); const rad = r.size * 13;
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = rad * (0.8 + ((i * 37 + r.size * 11) % 10) / 40); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
        ctx.closePath(); ctx.stroke(); ctx.restore();
      });
      ctx.fillStyle = '#ffd23f'; bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 2.6, 0, Math.PI * 2); ctx.fill(); });
      if (invuln === 0 || Math.floor(invuln / 6) % 2 === 0) {
        ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle + Math.PI / 2);
        ctx.fillStyle = '#a78bfa'; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(12, 12); ctx.lineTo(0, 6); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    });
    livesEl.textContent = lives;
  }
});

/* ============ 15. LINTAS JALAN ============ */
BG.register({
  id: 'frogger', name: 'Lintas Jalan', desc: 'Antar bug ke taman bunga! Awas mobil.', cat: 'arcade', icon: 'road', tags: 'frogger menyebrang jalan mobil',
  start(el, s) {
    const W = 420, H = 440, LANES = 4, LANE_H = 62, TOP = 40;
    const { canvas } = stageWrap(el, BG.hudPill('Skor', 'frg-score') + BG.hudPill('Nyawa', 'frg-lives') + BG.hudPill('Level', 'frg-level'), W, H);
    const ctx = canvas.getContext('2d');
    const scoreEl = el.querySelector('#frg-score'), livesEl = el.querySelector('#frg-lives'), levelEl = el.querySelector('#frg-level');
    let score = 0, lives = 3, level = 1, over = false;
    const bug = { x: W / 2, y: H - 30, r: 13 };
    const cars = [];
    for (let i = 0; i < LANES; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      for (let j = 0; j < 2; j++) cars.push({ lane: i, dir, x: j * 210 + Math.random() * 80, speed: (1.4 + level * 0.4) * dir });
    }
    function resetCars() { cars.forEach(c => { c.speed = (1.4 + level * 0.4 + Math.random() * 0.6) * c.dir; }); }

    function hop(dx, dy) {
      if (over) return;
      bug.x = Math.max(16, Math.min(W - 16, bug.x + dx));
      bug.y = Math.max(TOP - 8, Math.min(H - 22, bug.y + dy));
      BG.sfx('click');
      if (bug.y <= TOP - 4) {
        score += 100 * level; scoreEl.textContent = score; level++; levelEl.textContent = level;
        BG.sfx('coin'); resetCars(); bug.x = W / 2; bug.y = H - 30;
      }
    }
    s.on(window, 'keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') hop(0, -LANE_H);
      else if (k === 'arrowdown' || k === 's') hop(0, LANE_H);
      else if (k === 'arrowleft' || k === 'a') hop(-46, 0);
      else if (k === 'arrowright' || k === 'd') hop(46, 0);
    });
    /* ketuk atas/bawah/kiri/kanan dari posisi ketukan relatif ke bug */
    s.on(canvas, 'pointerdown', e => {
      const r = canvas.getBoundingClientRect();
      const px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height;
      const dx = px - bug.x, dy = py - bug.y;
      if (Math.abs(dx) > Math.abs(dy)) hop(dx > 0 ? 46 : -46, 0); else hop(0, dy > 0 ? LANE_H : -LANE_H);
    });

    s.raf(() => {
      if (over) return;
      cars.forEach(c => {
        c.x += c.speed;
        if (c.dir > 0 && c.x > W + 40) c.x = -60 - Math.random() * 60;
        if (c.dir < 0 && c.x < -60) c.x = W + Math.random() * 60;
      });
      cars.forEach(c => {
        const cy = TOP + 26 + c.lane * LANE_H;
        if (Math.abs(c.x - bug.x) < 34 && Math.abs(cy - bug.y) < 26) {
          lives--; livesEl.textContent = lives; BG.sfx('bad'); bug.x = W / 2; bug.y = H - 30;
          if (lives <= 0) {
            over = true;
            BG.endScreen(canvas.parentElement, { score, bestKey: 'frogger', title: 'Ketabrak!', sub: 'Sampai level ' + level + ' dengan skor ' + score, onRetry: () => { const p = canvas.parentElement.parentElement; p.innerHTML = ''; BG.games.find(g => g.id === 'frogger').start(p, s); } });
          }
        }
      });
      /* gambar */
      ctx.fillStyle = '#166534'; ctx.fillRect(0, 0, W, TOP);
      ctx.fillStyle = '#27272a'; ctx.fillRect(0, TOP, W, LANES * LANE_H);
      ctx.fillStyle = '#3f3f46'; ctx.fillRect(0, TOP + LANES * LANE_H, W, H - TOP - LANES * LANE_H);
      /* garis jalan */
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.setLineDash([14, 14]);
      for (let i = 1; i < LANES; i++) { ctx.beginPath(); ctx.moveTo(0, TOP + i * LANE_H); ctx.lineTo(W, TOP + i * LANE_H); ctx.stroke(); }
      ctx.setLineDash([]);
      /* taman bunga di atas */
      for (let i = 0; i < 7; i++) { ctx.fillStyle = ['#ff6b9d', '#ffd23f', '#f472b6'][i % 3]; ctx.beginPath(); ctx.arc(30 + i * 62, TOP / 2, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#241239'; ctx.lineWidth = 2; ctx.stroke(); }
      /* mobil */
      cars.forEach(c => {
        const cy = TOP + 26 + c.lane * LANE_H;
        ctx.fillStyle = ['#ff5a5a', '#4ecdc4', '#fbbf24', '#a78bfa'][c.lane]; ctx.strokeStyle = '#241239'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(c.x - 30, cy - 14, 60, 28, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(c.x - 12, cy - 9, 24, 8);
      });
      drawMiniBug(ctx, bug.x, bug.y, bug.r, '#b9f542');
    });
    livesEl.textContent = lives; levelEl.textContent = level;
  }
});
