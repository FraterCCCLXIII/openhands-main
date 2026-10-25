/* eslint-disable i18next/no-literal-string -- dev-only prototype page, not product copy */
import React from "react";
import { Navigate } from "react-router";
import { KamijiAvatar } from "#/components/features/kamiji/kamiji-avatar";
import {
  KAMIJI_EMOTE_TYPES,
  KamijiEmoteType,
  KamijiWithEmote,
} from "#/components/features/kamiji/kamiji-emote";
import {
  KAMIJI_COLOR_PRESETS,
  KAMIJI_COUNT_POSES,
  KAMIJI_POSES,
  KamijiAnimation,
  KamijiExpression,
  KamijiPose,
  DEFAULT_KAMIJI_COLOR,
  getKamijiColor,
} from "#/components/features/kamiji/kamiji-expressions";
import {
  KAMIJI_SHAPES,
  KamijiShape,
} from "#/components/features/kamiji/kamiji-shape";
import {
  KAMIJI_GIT_ICON_TYPES,
  KamijiGitIcon,
  KamijiGitIconType,
} from "#/components/features/kamiji/kamiji-git-icon";
import { KamijiHandsUp } from "#/components/features/kamiji/kamiji-hands-up";
import { KamijiMochiShowcase } from "#/components/features/kamiji/kamiji-mochi-showcase";
import { KamijiExperiments } from "#/components/features/kamiji/kamiji-experiments";
import { KamijiSimConversation } from "#/components/features/kamiji/kamiji-sim-conversation";
import { AVAILABLE_COLOR_THEMES } from "#/themes/color-theme/definitions";
import type { ColorThemeKey } from "#/themes/color-theme/types";
import {
  applyColorTheme,
  readPersistedColorTheme,
} from "#/themes/color-theme/runtime";
import { cn } from "#/utils/utils";

const HERO_ANIMATIONS: KamijiAnimation[] = [
  "Idle",
  "Wave",
  "Hello",
  "Spin",
  "Bounce",
  "TurnPoint",
  "Typing",
  "Think",
  "Celebrate",
];

const GIT_TILES: Record<
  KamijiGitIconType,
  { label: string; expression: KamijiExpression; pose: KamijiPose }
> = {
  commit: { label: "commit", expression: "happy", pose: "thumbsUp" },
  pullRequest: { label: "pull request", expression: "thinking", pose: "point" },
  merge: { label: "merge", expression: "excited", pose: "peace" },
  pass: { label: "checks pass", expression: "excited", pose: "thumbsUp" },
  error: { label: "error", expression: "sad", pose: "fist" },
};

const SHAPE_SEQUENCE: KamijiShape[] = [
  "hand",
  "hand",
  "sphere",
  "sphere",
  "hand",
  "hand",
  "cube",
  "cube",
];
const SHAPE_TWEEN_MS = 800;

const HERO_POSES = [...new Set([...KAMIJI_POSES, ...KAMIJI_COUNT_POSES])];

const POSE_INTERVAL_MS = 1800;
const POSE_TWEEN_MS = 600;
const TILE_SIZE = 96;
const HERO_SIZE = 280;
const EMOTE_TILE_SIZE = 120;

interface EmoteTile {
  type: KamijiEmoteType;
  expression: KamijiExpression;
  text?: string;
}

const EMOTE_TILES: EmoteTile[] = [
  { type: "panicLines", expression: "surprised" },
  { type: "speechBubble", expression: "happy", text: "Hi!" },
  { type: "thoughtBubble", expression: "thinking" },
  { type: "sweatDrop", expression: "sad" },
  { type: "exclamation", expression: "surprised" },
  { type: "doubleExclamation", expression: "excited" },
  { type: "question", expression: "thinking" },
  { type: "heart", expression: "happy" },
  { type: "sparkle", expression: "excited" },
  { type: "zzz", expression: "sleepy" },
  { type: "lightbulb", expression: "excited" },
  { type: "angerVein", expression: "angry" },
  { type: "musicNote", expression: "happy" },
  { type: "dizzySwirl", expression: "sleepy" },
  { type: "tear", expression: "sad" },
  { type: "blush", expression: "happy" },
];

interface Tile {
  name: string;
  expression: KamijiExpression;
  animation: KamijiAnimation;
  offset: number;
}

const TILES: Tile[] = [
  { name: "planner", expression: "thinking", animation: "Think", offset: 1 },
  { name: "coder", expression: "happy", animation: "Bounce", offset: 2 },
  { name: "reviewer", expression: "angry", animation: "TurnPoint", offset: 3 },
  { name: "tester", expression: "surprised", animation: "Spin", offset: 4 },
  {
    name: "deployer",
    expression: "excited",
    animation: "Celebrate",
    offset: 5,
  },
  { name: "scribe", expression: "sleepy", animation: "Idle", offset: 6 },
  { name: "scout", expression: "sad", animation: "Idle", offset: 0 },
  { name: "ops", expression: "neutral", animation: "Hello", offset: 2 },
];

function usePoseCycle(playing: boolean) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(
      () => setTick((n) => n + 1),
      POSE_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [playing]);
  return tick;
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm",
        active
          ? "bg-foreground text-canvas-base"
          : "bg-surface-raised hover:bg-interactive-hover",
      )}
    >
      {children}
    </button>
  );
}

/** One layer of controls: a title over a horizontally scrolling row. */
function LayerRow({
  title,
  testId,
  children,
}: {
  title: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div
        className="custom-scrollbar-always flex items-center gap-2 overflow-x-auto pb-2"
        data-testid={testId}
      >
        {children}
      </div>
    </div>
  );
}

export default function MockKamijis() {
  const [playing, setPlaying] = React.useState(true);
  const [heroPose, setHeroPose] = React.useState<KamijiPose | null>(null);
  const [heroAnimation, setHeroAnimation] =
    React.useState<KamijiAnimation>("Idle");
  const [heroEmote, setHeroEmote] = React.useState<KamijiEmoteType | null>(
    null,
  );
  const [heroShape, setHeroShape] = React.useState<KamijiShape | null>(null);
  const [lockFace, setLockFace] = React.useState(false);
  const [heroColor, setHeroColor] = React.useState(DEFAULT_KAMIJI_COLOR);
  const [theme, setTheme] = React.useState<ColorThemeKey>(
    readPersistedColorTheme,
  );
  const tick = usePoseCycle(playing);
  if (import.meta.env.VITE_MOCK_API !== "true") {
    return <Navigate to="/" replace />;
  }
  const poseAt = (offset: number) =>
    KAMIJI_POSES[(tick + offset) % KAMIJI_POSES.length];

  const shapeAt = (offset: number) =>
    SHAPE_SEQUENCE[(tick + offset) % SHAPE_SEQUENCE.length];

  return (
    <div className="h-full overflow-y-auto bg-canvas-base text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 py-10">
        <header className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Kamiji avatars</h1>
            <p className="text-sm text-muted">
              Prototype: rigged 3D hand, tinted per agent, tweening between
              poses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Theme"
              data-testid="kamiji-theme-select"
              value={theme}
              onChange={(e) => {
                const key = e.currentTarget.value as ColorThemeKey;
                setTheme(key);
                applyColorTheme(key);
              }}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-sm"
            >
              {AVAILABLE_COLOR_THEMES.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className={cn(
                "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm",
                "hover:bg-surface-raised",
              )}
            >
              {playing ? "Pause" : "Play"}
            </button>
          </div>
        </header>

        <section
          className="flex w-full flex-col gap-6 md:flex-row md:items-start"
          data-testid="kamiji-hero"
        >
          <aside
            className="flex max-h-128 w-full shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-surface p-3 md:w-80"
            data-testid="kamiji-layers"
          >
            <LayerRow title="Pose" testId="kamiji-pose-buttons">
              <OptionButton
                active={heroPose === null}
                onClick={() => setHeroPose(null)}
              >
                Cycle
              </OptionButton>
              {HERO_POSES.map((pose) => (
                <OptionButton
                  key={pose}
                  active={heroPose === pose}
                  onClick={() => setHeroPose(pose)}
                >
                  {pose}
                </OptionButton>
              ))}
            </LayerRow>
            <LayerRow title="Shape" testId="kamiji-shape-buttons">
              <OptionButton
                active={heroShape === null}
                onClick={() => setHeroShape(null)}
              >
                Cycle shape
              </OptionButton>
              {KAMIJI_SHAPES.map((shape) => (
                <OptionButton
                  key={shape}
                  active={heroShape === shape}
                  onClick={() => setHeroShape(shape)}
                >
                  {shape}
                </OptionButton>
              ))}
            </LayerRow>
            <LayerRow title="Animation" testId="kamiji-animation-buttons">
              {HERO_ANIMATIONS.map((animation) => (
                <OptionButton
                  key={animation}
                  active={heroAnimation === animation}
                  onClick={() => setHeroAnimation(animation)}
                >
                  {animation}
                </OptionButton>
              ))}
            </LayerRow>
            <LayerRow title="Emote" testId="kamiji-emote-buttons">
              {[null, ...KAMIJI_EMOTE_TYPES].map((emote) => (
                <OptionButton
                  key={emote ?? "none"}
                  active={heroEmote === emote}
                  onClick={() => setHeroEmote(emote)}
                >
                  {emote ?? "no emote"}
                </OptionButton>
              ))}
            </LayerRow>
            <LayerRow title="Colour" testId="kamiji-color-controls">
              {KAMIJI_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={heroColor === preset.color}
                  onClick={() => setHeroColor(preset.color)}
                  className={cn(
                    "size-7 shrink-0 rounded-full border-2 bg-(--swatch)",
                    heroColor === preset.color
                      ? "border-foreground"
                      : "border-border",
                  )}
                  style={{ "--swatch": preset.color } as React.CSSProperties}
                />
              ))}
              <input
                type="color"
                aria-label="Custom colour"
                value={heroColor}
                onChange={(e) => setHeroColor(e.target.value)}
                className="size-7 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-0"
              />
            </LayerRow>
            <label className="flex items-center gap-2 px-1 text-sm text-muted">
              <input
                type="checkbox"
                checked={lockFace}
                onChange={(e) => setLockFace(e.target.checked)}
              />
              Lock eyes forward
            </label>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <KamijiWithEmote
              emote={heroEmote}
              emoteText="Hi!"
              size={HERO_SIZE}
              color={heroColor}
              expression="happy"
              animation={heroAnimation}
              lockFace={lockFace}
              shape={heroShape ?? shapeAt(0)}
              shapeDurationMs={SHAPE_TWEEN_MS}
              pose={
                heroPose ?? (heroAnimation === "Idle" ? poseAt(0) : undefined)
              }
              poseDurationMs={POSE_TWEEN_MS}
            />
            <span className="text-sm text-muted">{heroPose ?? poseAt(0)}</span>
          </div>
        </section>

        <KamijiSimConversation />

        <section className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {TILES.map((tile) => (
            <figure
              key={tile.name}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4"
            >
              <KamijiAvatar
                size={TILE_SIZE}
                color={getKamijiColor(tile.name)}
                expression={tile.expression}
                animation={tile.animation}
                pose={poseAt(tile.offset)}
                shape={shapeAt(tile.offset * 3)}
                shapeDurationMs={SHAPE_TWEEN_MS}
                poseDurationMs={POSE_TWEEN_MS}
              />
              <figcaption className="text-center text-xs">
                <div className="font-medium">{tile.name}</div>
                <div className="text-muted">
                  {tile.expression} · {poseAt(tile.offset)}
                </div>
              </figcaption>
            </figure>
          ))}
        </section>

        <section
          className="flex w-full flex-col gap-3"
          data-testid="kamiji-emotes"
        >
          <h2 className="text-base font-semibold">Emotes</h2>
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
            {EMOTE_TILES.map((tile) => (
              <figure
                key={tile.type}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4"
              >
                <KamijiWithEmote
                  size={EMOTE_TILE_SIZE}
                  color={getKamijiColor(tile.type)}
                  expression={tile.expression}
                  emote={tile.type}
                  emoteText={tile.text}
                  pose="open"
                />
                <figcaption className="text-center text-xs text-muted">
                  {tile.type}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          className="flex w-full flex-col gap-3"
          data-testid="kamiji-hands-up-section"
        >
          <h2 className="text-base font-semibold">Hands up</h2>
          <div className="flex flex-wrap items-end gap-6 rounded-2xl border border-border bg-surface p-6">
            <KamijiHandsUp size={160} />
            <KamijiHandsUp size={96} color={getKamijiColor("hands-up")} />
            <KamijiHandsUp size={48} expression="excited" />
          </div>
        </section>

        <section className="flex w-full flex-col gap-3">
          <h2 className="text-base font-semibold">GitHub status icons</h2>
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5">
            {KAMIJI_GIT_ICON_TYPES.map((type) => (
              <figure
                key={type}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4"
              >
                <span className="relative inline-block">
                  <KamijiAvatar
                    size={EMOTE_TILE_SIZE}
                    color={getKamijiColor(type)}
                    expression={GIT_TILES[type].expression}
                    pose={GIT_TILES[type].pose}
                  />
                  <span className="absolute right-1 top-2 flex rounded-full bg-canvas-base p-0.5">
                    <KamijiGitIcon type={type} size={18} />
                  </span>
                </span>
                <figcaption className="text-center text-xs text-muted">
                  {GIT_TILES[type].label}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <KamijiMochiShowcase />

        <KamijiExperiments />
      </div>
    </div>
  );
}
