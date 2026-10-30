/* eslint-disable no-param-reassign -- the canvas 2D context is a mutable drawing API: setting fillStyle and friends is how it is used. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessagesSquare } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import {
  createSpriteScene,
  stepSpriteScene,
  type Glyph,
  type Sprite,
  type SpriteScene,
} from "#/utils/team-chat-sprites";
import { primaryButtonClassName } from "./team-chat-ui";

const KAMIJI_NAME = "Kamiji";
const KOSMOS_NAME = "Kosmos";
const CELL = 4;
const PERSON = [
  "...XXXXXX...",
  "..XXXXXXXX..",
  ".XXXXXXXXXX.",
  ".XXEEXXEEXX.",
  ".XXEEXXEEXX.",
  ".XXXXXXXXXX.",
  ".XXXMMMMXXX.",
  "..XXXXXXXX..",
  "...XXXXXX...",
  "..X.XXXX.X..",
  "....X..X....",
  "...XX..XX...",
];
const AGENT = [
  ".....AA.....",
  ".....AA.....",
  "..XXXXXXXX..",
  ".XXXXXXXXXX.",
  ".XVVVVVVVVX.",
  ".XVEVVVVEVX.",
  ".XVVVVVVVVX.",
  ".XXXXXXXXXX.",
  "..XXXXXXXX..",
  ".XXXXXXXXXX.",
  "..XX....XX..",
  "..XX....XX..",
];
const GLYPHS: Record<Exclude<Glyph, "typing">, string[]> = {
  ask: ["XXX.", "..X.", ".XX.", "....", ".X.."],
  yes: ["....X", "...XX", "X.XX.", ".XX..", "..X.."],
  wave: [".X.", ".X.", ".X.", "...", ".X."],
  heart: [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."],
};

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) =>
    Math.max(
      0,
      Math.min(
        255,
        Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount)),
      ),
    );
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("")}`;
}

function paint(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  flip: boolean,
  colors: Partial<Record<string, string>>,
  cell = CELL,
) {
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx += 1) {
      const key = row[flip ? row.length - 1 - rx : rx];
      const color = colors[key];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x + rx * cell),
          Math.round(y + ry * cell),
          cell,
          cell,
        );
      }
    }
  });
}

function drawSprite(ctx: CanvasRenderingContext2D, p: Sprite, t: number) {
  const size = 12 * CELL;
  const bob = Math.round(Math.sin(t * 3 + p.phase) * 2);
  const x = p.x - size / 2,
    y = p.y - size / 2 + bob;
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + size / 2 + 4, size * 0.34, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const shut = p.blink < 0;
  const eye = shut ? p.color : "#1b1230";
  const colors =
    p.kind === "agent"
      ? {
          X: p.color,
          A: shade(p.color, 0.45),
          V: shade(p.color, -0.62),
          E: shut ? shade(p.color, -0.62) : "#e6fffa",
        }
      : { X: p.color, E: eye, M: shade(p.color, -0.6) };
  paint(ctx, p.kind === "agent" ? AGENT : PERSON, x, y, p.face < 0, colors);
}

const HAND_PALM =
  "M14.5 41C14.5 32 21 29.5 32 29.5S49.5 32 49.5 41C49.5 53 42 59 32 59S14.5 53 14.5 41Z";
const HAND_FINGERS: [number, number, number, number, number][] = [
  [17, 40, 8.5, 23.5, 8.4],
  [24.5, 34, 21.5, 13, 9],
  [32, 32, 32, 8.5, 9.6],
  [39.5, 34, 43, 13.5, 9],
  [47, 44, 57.5, 33, 9.4],
];

/** The Kamiji hand: a soft blob with five fingers and big eyes, drawn from the same shapes as the avatars. */
function drawBlob(ctx: CanvasRenderingContext2D, p: Sprite, t: number) {
  const size = 12 * CELL;
  const k = (size * 1.15) / 64;
  const bob = Math.sin(t * 3 + p.phase) * 2;
  const ox = p.x - 32 * k;
  const oy = p.y - 32 * k + bob;
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + size / 2 + 4, size * 0.34, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const hand = (fill: string, dx: number, dy: number) => {
    ctx.save();
    ctx.translate(ox + dx * k, oy + dy * k);
    ctx.scale(k * (p.face < 0 ? -1 : 1), k);
    if (p.face < 0) ctx.translate(-64, 0);
    ctx.fillStyle = fill;
    ctx.strokeStyle = fill;
    ctx.lineCap = "round";
    ctx.fill(new Path2D(HAND_PALM));
    HAND_FINGERS.forEach(([x1, y1, x2, y2, w]) => {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.restore();
  };
  hand(shade(p.color, -0.3), 0.9, 1.2);
  hand(p.color, 0, 0);
  const shut = p.blink < 0;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(k * (p.face < 0 ? -1 : 1), k);
  if (p.face < 0) ctx.translate(-64, 0);
  [26.2, 37.8].forEach((cx) => {
    ctx.fillStyle = "#eceff1";
    ctx.beginPath();
    ctx.ellipse(cx, 43, 3.5, shut ? 0.6 : 4.3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!shut) {
      ctx.fillStyle = "#15171a";
      ctx.beginPath();
      ctx.ellipse(cx + 0.2, 43.4, 1.9, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, p: Sprite, t: number) {
  if (!p.bubble) return;
  const bx = Math.round(p.x - 16),
    by = Math.round(p.y - (12 * CELL) / 2 - 34);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(bx + 2, by, 28, 22);
  ctx.fillRect(bx, by + 2, 32, 18);
  ctx.fillRect(bx + 8, by + 22, 6, 4);
  ctx.fillRect(bx + 8, by + 26, 3, 3);
  ctx.fillStyle = "#1b1230";
  if (p.bubble.glyph === "typing") {
    for (let i = 0; i < 3; i += 1)
      ctx.fillRect(
        bx + 7 + i * 7,
        by + 9 + Math.round(Math.sin(t * 8 + i) * 2),
        4,
        4,
      );
    return;
  }
  const rows = GLYPHS[p.bubble.glyph];
  ctx.fillStyle =
    p.bubble.glyph === "heart"
      ? "#e11d48"
      : p.bubble.glyph === "yes"
        ? "#059669"
        : "#1b1230";
  paint(
    ctx,
    rows,
    bx + (32 - rows[0].length * 3) / 2,
    by + 3,
    false,
    { X: ctx.fillStyle as string },
    3,
  );
}

type CrewStyle = "pixel" | "blobby";
const STYLE_OPTIONS: { id: CrewStyle; label: I18nKey }[] = [
  { id: "pixel", label: I18nKey.TEAM_CHAT$STYLE_PIXEL },
  { id: "blobby", label: I18nKey.TEAM_CHAT$STYLE_BLOBBY },
];
const STYLE_KEY = "team-chat-welcome-style";

function readStyle(): CrewStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === "blobby" ? "blobby" : "pixel";
  } catch {
    return "pixel";
  }
}

function render(
  ctx: CanvasRenderingContext2D,
  scene: SpriteScene,
  style: CrewStyle,
) {
  ctx.clearRect(0, 0, scene.w, scene.h);
  ctx.imageSmoothingEnabled = false;
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  scene.links.forEach(([a, b]) => {
    const p = scene.sprites[a],
      q = scene.sprites[b];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 10);
    ctx.lineTo(q.x, q.y - 10);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  [...scene.sprites]
    .sort((a, b) => a.y - b.y)
    .forEach((p) =>
      style === "blobby"
        ? drawBlob(ctx, p, scene.t)
        : drawSprite(ctx, p, scene.t),
    );
  scene.sprites.forEach((p) => drawBubble(ctx, p, scene.t));
}

/**
 * The team chat welcome screen: a pixel crew of people and agents wandering and talking behind the
 * title, with a way into the sign-in dialog and a way to look around the sample team first.
 */
export function TeamChatWelcome({
  onStart,
  onExplore,
}: {
  onStart: () => void;
  onExplore: () => void;
}) {
  const { t } = useTranslation("openhands");
  const canvas = useRef<HTMLCanvasElement>(null);
  const [style, setStyle] = useState<CrewStyle>(readStyle);
  const styleRef = useRef(style);
  const redraw = useRef<() => void>(() => {});

  const chooseStyle = useCallback((next: CrewStyle) => {
    styleRef.current = next;
    setStyle(next);
    try {
      localStorage.setItem(STYLE_KEY, next);
    } catch {
      /* storage unavailable */
    }
    redraw.current();
  }, []);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext?.("2d");
    if (!el || !ctx) return undefined;
    const still = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let scene: SpriteScene | null = null;
    let raf = 0;
    let last = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width)),
        h = Math.max(1, Math.round(rect.height));
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene = createSpriteScene(w, h);
      for (let i = 0; i < 60; i += 1) stepSpriteScene(scene, 0.1);
      if (still) render(ctx, scene, styleRef.current);
    };
    const tick = (now: number) => {
      if (!scene) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      stepSpriteScene(scene, dt);
      render(ctx, scene, styleRef.current);
      raf = requestAnimationFrame(tick);
    };
    const start = requestAnimationFrame(() => {
      size();
      if (!still) raf = requestAnimationFrame(tick);
    });
    redraw.current = () => {
      if (still && scene) render(ctx, scene, styleRef.current);
    };
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <div
      data-testid="team-chat-welcome"
      className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-base"
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="absolute inset-0 size-full"
      />
      <div
        role="group"
        data-testid="team-welcome-style"
        className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-surface-raised px-2.5 py-2"
      >
        {STYLE_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            data-testid={`team-welcome-style-${id}`}
            aria-label={t(label)}
            title={t(label)}
            aria-pressed={style === id}
            onClick={() => chooseStyle(id)}
            className={`size-3 rounded-full border border-muted transition-colors ${style === id ? "bg-contrast border-contrast" : "bg-transparent hover:bg-muted"}`}
          />
        ))}
      </div>
      <div
        role="group"
        aria-label={t(I18nKey.TEAM_CHAT$BUILT_WITH)}
        data-testid="team-welcome-built-with"
        className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 text-xs text-muted"
      >
        <span aria-hidden="true">{t(I18nKey.TEAM_CHAT$BUILT_WITH)}</span>
        <a
          href="https://github.com/FraterCCCLXIII/kamiji"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 transition-opacity hover:opacity-100"
        >
          <img
            src="/logos/kamiji.svg"
            alt={KAMIJI_NAME}
            className="h-5 w-auto"
          />
        </a>
        <a
          href="https://kosmos.computer"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 transition-opacity hover:opacity-100"
        >
          <img
            src="/logos/kosmos.svg"
            alt={KOSMOS_NAME}
            className="h-4 w-auto"
          />
        </a>
      </div>
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="flex size-20 items-center justify-center rounded-3xl bg-surface-raised text-contrast">
          <MessagesSquare size={44} strokeWidth={2.5} aria-hidden />
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-contrast">
          {t(I18nKey.TEAM_CHAT$NAV_LABEL)}
        </h1>
        <p className="max-w-xs text-sm font-medium text-muted">
          {t(I18nKey.TEAM_CHAT$WELCOME_TAGLINE)}
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            data-testid="team-welcome-start"
            className={`${primaryButtonClassName} rounded-full px-6 py-2.5`}
            onClick={onStart}
          >
            {t(I18nKey.TEAM_CHAT$SAMPLE_OPEN)}
          </button>
          <button
            type="button"
            data-testid="team-welcome-explore"
            className="text-sm text-muted underline-offset-2 hover:text-contrast hover:underline"
            onClick={onExplore}
          >
            {t(I18nKey.TEAM_CHAT$EXPLORE_SAMPLE)}
          </button>
        </div>
      </div>
    </div>
  );
}
