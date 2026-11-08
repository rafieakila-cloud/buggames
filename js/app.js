/* Buggames — shell aplikasi: routing, grid, suara, penyimpanan */
'use strict';

window.BG = (function () {
  const LS_KEY = 'buggames.v1';

  /* ---------- penyimpanan lokal ---------- */
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveStore(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }
  const store = loadStore();
  store.best = store.best || {};
  store.plays = store.plays || {};
  if (store.sound === undefined) store.sound = true;

  function getBest(id) { return store.best[id]; }
  function setBest(id, score, lowerBetter) {
    store.plays[id] = (store.plays[id] || 0) + 1;
    const prev = store.best[id];
    let record = false;
    if (prev === undefined) record = true;
    else if (lowerBetter ? score < prev : score > prev) record = true;
    if (record) store.best[id] = score;
    saveStore(store);
    return { best: store.best[id], record: record };
  }
  const plays = () => store.plays;

  /* ---------- suara (WebAudio) ---------- */
  let actx = null;
  function audio() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type, when, vol) {
    const a = audio();
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    const t = a.currentTime + (when || 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12));
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + (dur || 0.12) + 0.02);
  }
  function sfx(kind) {
    if (!store.sound) return;
    try {
      switch (kind) {
        case 'click': tone(750, .06, 'square', 0, .07); break;
        case 'good': tone(660, .1, 'sine', 0, .14); tone(990, .14, 'sine', .09, .14); break;
        case 'bad': tone(150, .22, 'sawtooth', 0, .12); break;
        case 'pop': tone(520, .05, 'triangle', 0, .16); tone(880, .06, 'triangle', .04, .12); break;
        case 'coin': tone(1250, .07, 'square', 0, .1); tone(1560, .12, 'square', .06, .1); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, .16, 'square', i * .13, .11)); break;
        case 'lose': [392, 330, 262].forEach((f, i) => tone(f, .2, 'sawtooth', i * .16, .1)); break;
        case 'shoot': tone(900, .07, 'square', 0, .09); tone(500, .09, 'square', .05, .07); break;
        case 'hit': tone(220, .08, 'triangle', 0, .14); break;
      }
    } catch (e) { /* audio tidak tersedia */ }
  }
  function toggleSound() { store.sound = !store.sound; saveStore(store); return store.sound; }
  const soundOn = () => !!store.sound;

  /* ---------- registry game ---------- */
  const games = [];
  function register(g) { games.push(g); }

  /* ---------- helpers UI ---------- */
  function icon(name, cls) {
    const svg = (window.BG_ICONS && window.BG_ICONS[name]) || window.BG_ICONS.bug;
    return svg.replace('<svg', '<svg class="' + (cls || '') + '"');
  }
  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* session: kumpulkan cleanup biar game gak bocor timer/RAF */
  function newSession() {
    const cleanups = [];
    return {
      add(fn) { cleanups.push(fn); },
      interval(fn, ms) { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); return id; },
      timeout(fn, ms) { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; },
      raf(loop) {
        let id, dead = false;
        const step = (t) => { if (dead) return; loop(t); id = requestAnimationFrame(step); };
        id = requestAnimationFrame(step);
        cleanups.push(() => { dead = true; cancelAnimationFrame(id); });
        return () => { dead = true; cancelAnimationFrame(id); };
      },
      on(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); cleanups.push(() => target.removeEventListener(ev, fn, opts)); },
      destroy() { cleanups.forEach(fn => { try { fn(); } catch (e) {} }); cleanups.length = 0; }
    };
  }

  /* layar akhir game */
  function endScreen(container, opts) {
    const o = opts || {};
    const res = setBest(o.bestKey, o.score || 0, !!o.lowerBetter);
    const bestLabel = o.lowerBetter ? 'Terbaik (paling sedikit): ' + res.best : 'Terbaik: ' + res.best;
    const overlay = el(
      '<div class="end-overlay"><div class="end-card">' +
        (o.win === false ? icon('bug') : icon('trophy')) +
        '<h3>' + esc(o.title || (o.win === false ? 'Coba Lagi!' : 'Mantap!')) + '</h3>' +
        (o.sub ? '<p>' + esc(o.sub) + '</p>' : '') +
        '<div class="end-score">' + esc(o.scoreLabel !== undefined ? o.scoreLabel : (o.score || 0)) + '</div>' +
        '<div class="end-best' + (res.record ? ' record' : '') + '">' + (res.record ? '★ REKOR BARU! ★' : esc(bestLabel)) + '</div>' +
        '<div class="end-btns">' +
          '<button class="btn btn-lime end-retry">Main Lagi</button>' +
          '<button class="btn btn-ghost end-menu">Menu</button>' +
        '</div>' +
      '</div></div>'
    );
    overlay.querySelector('.end-retry').addEventListener('click', () => { sfx('click'); if (o.onRetry) o.onRetry(); });
    overlay.querySelector('.end-menu').addEventListener('click', () => { sfx('click'); goHome(); });
    container.appendChild(overlay);
    sfx(o.win === false ? 'lose' : 'win');
    return res;
  }

  function hudPill(label, valueId) {
    return '<div class="hud-pill">' + esc(label) + ' <b id="' + valueId + '">0</b></div>';
  }

  /* posisi pointer pada canvas (scaled) */
  function canvasPos(canvas, e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);
    return { x: (cx - r.left) * canvas.width / r.width, y: (cy - r.top) * canvas.height / r.height };
  }

  /* ---------- shell / navigasi ---------- */
  const CATS = [
    { id: 'semua', name: 'Semua' },
    { id: 'arcade', name: 'Arcade' },
    { id: 'puzzle', name: 'Puzzle & Logika' },
    { id: 'kuis', name: 'Kuis & Kata' },
    { id: '3d', name: '3D' },
  ];
  let currentCat = 'semua';
  let currentGame = null;
  let currentSession = null;

  const grid = () => document.getElementById('gameGrid');
  const chipsEl = () => document.getElementById('catChips');
  const searchEl = () => document.getElementById('searchInput');

  function allGames() { return games.slice(); }

  function renderChips() {
    chipsEl().innerHTML = CATS.map(c =>
      '<button class="chip' + (c.id === currentCat ? ' active' : '') + '" data-cat="' + c.id + '"><span class="dot"></span>' + esc(c.name) + '</button>'
    ).join('');
  }

  function renderGrid() {
    const q = (searchEl().value || '').trim().toLowerCase();
    const list = games.filter(g =>
      (currentCat === 'semua' || g.cat === currentCat) &&
      (!q || (g.name + ' ' + g.desc + ' ' + (g.tags || '')).toLowerCase().includes(q))
    );
    grid().innerHTML = list.map((g, i) => {
      const b = getBest(g.id);
      const best = (b === undefined)
        ? '<span class="best-pill empty">Belum main</span>'
        : '<span class="best-pill">Terbaik: ' + esc(b) + '</span>';
      return '<button class="game-card" data-id="' + esc(g.id) + '" aria-label="Main ' + esc(g.name) + '">' +
        '<div class="tile tile-' + (i % 9) + '">' + icon(g.icon) + '</div>' +
        '<div class="card-body"><div class="card-cat">' + esc(catName(g.cat)) + '</div>' +
        '<div class="card-name">' + esc(g.name) + '</div>' + best + '</div>' +
      '</button>';
    }).join('');
    document.getElementById('emptyState').classList.toggle('hidden', list.length !== 0);
    document.getElementById('footCount').textContent = games.length + ' game tersedia';
  }

  function catName(id) { const c = CATS.find(c => c.id === id); return c ? c.name : id; }

  function openGame(id) {
    const g = games.find(g => g.id === id);
    if (!g) return;
    currentGame = g;
    currentSession = newSession();
    store.plays[id] = store.plays[id] || 0; saveStore(store);

    document.getElementById('gameTitle').textContent = g.name;
    updateBestPill(id);
    const container = document.getElementById('gameContainer');
    container.innerHTML = '';
    document.getElementById('gameView').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    try {
      g.start(container, currentSession);
    } catch (err) {
      container.innerHTML = '<div class="panel"><h3>Waduh, error!</h3><p>Game ini gagal dimuat. Coba keluar dan masuk lagi.</p></div>';
      console.error(err);
    }
    if (history.pushState) history.pushState({ game: id }, '', '#' + id);
  }

  function updateBestPill(id) {
    const b = getBest(id);
    document.getElementById('gameBest').textContent = 'Terbaik: ' + (b === undefined ? '–' : b);
  }

  function closeGame() {
    if (currentSession) { currentSession.destroy(); currentSession = null; }
    currentGame = null;
    const c = document.getElementById('gameContainer');
    c.innerHTML = '';
    document.getElementById('gameView').classList.add('hidden');
    document.body.style.overflow = '';
    renderGrid();
  }

  function goHome() {
    if (location.hash) history.pushState({}, '', location.pathname);
    closeGame();
  }

  function init() {
    document.getElementById('mascotHome').innerHTML = window.BG_MASCOT;
    document.getElementById('emptyMascot').innerHTML = window.BG_MASCOT;

    renderChips();
    renderGrid();

    chipsEl().addEventListener('click', e => {
      const btn = e.target.closest('.chip'); if (!btn) return;
      currentCat = btn.dataset.cat; sfx('click'); renderChips(); renderGrid();
    });
    searchEl().addEventListener('input', renderGrid);
    grid().addEventListener('click', e => {
      const card = e.target.closest('.game-card'); if (!card) return;
      sfx('pop'); openGame(card.dataset.id);
    });

    document.getElementById('backBtn').addEventListener('click', () => { sfx('click'); closeGame(); if (location.hash) history.pushState({}, '', location.pathname); });
    window.addEventListener('popstate', () => { if (currentGame) closeGame(); });

    /* suara */
    const soundBtn = document.getElementById('soundBtn');
    const soundIcon = on => on
      ? '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l6 5V4L8 9H4z" fill="#ffd23f" stroke="#241239" stroke-width="1.8" stroke-linejoin="round"/><path d="M18 9a4 4 0 0 1 0 6M21 6a8 8 0 0 1 0 12" stroke="#ffd23f" stroke-width="2" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l6 5V4L8 9H4z" fill="#8a76ad" stroke="#241239" stroke-width="1.8" stroke-linejoin="round"/><path d="M18 9l5 6M23 9l-5 6" stroke="#ff6b9d" stroke-width="2" stroke-linecap="round"/></svg>';
    const paintSound = () => { soundBtn.innerHTML = soundIcon(soundOn()); };
    soundBtn.addEventListener('click', () => { toggleSound(); paintSound(); sfx('click'); });
    paintSound();

    /* install prompt */
    let deferred = null;
    const installBtn = document.getElementById('installBtn');
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); deferred = e; installBtn.classList.remove('hidden');
    });
    installBtn.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null; installBtn.classList.add('hidden');
    });
    window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));

    /* deep link #gameId */
    if (location.hash.length > 1) openGame(location.hash.slice(1));
  }

  return {
    games, register, icon, el, esc, shuffle, rand, pick,
    sfx, getBest, setBest, endScreen, hudPill, canvasPos, newSession,
    goHome, init, plays,
  };
})();

window.addEventListener('DOMContentLoaded', BG.init);
