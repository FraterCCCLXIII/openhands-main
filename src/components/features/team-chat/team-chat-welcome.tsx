/* eslint-disable no-param-reassign -- the canvas 2D context is a mutable drawing API: setting fillStyle and friends is how it is used. */
import { useEffect, useRef } from "react";
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

function render(ctx: CanvasRenderingContext2D, scene: SpriteScene) {
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
    .forEach((p) => drawSprite(ctx, p, scene.t));
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
      if (still) render(ctx, scene);
    };
    const tick = (now: number) => {
      if (!scene) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      stepSpriteScene(scene, dt);
      render(ctx, scene);
      raf = requestAnimationFrame(tick);
    };
    const start = requestAnimationFrame(() => {
      size();
      if (!still) raf = requestAnimationFrame(tick);
    });
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
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-raised text-contrast">
          <MessagesSquare size={24} aria-hidden />
        </span>
        <h1 className="text-4xl font-light tracking-tight text-contrast">
          {t(I18nKey.TEAM_CHAT$NAV_LABEL)}
        </h1>
        <p className="max-w-xs text-sm font-light text-muted">
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
