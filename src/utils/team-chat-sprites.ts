/* eslint-disable no-param-reassign -- the scene is stepped in place: this is a simulation that owns the sprites it moves. */
/**
 * The team chat welcome scene: a small crew of pixel sprites, people and agents, that wander, meet
 * in pairs and swap speech bubbles. When an agent meets a person it asks, the person answers, and
 * the agent thanks them: the team-chat rule that agents ask their owner before they act.
 */

export type SpriteKind = "person" | "agent";
export type Glyph = "typing" | "ask" | "yes" | "wave" | "heart";

export interface Sprite {
  id: number;
  kind: SpriteKind;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 1 faces right, -1 faces left. */
  face: 1 | -1;
  mode: "wander" | "meet";
  partner: number | null;
  bubble: { glyph: Glyph; ttl: number } | null;
  phase: number;
  /** Counts down to the next blink; the eyes shut when it passes zero. */
  blink: number;
}

interface Beat {
  who: 0 | 1;
  glyph: Glyph;
  seconds: number;
}

export interface SpriteScene {
  w: number;
  h: number;
  t: number;
  rand: () => number;
  sprites: Sprite[];
  /** Pairs that are talking now, drawn as a line between them. */
  links: Array<[number, number]>;
  next: number;
  /** Finished agent requests: the agent asked, the person answered. */
  stories: number;
  scripts: Map<number, { beats: Beat[]; at: number; into: number }>;
}

export function seededRandom(seed = 11): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SPRITE_COLORS = [
  "#38bdf8",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
  "#f97316",
  "#a3e635",
];
const KINDS: SpriteKind[] = [
  "person",
  "agent",
  "person",
  "agent",
  "person",
  "person",
  "agent",
  "person",
  "agent",
];
const MAX_SPEED = 30;
const MEET_DISTANCE = 78;

export function createSpriteScene(
  w: number,
  h: number,
  rand: () => number = Math.random,
): SpriteScene {
  const sprites: Sprite[] = KINDS.map((kind, id) => ({
    id,
    kind,
    color: SPRITE_COLORS[id % SPRITE_COLORS.length],
    x: 60 + rand() * Math.max(1, w - 120),
    y: 60 + rand() * Math.max(1, h - 120),
    vx: (rand() - 0.5) * 20,
    vy: (rand() - 0.5) * 20,
    face: rand() < 0.5 ? 1 : -1,
    mode: "wander",
    partner: null,
    bubble: null,
    phase: rand() * 6,
    blink: 1 + rand() * 3,
  }));
  return {
    w,
    h,
    t: 0,
    rand,
    sprites,
    links: [],
    next: 1.2,
    stories: 0,
    scripts: new Map(),
  };
}

const scriptFor = (
  a: Sprite,
  b: Sprite,
): { who0: Sprite; who1: Sprite; beats: Beat[]; story: boolean } => {
  if (a.kind !== b.kind) {
    const agent = a.kind === "agent" ? a : b;
    const person = agent === a ? b : a;
    return {
      who0: agent,
      who1: person,
      story: true,
      beats: [
        { who: 0, glyph: "ask", seconds: 1.5 },
        { who: 1, glyph: "typing", seconds: 1.1 },
        { who: 1, glyph: "yes", seconds: 1.3 },
        { who: 0, glyph: "heart", seconds: 1.3 },
      ],
    };
  }
  return {
    who0: a,
    who1: b,
    story: false,
    beats: [
      { who: 0, glyph: "wave", seconds: 1.2 },
      { who: 1, glyph: "typing", seconds: 1.1 },
      { who: 1, glyph: "heart", seconds: 1.2 },
    ],
  };
};

/** Advances the scene: sprites drift, pair up, play a short exchange, and drift apart again. */
export function stepSpriteScene(s: SpriteScene, dt: number): void {
  s.t += dt;
  const { w, h, rand } = s;
  s.next -= dt;
  const free = s.sprites.filter((p) => p.mode === "wander");
  if (s.next <= 0 && free.length >= 2) {
    s.next = 1.6 + rand() * 2.2;
    const a = free[Math.floor(rand() * free.length)];
    const others = free.filter((p) => p !== a);
    // Prefer an agent and a person, so the ask-and-approve exchange happens most often.
    const unlike = others.filter((p) => p.kind !== a.kind);
    const pool = unlike.length && rand() < 0.7 ? unlike : others;
    const b = pool[Math.floor(rand() * pool.length)];
    const script = scriptFor(a, b);
    a.mode = "meet";
    b.mode = "meet";
    a.partner = b.id;
    b.partner = a.id;
    s.scripts.set(Math.min(a.id, b.id), {
      beats: script.beats.map((beat) => ({ ...beat })),
      at: 0,
      into: 0,
    });
    (s.scripts.get(Math.min(a.id, b.id)) as { story?: boolean }).story =
      script.story;
    (s.scripts.get(Math.min(a.id, b.id)) as { speakers?: number[] }).speakers =
      [script.who0.id, script.who1.id];
  }
  s.links = [];
  s.sprites.forEach((p) => {
    p.blink -= dt;
    if (p.blink < -0.12) p.blink = 1.5 + rand() * 3.5;
    if (p.bubble) {
      p.bubble.ttl -= dt;
      if (p.bubble.ttl <= 0) p.bubble = null;
    }
    let ax = 0,
      ay = 0;
    if (p.mode === "meet" && p.partner !== null) {
      const q = s.sprites[p.partner];
      const dx = q.x - p.x,
        dy = q.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const pull =
        d > MEET_DISTANCE ? 55 : (-12 * (MEET_DISTANCE - d)) / MEET_DISTANCE;
      ax = (dx / d) * pull;
      ay = (dy / d) * pull;
      p.face = dx >= 0 ? 1 : -1;
      if (p.id < q.id && d < MEET_DISTANCE * 2.2) s.links.push([p.id, q.id]);
    } else {
      ax = (rand() - 0.5) * 60;
      ay = (rand() - 0.5) * 60;
      // Keep out of the middle, where the title and buttons are.
      const cx = (p.x - w / 2) / (w * 0.24),
        cy = (p.y - h * 0.46) / (h * 0.26);
      const inside = cx * cx + cy * cy;
      if (inside < 1) {
        ax += (cx || 0.1) * 520 * (1 - inside);
        ay += (cy || 0.1) * 520 * (1 - inside);
        p.vx *= 0.9;
        p.vy *= 0.9;
        // Slide out of the middle rather than only being nudged, so nobody lingers behind the title.
        p.x += (cx || 0.1) * w * 0.24 * (1 - inside) * dt * 5;
        p.y += (cy || 0.1) * h * 0.26 * (1 - inside) * dt * 5;
      }
    }
    p.vx = (p.vx + ax * dt) * Math.max(0, 1 - 1.6 * dt);
    p.vy = (p.vy + ay * dt) * Math.max(0, 1 - 1.6 * dt);
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.mode === "wander" && Math.abs(p.vx) > 4) p.face = p.vx > 0 ? 1 : -1;
    if (p.x < 36) {
      p.x = 36;
      p.vx = Math.abs(p.vx);
    }
    if (p.x > w - 36) {
      p.x = w - 36;
      p.vx = -Math.abs(p.vx);
    }
    if (p.y < 56) {
      p.y = 56;
      p.vy = Math.abs(p.vy);
    }
    if (p.y > h - 40) {
      p.y = h - 40;
      p.vy = -Math.abs(p.vy);
    }
  });

  // Exchanges: each pair plays its beats once the two have come together.
  s.scripts.forEach((script, key) => {
    const meta = script as typeof script & {
      story?: boolean;
      speakers?: number[];
    };
    const [ia, ib] = meta.speakers ?? [key, key];
    const a = s.sprites[ia],
      b = s.sprites[ib];
    if (
      Math.hypot(a.x - b.x, a.y - b.y) > MEET_DISTANCE * 1.5 &&
      script.into === 0
    )
      return;
    script.at += dt;
    const beat = script.beats[script.into];
    if (!beat) {
      a.mode = "wander";
      b.mode = "wander";
      a.partner = null;
      b.partner = null;
      a.bubble = null;
      b.bubble = null;
      if (meta.story) s.stories += 1;
      s.scripts.delete(key);
      return;
    }
    const speaker = beat.who === 0 ? a : b;
    if (speaker.bubble?.glyph !== beat.glyph)
      speaker.bubble = { glyph: beat.glyph, ttl: beat.seconds };
    if (script.at >= beat.seconds) {
      script.at = 0;
      script.into += 1;
      if (script.into < script.beats.length) {
        (beat.who === 0 ? a : b).bubble = null;
      }
    }
  });
}
