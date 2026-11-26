/* Memory Wall Lab — measurement worker.
 *
 * Method: dependent-load pointer chasing. We build one closed cycle through a
 * working set, visiting one 64-byte cache line per step in random order, then
 * follow it. Each load's address comes from the previous load's result, so the
 * processor cannot overlap them and cannot usefully prefetch. The time per step
 * is therefore a latency, not a bandwidth.
 *
 * As the working set grows past each level of cache, the average latency steps
 * up. Those steps are what the chart shows.
 */
'use strict';

const LINE = 64;                 // bytes per cache line we assume
const U32_PER_LINE = LINE / 4;   // Uint32Array slots per line
let sink = 0;                    // keeps the chase from being optimised away

/* Smallest non-zero gap performance.now() will report here.
   Browsers deliberately coarsen this clock, so we must know how coarse. */
function clockResolution() {
  let best = Infinity;
  for (let i = 0; i < 20000; i++) {
    const a = performance.now();
    let b = performance.now();
    while (b === a) b = performance.now();
    const d = b - a;
    if (d > 0 && d < best) best = d;
  }
  return best === Infinity ? 0 : best;
}

/* One closed cycle over `nodes` cache lines, in random order. */
function buildCycle(bytes) {
  const slots = bytes / 4;
  const nodes = bytes / LINE;
  const order = new Uint32Array(nodes);
  for (let i = 0; i < nodes; i++) order[i] = i;
  for (let i = nodes - 1; i > 0; i--) {           // Fisher-Yates
    const j = (Math.random() * (i + 1)) | 0;
    const t = order[i]; order[i] = order[j]; order[j] = t;
  }
  const arr = new Uint32Array(slots);
  for (let k = 0; k < nodes; k++) {
    arr[order[k] * U32_PER_LINE] = order[(k + 1) % nodes] * U32_PER_LINE;
  }
  return arr;
}

function chase(arr, steps, start) {
  let p = start;
  for (let i = 0; i < steps; i++) p = arr[p];
  return p;
}

/* Time `steps` dependent loads and return nanoseconds per load. */
function timeChase(arr, steps) {
  let p = 0;
  const t0 = performance.now();
  p = chase(arr, steps, p);
  const t1 = performance.now();
  sink ^= p;
  return { ms: t1 - t0, ns: ((t1 - t0) * 1e6) / steps };
}

/* Choose a step count long enough that the coarse clock stops mattering. */
function calibrate(arr, targetMs) {
  let steps = 50000;
  for (let i = 0; i < 24; i++) {
    const { ms } = timeChase(arr, steps);
    if (ms >= targetMs) return steps;
    const factor = ms > 0.05 ? Math.min(8, (targetMs / ms) * 1.3) : 8;
    steps = Math.min(400e6, Math.ceil(steps * factor));
  }
  return steps;
}

function measure(bytes, opts) {
  let arr;
  try {
    arr = buildCycle(bytes);
  } catch (e) {
    return { bytes, failed: 'allocation' };
  }
  chase(arr, Math.min(2e6, (bytes / LINE) * 4), 0);      // warm the TLB and caches
  const steps = calibrate(arr, opts.targetMs);
  const runs = [];
  for (let r = 0; r < opts.repeats; r++) runs.push(timeChase(arr, steps).ns);
  runs.sort((a, b) => a - b);
  return {
    bytes, steps, runs,
    ns: runs[0],                                          // min: least disturbed run
    median: runs[(runs.length / 2) | 0],
    spread: runs[runs.length - 1] - runs[0],
  };
}

self.onmessage = (e) => {
  const { maxBytes = 64 * 1024 * 1024, repeats = 3, targetMs = 30 } = e.data || {};
  const resolution = clockResolution();
  const sizes = [];
  for (let b = 8 * 1024; b <= maxBytes; b = Math.round(b * Math.SQRT2 / LINE) * LINE) {
    sizes.push(b);
    if (b > maxBytes / 1.2 && b < maxBytes) sizes.push(maxBytes);
  }
  const unique = [...new Set(sizes)].filter(b => b <= maxBytes).sort((a, b) => a - b);

  self.postMessage({ type: 'start', total: unique.length, resolution });
  const points = [];
  for (let i = 0; i < unique.length; i++) {
    const point = measure(unique[i], { repeats, targetMs });
    points.push(point);
    self.postMessage({ type: 'point', index: i, total: unique.length, point });
  }
  self.postMessage({ type: 'done', points, resolution, sink });
};
