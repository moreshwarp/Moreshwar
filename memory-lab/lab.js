/* Memory Wall Lab — page logic: runs the worker, draws the curve, names the steps. */
'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const fmtBytes = (b) => b >= 1048576 ? (b / 1048576).toFixed(b % 1048576 ? 1 : 0) + ' MB'
                        : b >= 1024 ? (b / 1024).toFixed(0) + ' KB' : b + ' B';
  const fmtNs = (n) => n >= 10 ? n.toFixed(1) : n.toFixed(2);

  const state = { points: [], resolution: 0, running: false, machine: null };

  /* ---------- curve ---------- */
  const PLOT = { w: 640, h: 300, l: 54, r: 14, t: 14, b: 38 };
  function draw() {
    const svg = $('#plot');
    const pts = state.points.filter(p => p && p.ns > 0);
    svg.textContent = '';
    if (!pts.length) return;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const xs = pts.map(p => Math.log2(p.bytes));
    const ys = pts.map(p => Math.log10(p.ns));
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys) - 0.08, y1 = Math.max(...ys) + 0.08;
    const X = (v) => PLOT.l + ((v - x0) / (x1 - x0 || 1)) * (PLOT.w - PLOT.l - PLOT.r);
    const Y = (v) => PLOT.t + (1 - (v - y0) / (y1 - y0 || 1)) * (PLOT.h - PLOT.t - PLOT.b);

    for (let e = Math.ceil(y0); e <= y1; e++) {           // decade gridlines
      const y = Y(e);
      svg.appendChild(el('line', { class: 'grid', x1: PLOT.l, x2: PLOT.w - PLOT.r, y1: y, y2: y }));
      const lbl = el('text', { class: 'tick', x: PLOT.l - 8, y: y + 4, 'text-anchor': 'end' });
      lbl.textContent = Math.pow(10, e) + ' ns'; svg.appendChild(lbl);
    }
    for (let p2 = Math.ceil(x0); p2 <= x1; p2 += 2) {      // size ticks
      const x = X(p2);
      svg.appendChild(el('line', { class: 'grid grid-v', x1: x, x2: x, y1: PLOT.t, y2: PLOT.h - PLOT.b }));
      const lbl = el('text', { class: 'tick', x, y: PLOT.h - PLOT.b + 16, 'text-anchor': 'middle' });
      lbl.textContent = fmtBytes(Math.pow(2, p2)); svg.appendChild(lbl);
    }
    for (const t of state.transitions || []) {             // candidate cache edges
      const x = X(Math.log2(t.bytes));
      svg.appendChild(el('line', { class: 'edge', x1: x, x2: x, y1: PLOT.t, y2: PLOT.h - PLOT.b }));
      const lbl = el('text', { class: 'edge-label', x: x + 5, y: PLOT.t + 13 });
      lbl.textContent = fmtBytes(t.bytes); svg.appendChild(lbl);
    }
    let d = '';
    pts.forEach((p, i) => { d += (i ? 'L' : 'M') + X(Math.log2(p.bytes)).toFixed(1) + ',' + Y(Math.log10(p.ns)).toFixed(1); });
    svg.appendChild(el('path', { class: 'curve', d }));
    pts.forEach(p => svg.appendChild(el('circle', { class: 'dot', cx: X(Math.log2(p.bytes)), cy: Y(Math.log10(p.ns)), r: 3 })));
  }

  /* ---------- where the curve steps up ---------- */
  function findTransitions(points) {
    const p = points.filter(x => x && x.ns > 0);
    if (p.length < 5) return [];
    const smooth = p.map((_, i) => {
      const w = p.slice(Math.max(0, i - 1), i + 2).map(x => x.ns).sort((a, b) => a - b);
      return w[(w.length / 2) | 0];
    });
    const out = [];
    for (let i = 2; i < p.length; i++) {
      const rise = smooth[i] / smooth[i - 1];
      if (rise >= 1.22) {
        const prev = out[out.length - 1];
        if (prev && Math.log2(p[i].bytes) - Math.log2(prev.atBytes) < 1.2) continue;
        out.push({ bytes: p[i - 1].bytes, atBytes: p[i].bytes, rise, from: smooth[i - 1], to: smooth[i] });
      }
    }
    return out.slice(0, 4);
  }

  /* ---------- reporting ---------- */
  function report() {
    const pts = state.points.filter(p => p && p.ns > 0);
    if (!pts.length) return;
    state.transitions = findTransitions(state.points);
    const fastest = pts[0].ns, slowest = pts[pts.length - 1].ns;
    $('#r-fast').textContent = fmtNs(fastest) + ' ns';
    $('#r-slow').textContent = fmtNs(slowest) + ' ns';
    $('#r-ratio').textContent = (slowest / fastest).toFixed(1) + '×';
    $('#r-clock').textContent = state.resolution ? state.resolution.toFixed(3) + ' ms' : '—';

    const list = $('#edges'); list.textContent = '';
    if (!state.transitions.length) {
      const li = document.createElement('li');
      li.textContent = 'No clear step found. On a quiet machine the steps are usually visible; a busy machine or a very coarse clock can flatten them.';
      list.appendChild(li);
    } else {
      state.transitions.forEach((t, i) => {
        const li = document.createElement('li');
        li.innerHTML = '<b>Step ' + (i + 1) + '</b> — latency rises ' + t.rise.toFixed(1) +
          '× once the working set passes <b>' + fmtBytes(t.bytes) + '</b> (' +
          fmtNs(t.from) + ' ns → ' + fmtNs(t.to) + ' ns). That is consistent with a cache of about ' +
          fmtBytes(t.bytes) + ' at this level.';
        list.appendChild(li);
      });
    }

    const tb = $('#table tbody'); tb.textContent = '';
    for (const p of state.points) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + fmtBytes(p.bytes) + '</td><td>' + (p.ns ? fmtNs(p.ns) : '—') +
        '</td><td>' + (p.median ? fmtNs(p.median) : '—') + '</td><td>' + (p.steps ? p.steps.toLocaleString('en-US') : '—') + '</td>';
      tb.appendChild(tr);
    }
    $('#results').hidden = false;
    draw();
  }

  /* ---------- run ---------- */
  function run() {
    if (state.running) return;
    state.running = true;
    state.points = []; state.transitions = [];
    const btn = $('#run'); btn.disabled = true; btn.textContent = 'Measuring…';
    $('#progress').hidden = false; $('#bar').style.width = '0%';
    $('#status').textContent = 'Building the access pattern…';

    const worker = new Worker('bench-worker.js');
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'start') { state.resolution = m.resolution; }
      if (m.type === 'point') {
        state.points[m.index] = m.point;
        const pct = ((m.index + 1) / m.total) * 100;
        $('#bar').style.width = pct.toFixed(1) + '%';
        $('#status').textContent = 'Working set ' + fmtBytes(m.point.bytes) +
          (m.point.ns ? ' → ' + fmtNs(m.point.ns) + ' ns per access' : ' → could not allocate');
        if (state.points.filter(Boolean).length > 3) { state.transitions = findTransitions(state.points); draw(); }
      }
      if (m.type === 'done') {
        state.points = m.points; state.resolution = m.resolution;
        state.running = false; btn.disabled = false; btn.textContent = 'Run it again';
        $('#progress').hidden = true;
        report();
        worker.terminate();
      }
    };
    worker.onerror = () => {
      state.running = false; btn.disabled = false; btn.textContent = 'Run the measurement';
      $('#progress').hidden = true;
      $('#status').textContent = 'The measurement could not start in this browser.';
    };
    worker.postMessage({
      maxBytes: Number($('#maxsize').value) * 1024 * 1024,
      repeats: Number($('#repeats').value),
      targetMs: 30,
    });
  }

  function exportJson() {
    const payload = {
      tool: 'Memory Wall Lab', version: 1,
      takenAt: new Date().toISOString(),
      clockResolutionMs: state.resolution,
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemoryGB: navigator.deviceMemory || null,
      candidateTransitions: (state.transitions || []).map(t => ({ bytes: t.bytes, rise: t.rise })),
      points: state.points.map(p => ({ bytes: p.bytes, nsMin: p.ns, nsMedian: p.median, steps: p.steps, runs: p.runs })),
      caveats: 'Browser timers are deliberately coarsened; values include JavaScript dispatch overhead and are upper bounds. The shape of the curve is the result, not the absolute numbers.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'memory-wall-' + Date.now() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#run').addEventListener('click', run);
    $('#export').addEventListener('click', exportJson);
    $('#maxsize').addEventListener('input', () => { $('#maxsize-out').textContent = $('#maxsize').value + ' MB'; });
    $('#repeats').addEventListener('input', () => { $('#repeats-out').textContent = $('#repeats').value + '×'; });
    const cores = navigator.hardwareConcurrency, mem = navigator.deviceMemory;
    $('#env').textContent = (cores ? cores + ' logical cores' : 'core count not exposed') +
      ' · ' + (mem ? 'about ' + mem + ' GB RAM reported' : 'memory size not exposed');
  });
})();
