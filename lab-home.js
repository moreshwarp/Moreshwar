/* Moreshwar Systems Lab — homepage behaviour: theme switch and the simulated latency trace. */
(() => {
  'use strict';
  const root = document.documentElement;
  const KEY = 'mrl-research-theme'; // shared with the other pages of the site

  // Theme
  const button = document.getElementById('theme-toggle');
  const meta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
    if (meta) meta.setAttribute('content', dark ? '#0D1014' : '#F7F5F0');
  }
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  button?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch {}
    applyTheme(next);
  });

  // Latency trace: a simulated mix of fast requests and a slow tail
  // (for example, a cache miss or a pause in a busy server).
  const svg = document.getElementById('trace-plot');
  if (!svg) return;
  const barsGroup = document.getElementById('trace-bars');
  const p50Line = document.getElementById('mark-p50');
  const p99Line = document.getElementById('mark-p99');
  const out = {
    p50: document.getElementById('stat-p50'),
    p99: document.getElementById('stat-p99'),
    gap: document.getElementById('stat-gap'),
  };
  const W = 320, H = 150, TOP = 8, BINS = 48, MAX_MS = 240;
  const NS = 'http://www.w3.org/2000/svg';
  const bars = [];
  const bw = W / BINS;
  for (let i = 0; i < BINS; i++) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', (i * bw + 0.8).toFixed(2));
    r.setAttribute('width', (bw - 1.6).toFixed(2));
    r.setAttribute('y', String(H));
    r.setAttribute('height', '0');
    r.setAttribute('rx', '1');
    barsGroup.appendChild(r);
    bars.push(r);
  }

  function gaussian() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function sample(n) {
    const slowShare = 0.03 + Math.random() * 0.03;
    const xs = new Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = Math.random() < slowShare
        ? 90 + Math.abs(gaussian()) * 55 + Math.random() * 40  // slow path
        : Math.exp(Math.log(18) + 0.38 * gaussian());          // normal path, about 18 ms
    }
    return xs.sort((a, b) => a - b);
  }
  const pct = (xs, p) => xs[Math.min(xs.length - 1, Math.floor(p * xs.length))];
  const xOf = ms => Math.min(W - 1, (ms / MAX_MS) * W);

  function render() {
    const xs = sample(4000);
    const counts = new Array(BINS).fill(0);
    for (const x of xs) counts[Math.min(BINS - 1, Math.floor((x / MAX_MS) * BINS))]++;
    // square root scale so the small tail stays visible beside the tall peak
    const peak = Math.sqrt(Math.max(...counts));
    const p50 = pct(xs, 0.5), p99 = pct(xs, 0.99);
    counts.forEach((c, i) => {
      const h = c ? Math.max(2, (Math.sqrt(c) / peak) * (H - TOP)) : 0;
      bars[i].setAttribute('y', (H - h).toFixed(1));
      bars[i].setAttribute('height', h.toFixed(1));
      bars[i].classList.toggle('hot', (i + 0.5) * (MAX_MS / BINS) >= p99);
    });
    p50Line.setAttribute('x1', xOf(p50)); p50Line.setAttribute('x2', xOf(p50));
    p99Line.setAttribute('x1', xOf(p99)); p99Line.setAttribute('x2', xOf(p99));
    out.p50.textContent = p50.toFixed(0) + ' ms';
    out.p99.textContent = p99.toFixed(0) + ' ms';
    out.gap.textContent = (p99 / p50).toFixed(1) + '×';
  }

  render();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still) {
    let timer = setInterval(render, 2600);
    document.addEventListener('visibilitychange', () => {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(render, 2600);
    });
  }
})();
