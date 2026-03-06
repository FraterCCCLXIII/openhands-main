import React, { useEffect, useRef, useCallback } from 'react';

/**
 * ASCII Animation Component
 * 
 * Renders an animated ASCII art background matching openhands.dev
 * Based on the Webflow implementation with perlin noise and drifting bands
 */

interface ASCIIAnimationProps {
  className?: string;
}

// Configuration matching openhands.dev
const CFG = {
  angleDeg: 0,
  frequency: 11,
  contrast: 0.35,
  edgeWidth: 0.04,
  gapLevel: 0.3,
  flowSpeed: 0.018,
  driftX: 1.1021821192326178e-18,
  driftY: -0.018,
  warpAmp: 0.42,
  warpScale: 1.4,
  warpSpeed: 0.001,
  bandJitter: { enabled: true, amp: 0.2, scale: 0.85, speed: 0.05 },
  randomSet: Array.from(' .,:;*+![]{}<>-~'),
  lineSet: Array.from('    OPEN HANDS @@@    '),
  gapSet: Array.from('@'),
  randomChangeHz: 1.5,
  lineThreshold: 0,
  gapThreshold: 1,
  gapFan: { enabled: true, strength: 0.5 },
  streaks: {
    enabled: true,
    count: 3,
    char: ' ',
    randomDirection: true,
    useDriftDirection: true,
    angleJitterDeg: 75,
    widthMin: 0.008,
    widthMax: 0.028,
    lengthMin: 0.22,
    lengthMax: 0.7,
    speedMin: 0.12,
    speedMax: 0.3,
    startMargin: 0.18,
  },
  gapClouds: { enabled: true, density: 0.08, scale: 1.6, speed: 0.03, octaves: 3, hardness: 0.85 },
  erase: { enabled: true, radiusCells: 12, durationSec: 0.9, jitter: 0.35, hardness: 0.6 },
  fpsCap: 30,
};

// Gradient vectors for Perlin noise
const G: { x: number; y: number }[] = [];
for (let i = 0; i < 256; i++) {
  const a = (i / 256) * Math.PI * 2;
  G[i] = { x: Math.cos(a), y: Math.sin(a) };
}

// Permutation table
const P = new Uint8Array(512);
(function seedPerm() {
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  let s = 1234567;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  for (let i = 255; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const tmp = base[i];
    base[i] = base[j];
    base[j] = tmp;
  }
  for (let i = 0; i < 512; i++) P[i] = base[i & 255];
})();

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function grad(ix: number, iy: number, x: number, y: number) {
  const X = ix & 255,
    Y = iy & 255;
  const g = G[P[X + P[Y]]];
  return g.x * (x - ix) + g.y * (y - iy);
}

function perlin(x: number, y: number) {
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const x1 = x0 + 1,
    y1 = y0 + 1;
  const sx = fade(x - x0),
    sy = fade(y - y0);
  const n00 = grad(x0, y0, x, y);
  const n10 = grad(x1, y0, x, y);
  const n01 = grad(x0, y1, x, y);
  const n11 = grad(x1, y1, x, y);
  const ix0 = n00 + sx * (n10 - n00);
  const ix1 = n01 + sx * (n11 - n01);
  return ix0 + sy * (ix1 - ix0);
}

function fbm(x: number, y: number, oct = 3, gain = 0.5, lac = 2) {
  let v = 0,
    amp = 1,
    f = 1,
    norm = 0;
  for (let i = 0; i < oct; i++) {
    v += amp * perlin(x * f, y * f);
    norm += amp;
    amp *= gain;
    f *= lac;
  }
  return v / (norm || 1);
}

function hash32(n: number) {
  n = (n >>> 0) + 0x9e3779b9;
  n ^= n >>> 16;
  n = Math.imul(n, 0x85ebca6b);
  n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35);
  n ^= n >>> 16;
  return n >>> 0;
}

function hash3(x: number, y: number, z: number) {
  let h = 2166136261;
  h ^= x | 0;
  h = Math.imul(h, 16777619);
  h ^= y | 0;
  h = Math.imul(h, 16777619);
  h ^= z | 0;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}

const pickFrom = <T,>(arr: T[], h: number): T => arr[h % arr.length];
const randRange = (a: number, b: number) => a + Math.random() * (b - a);

export const ASCIIAnimation: React.FC<ASCIIAnimationProps> = ({ className = '' }) => {
  const preRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const stateRef = useRef({
    cols: 0,
    rows: 0,
    sShort: 1,
    t0: 0,
    lastFrame: 0,
    lastT: 0,
    cellW: 8,
    cellH: 14,
    eraseBuf: new Float32Array(1),
    streaks: [] as any[],
  });

  const measureCell = useCallback(() => {
    const pre = preRef.current;
    const container = containerRef.current;
    if (!pre || !container) return { cw: 8, lh: 14 };

    const probe = document.createElement('span');
    probe.textContent = 'M'.repeat(200);
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.top = '-9999px';
    probe.style.whiteSpace = 'pre';
    probe.style.pointerEvents = 'none';
    probe.style.visibility = 'hidden';

    const cs = getComputedStyle(pre);
    probe.style.font = cs.font;
    probe.style.letterSpacing = cs.letterSpacing;

    container.appendChild(probe);
    const totalW = probe.getBoundingClientRect().width;
    container.removeChild(probe);

    const cw = totalW / 200 || 8;
    const lh = parseFloat(cs.lineHeight) || 14;
    return { cw, lh };
  }, []);

  const computeGrid = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const m = measureCell();
    const state = stateRef.current;
    state.cellW = m.cw;
    state.cellH = m.lh;

    const rect = container.getBoundingClientRect();
    const c = Math.max(1, Math.floor(rect.width / state.cellW - 0.15));
    const r = Math.max(1, Math.floor(rect.height / state.cellH - 0.05));

    if (c === state.cols && r === state.rows) return;

    state.cols = c;
    state.rows = r;
    state.sShort = Math.min(c, r);
    state.eraseBuf = new Float32Array(c * r);
  }, [measureCell]);

  const makeDir = useCallback(() => {
    let dx = CFG.driftX || 0.0001;
    let dy = CFG.driftY || 0;
    if (CFG.streaks.enabled && CFG.streaks.randomDirection) {
      let baseAngle = CFG.streaks.useDriftDirection ? Math.atan2(dy, dx) : 0;
      baseAngle += randRange(-1, 1) * CFG.streaks.angleJitterDeg * (Math.PI / 180);
      dx = Math.cos(baseAngle);
      dy = Math.sin(baseAngle);
    }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    return { dx, dy, nx: -dy, ny: dx };
  }, []);

  const makeStreak = useCallback(
    (t: number) => {
      const s = CFG.streaks;
      const m = s.startMargin;
      const D = makeDir();
      return {
        dirx: D.dx,
        diry: D.dy,
        nrmx: D.nx,
        nrmy: D.ny,
        p0: randRange(-m, 1 + m),
        width: randRange(s.widthMin, s.widthMax),
        length: randRange(s.lengthMin, s.lengthMax),
        speed: randRange(s.speedMin, s.speedMax),
        headStart: -(randRange(s.lengthMin, s.lengthMax) + m),
        bornAt: t,
      };
    },
    [makeDir]
  );

  const initStreaks = useCallback(
    (t: number) => {
      const state = stateRef.current;
      state.streaks = [];
      if (!CFG.streaks.enabled || CFG.streaks.count <= 0) return;
      for (let i = 0; i < CFG.streaks.count; i++) {
        state.streaks.push(makeStreak(t));
      }
    },
    [makeStreak]
  );

  const inGapCloud = useCallback((u: number, v: number, t: number) => {
    if (!CFG.gapClouds.enabled) return false;
    const c = CFG.gapClouds;
    const n = fbm(u * c.scale + t * c.speed + 11.3, v * c.scale - t * c.speed - 7.9, c.octaves, 0.55, 2);
    const hardened = Math.pow(n, c.hardness);
    const threshold = 1 - c.density;
    const cellJit = ((hash3((u * 9999) | 0, (v * 9999) | 0, Math.floor(t)) % 997) / 997) * 0.02;
    return hardened + cellJit > threshold;
  }, []);

  const inAnyStreak = useCallback((u: number, v: number, t: number) => {
    const state = stateRef.current;
    if (!CFG.streaks.enabled || CFG.streaks.count <= 0) return false;
    const sm = CFG.streaks.startMargin;

    for (let i = 0; i < state.streaks.length; i++) {
      const st = state.streaks[i];
      const sCoord = u * st.dirx + v * st.diry;
      const pCoord = u * st.nrmx + v * st.nrmy;
      const head = st.headStart + st.speed * t;
      const tail = head - st.length;

      if (head > 1 + sm) {
        state.streaks[i] = makeStreak(t);
        continue;
      }
      if (Math.abs(pCoord - st.p0) <= st.width * 0.5 && sCoord >= tail && sCoord <= head) {
        return true;
      }
    }
    return false;
  }, [makeStreak]);

  const sampleBands = useCallback((x: number, y: number, t: number, rowNorm: number) => {
    const state = stateRef.current;
    const s = state.sShort || 1;
    let u = x / s;
    let v = y / s;
    u -= CFG.driftX * t;
    v -= CFG.driftY * t;

    const wt = t * CFG.warpSpeed;
    const wx = CFG.warpAmp * fbm(u * CFG.warpScale + 10.1 + wt, v * CFG.warpScale - 9.3 - wt, 3, 0.55, 2);
    const wy = CFG.warpAmp * fbm(u * CFG.warpScale - 30.9 - wt, v * CFG.warpScale + 19.7 + wt, 3, 0.8, 2);

    const ang = CFG.angleDeg * (Math.PI / 180);
    const rx = (u + wx) * Math.cos(ang) + (v + wy) * Math.sin(ang);
    const bandWave = 0.5 + 0.5 * Math.sin(rx * Math.PI * 2 * (CFG.frequency / 2));
    const ink = Math.pow(bandWave, CFG.contrast);
    const gap = 1 - ink;

    let gLevel = CFG.gapLevel;
    if (CFG.gapFan.enabled) {
      const fan = (1 - rowNorm) * CFG.gapFan.strength;
      gLevel += fan;
    }
    if (CFG.bandJitter.enabled) {
      const j = fbm(u * CFG.bandJitter.scale + 77.1, v * CFG.bandJitter.scale - 99.8, 3, 0.55, 2);
      gLevel += CFG.bandJitter.amp * (j - 0.5) * 2 + Math.sin(t * CFG.bandJitter.speed) * 0.02;
    }

    const aL = gLevel - CFG.edgeWidth;
    const bL = gLevel + CFG.edgeWidth;
    const tLine = clamp(1 - (gap - aL) / (bL - aL), 0, 1);
    const tGap = clamp((gap - aL) / (bL - aL), 0, 1);
    const bandIndex = Math.floor(rx * CFG.frequency);

    return { u: u + wx, v: v + wy, bandIndex, tLine, tGap };
  }, []);

  const baseChar = useCallback(
    (x: number, y: number, t: number, b: ReturnType<typeof sampleBands>) => {
      const { u, v, bandIndex, tLine, tGap } = b;

      if (inGapCloud(u, v, t)) return ' ';
      if (inAnyStreak(u, v, t - stateRef.current.t0 / 1000)) return CFG.streaks.char;

      if (tLine > CFG.lineThreshold) {
        const h = hash32(bandIndex * 73856093);
        return pickFrom(CFG.lineSet, h);
      }
      if (tGap > CFG.gapThreshold) {
        const h = hash32(bandIndex * 19349663);
        return pickFrom(CFG.gapSet, h);
      }

      const slice = Math.floor(t * CFG.randomChangeHz);
      const h2 = hash32(((x + 1) * 15485863) ^ ((y + 1) * 32452843) ^ (slice * 49979687));
      return CFG.randomSet[h2 % CFG.randomSet.length];
    },
    [inGapCloud, inAnyStreak, sampleBands]
  );

  const chooseChar = useCallback(
    (x: number, y: number, t: number, b: ReturnType<typeof sampleBands>) => {
      const state = stateRef.current;
      const idx = y * state.cols + x;
      if (state.eraseBuf[idx] > 0) return ' ';
      return baseChar(x, y, t, b);
    },
    [baseChar]
  );

  const render = useCallback(
    (now: number) => {
      const state = stateRef.current;
      const pre = preRef.current;

      if (!pre || now - state.lastFrame < 1000 / CFG.fpsCap) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const t = (now - state.t0) / 1000;
      const dt = t - state.lastT;
      state.lastT = t;
      state.lastFrame = now;

      // Decay erase buffer
      if (CFG.erase.enabled) {
        const decay = dt > 0 ? dt : 0.016;
        for (let i = 0; i < state.eraseBuf.length; i++) {
          const v = state.eraseBuf[i] - decay;
          state.eraseBuf[i] = v > 0 ? v : 0;
        }
      }

      // Build output
      let out = '';
      for (let y = 0; y < state.rows; y++) {
        const rowNorm = state.rows <= 1 ? 0 : y / (state.rows - 1);
        for (let x = 0; x < state.cols; x++) {
          const b = sampleBands(x, y, t, rowNorm);
          out += chooseChar(x, y, t, b);
        }
        if (y < state.rows - 1) out += '\n';
      }

      pre.textContent = out;
      animationRef.current = requestAnimationFrame(render);
    },
    [sampleBands, chooseChar]
  );

  const handleErase = useCallback((ev: MouseEvent | TouchEvent) => {
    if (!CFG.erase.enabled) return;
    const pre = preRef.current;
    if (!pre) return;

    const state = stateRef.current;
    const rect = pre.getBoundingClientRect();
    const touch = 'touches' in ev ? ev.touches[0] : ev;
    const ex = touch.clientX - rect.left;
    const ey = touch.clientY - rect.top;

    let cx = Math.floor(ex / state.cellW);
    let cy = Math.floor(ey / state.cellH);
    cx = Math.max(0, Math.min(state.cols - 1, cx));
    cy = Math.max(0, Math.min(state.rows - 1, cy));

    const R = CFG.erase.radiusCells | 0;
    const dur = CFG.erase.durationSec;
    const hard = clamp(CFG.erase.hardness, 0, 1);
    const jit = clamp(CFG.erase.jitter, 0, 1);
    const r2 = R * R;

    const x0 = Math.max(0, cx - R),
      x1 = Math.min(state.cols - 1, cx + R);
    const y0 = Math.max(0, cy - R),
      y1 = Math.min(state.rows - 1, cy + R);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx,
          dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;

        const d = Math.sqrt(d2) / R;
        const falloff = Math.pow(1 - d, hard * 3 + 0.01);
        const h = (hash3(x * 131 + y * 911, y * 521 + x * 173, cx * 7 + cy * 13) % 1000) / 1000;
        const accept = h < falloff * (1 - jit) + (falloff > 0.5 ? jit * 0.6 : jit * 0.2);

        if (accept) {
          const idx = y * state.cols + x;
          state.eraseBuf[idx] = Math.max(state.eraseBuf[idx], dur * falloff);
        }
      }
    }
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    state.t0 = performance.now();

    computeGrid();
    initStreaks(0);

    animationRef.current = requestAnimationFrame(render);

    const pre = preRef.current;
    if (pre) {
      pre.addEventListener('mousemove', handleErase as any);
      pre.addEventListener('touchstart', handleErase as any, { passive: true });
      pre.addEventListener('touchmove', handleErase as any, { passive: true });
    }

    const ro = new ResizeObserver(computeGrid);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      ro.disconnect();
      if (pre) {
        pre.removeEventListener('mousemove', handleErase as any);
        pre.removeEventListener('touchstart', handleErase as any);
        pre.removeEventListener('touchmove', handleErase as any);
      }
    };
  }, [computeGrid, initStreaks, render, handleErase]);

  return (
    <div
      ref={containerRef}
      className={`ascii-embed ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <pre
        ref={preRef}
        className="ascii-pre"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          margin: 0,
          padding: 0,
          color: 'rgb(34, 21, 13)',
          backgroundColor: 'transparent',
          fontFamily: 'monospace',
          // Match openhands.dev: 12px font-size, 0.12 opacity
          fontSize: '12px',
          lineHeight: '12px',
          opacity: 0.12,
          overflow: 'hidden',
          whiteSpace: 'pre',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};

export default ASCIIAnimation;
