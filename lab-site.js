/* Moreshwar Systems Lab — shared runtime.
   Every block is guarded by the elements it needs, so one file serves every page. */
(() => {
  'use strict';
  const root = document.documentElement;
  const KEY = 'mrl-research-theme';

  /* ---------- Theme ---------- */
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

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- Homepage: simulated latency distribution ---------- */
  (() => {
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
          ? 90 + Math.abs(gaussian()) * 55 + Math.random() * 40
          : Math.exp(Math.log(18) + 0.38 * gaussian());
      }
      return xs.sort((a, b) => a - b);
    }
    const pct = (xs, p) => xs[Math.min(xs.length - 1, Math.floor(p * xs.length))];
    const xOf = ms => Math.min(W - 1, (ms / MAX_MS) * W);
    function render() {
      const xs = sample(4000);
      const counts = new Array(BINS).fill(0);
      for (const x of xs) counts[Math.min(BINS - 1, Math.floor((x / MAX_MS) * BINS))]++;
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
    if (!still) {
      let timer = setInterval(render, 2600);
      document.addEventListener('visibilitychange', () => {
        clearInterval(timer);
        if (!document.hidden) timer = setInterval(render, 2600);
      });
    }
  })();

  /* ---------- Research: queueing model ----------
     M/M/1 waiting time. As utilisation approaches 1, waiting time grows without bound.
     W = S / (1 - u), where S is service time and u is utilisation. */
  (() => {
    const panel = document.getElementById('queue-model');
    if (!panel) return;
    const util = panel.querySelector('#q-util');
    const svc = panel.querySelector('#q-service');
    const curve = panel.querySelector('.curve');
    const area = panel.querySelector('.area');
    const dot = panel.querySelector('.now');
    const outU = panel.querySelector('#q-util-out');
    const outS = panel.querySelector('#q-service-out');
    const wait = panel.querySelector('#q-wait');
    const total = panel.querySelector('#q-total');
    const amp = panel.querySelector('#q-amp');
    const W = 320, H = 170, CAP = 12; // cap the y-axis at 12x service time
    const waitOf = (u, s) => s * (u / (1 - u));
    function draw() {
      const u = Number(util.value) / 100, s = Number(svc.value);
      const yOf = w => H - Math.min(1, w / (s * CAP)) * (H - 10) - 2;
      let d = '';
      for (let i = 0; i <= 100; i++) {
        const uu = (i / 100) * 0.97;
        const x = (uu / 0.97) * W;
        const y = yOf(waitOf(uu, s));
        d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
      }
      curve.setAttribute('d', d);
      area.setAttribute('d', d + 'L' + W + ',' + H + 'L0,' + H + 'Z');
      const w = waitOf(u, s);
      dot.setAttribute('cx', ((u / 0.97) * W).toFixed(1));
      dot.setAttribute('cy', yOf(w).toFixed(1));
      outU.textContent = Math.round(u * 100) + '%';
      outS.textContent = s + ' ms';
      wait.textContent = fmt(w) + ' ms';
      total.textContent = fmt(s + w) + ' ms';
      amp.textContent = fmt((s + w) / s, 1) + '×';
      wait.classList.toggle('warn', u >= 0.85);
    }
    util.addEventListener('input', draw);
    svc.addEventListener('input', draw);
    draw();
  })();

  /* ---------- Research: fan-out model ----------
     One page calls N services. If each is slow with probability p,
     the chance the page waits for at least one slow call is 1 - (1-p)^N. */
  (() => {
    const panel = document.getElementById('fanout-model');
    if (!panel) return;
    const nCtl = panel.querySelector('#f-n');
    const pCtl = panel.querySelector('#f-p');
    const outN = panel.querySelector('#f-n-out');
    const outP = panel.querySelector('#f-p-out');
    const risk = panel.querySelector('#f-risk');
    const clean = panel.querySelector('#f-clean');
    const bars = panel.querySelector('#f-bars');
    const W = 320, H = 170;
    function draw() {
      const n = Number(nCtl.value), p = Number(pCtl.value) / 100;
      outN.textContent = n + (n === 1 ? ' call' : ' calls');
      outP.textContent = (p * 100).toFixed(1) + '%';
      const hit = 1 - Math.pow(1 - p, n);
      risk.textContent = (hit * 100).toFixed(1) + '%';
      risk.classList.toggle('warn', hit > 0.5);
      clean.textContent = ((1 - hit) * 100).toFixed(1) + '%';
      bars.textContent = '';
      const COLS = 40, bw = W / COLS;
      for (let i = 0; i < COLS; i++) {
        const nn = Math.round(((i + 1) / COLS) * 100);
        const h = (1 - Math.pow(1 - p, nn)) * (H - 10);
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', (i * bw + 0.7).toFixed(2));
        r.setAttribute('width', (bw - 1.4).toFixed(2));
        r.setAttribute('y', (H - h).toFixed(1));
        r.setAttribute('height', h.toFixed(1));
        r.setAttribute('rx', '1');
        r.setAttribute('fill', nn <= n ? 'var(--accent)' : 'var(--bar)');
        bars.appendChild(r);
      }
    }
    nCtl.addEventListener('input', draw);
    pCtl.addEventListener('input', draw);
    draw();
  })();

  /* ---------- Writing archive: filters and publishing cadence ---------- */
  (() => {
    const q = document.getElementById('q');
    const year = document.getElementById('year');
    const grid = document.getElementById('grid');
    if (!q || !year || !grid) return;
    const rows = [...grid.querySelectorAll('.story')];
    const count = document.getElementById('count');
    const empty = document.getElementById('empty');
    const cadence = document.getElementById('cadence');
    function filter() {
      const search = q.value.trim().toLocaleLowerCase(), selected = year.value;
      let visible = 0;
      for (const row of rows) {
        const indexed = (row.dataset.search || row.textContent).toLocaleLowerCase();
        const show = (!search || indexed.includes(search)) && (!selected || row.dataset.year === selected);
        row.hidden = !show;
        if (show) visible++;
      }
      if (count) count.textContent = visible + ' ' + (visible === 1 ? 'essay' : 'essays');
      if (empty) empty.hidden = visible !== 0;
      if (cadence) [...cadence.children].forEach(bar => {
        bar.dataset.on = (!selected || bar.dataset.year === selected) ? '1' : '0';
      });
    }
    q.addEventListener('input', filter);
    year.addEventListener('change', filter);
    filter();
  })();

  /* ---------- Command palette: press / or k ---------- */
  (() => {
    const palette = document.getElementById('palette');
    if (!palette) return;
    const input = palette.querySelector('input');
    const list = palette.querySelector('ul');
    const items = [...list.querySelectorAll('li')];
    let open = false, cursor = 0;
    function visible() { return items.filter(i => !i.hidden); }
    function mark() {
      const vis = visible();
      cursor = Math.max(0, Math.min(cursor, vis.length - 1));
      items.forEach(i => i.setAttribute('aria-selected', 'false'));
      vis[cursor]?.setAttribute('aria-selected', 'true');
      vis[cursor]?.scrollIntoView({ block: 'nearest' });
    }
    function show(state) {
      open = state;
      palette.toggleAttribute('open', state);
      if (state) { input.value = ''; items.forEach(i => { i.hidden = false; }); cursor = 0; mark(); input.focus(); }
      else input.blur();
    }
    input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase();
      items.forEach(i => { i.hidden = !!term && !i.textContent.toLocaleLowerCase().includes(term); });
      cursor = 0; mark();
    });
    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (!open && !typing && (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)))) {
        e.preventDefault(); show(true); return;
      }
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); show(false); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); cursor++; mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cursor--; mark(); }
      else if (e.key === 'Enter') {
        const link = visible()[cursor]?.querySelector('a');
        if (link) { e.preventDefault(); location.href = link.getAttribute('href'); }
      }
    });
    palette.addEventListener('click', e => { if (e.target === palette) show(false); });
    document.querySelectorAll('[data-palette-open]').forEach(el =>
      el.addEventListener('click', () => show(true)));
  })();

  /* ---------- "New" flash ----------
     Anything carrying data-added within the freshness window gets a New badge, and the
     newest entry in data/whats-new.json is announced in the strip where a page has one.
     The site root is derived from the stylesheet link, so this works from subfolders too. */
  (() => {
    const FRESH_FALLBACK = 21;
    const days = (iso) => (Date.now() - Date.parse(iso + 'T00:00:00Z')) / 86400000;

    function badge(el) {
      if (el.querySelector('.new-flag')) return;
      const flag = document.createElement('span');
      flag.className = 'new-flag';
      flag.textContent = 'New';
      el.appendChild(flag);
    }

    function markFresh(window) {
      document.querySelectorAll('[data-added]').forEach(el => {
        const age = days(el.dataset.added);
        if (age >= 0 && age <= window) badge(el);
      });
    }

    markFresh(FRESH_FALLBACK);

    const link = document.querySelector('link[rel="stylesheet"][href*="lab-site.css"]');
    if (!link) return;
    const root = link.getAttribute('href').replace(/lab-site\.css.*$/, '');
    fetch(root + 'data/whats-new.json', { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data || !Array.isArray(data.entries) || !data.entries.length) return;
        const window = Number(data.freshDays) || FRESH_FALLBACK;
        markFresh(window);
        const strip = document.getElementById('whats-new');
        if (!strip) return;
        const latest = [...data.entries].sort((a, b) => b.date.localeCompare(a.date))[0];
        if (days(latest.date) > window) return;
        strip.textContent = '';
        const label = document.createElement('span');
        label.className = 'wn-label'; label.textContent = 'New';
        const a = document.createElement('a');
        a.href = root + latest.href; a.textContent = latest.title;
        const note = document.createElement('span');
        note.className = 'wn-note'; note.textContent = latest.note || '';
        const when = document.createElement('time');
        when.dateTime = latest.date;
        when.textContent = new Date(latest.date + 'T00:00:00Z')
          .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
        strip.append(label, a, note, when);
        strip.hidden = false;
      })
      .catch(() => {});
  })();

  /* ---------- Build provenance: show the released commit if it was stamped ---------- */
  (() => {
    // Only shown where the deploy actually stamped the released commit;
    // claiming "local" on a published page would be untrue.
    const wrap = document.getElementById('build-chip');
    const chip = document.getElementById('build-sha');
    if (!wrap || !chip) return;
    const sha = document.querySelector('meta[name="mrl-release-sha"]')?.content;
    if (!/^[0-9a-f]{7,40}$/.test(sha || '')) return;
    chip.textContent = sha.slice(0, 7);
    wrap.hidden = false;
  })();
})();
