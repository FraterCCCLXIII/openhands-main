import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { ToggleSwitch } from "#/ui/toggle-switch";
import {
  useKamijiHandLook,
  useKamijiHandStore,
} from "#/stores/kamiji-hand-store";
import { cn } from "#/utils/utils";
import { KAMIJI_SHAPES, type KamijiShape } from "./kamiji-shape";
import {
  KAMIJI_HAND_ACCESSORIES,
  KAMIJI_HAND_ANIMATIONS,
  KAMIJI_HAND_COLOR_PRESETS,
  KAMIJI_HAND_EXPRESSIONS,
  KAMIJI_HAND_POSES,
  isKamijiHexColor,
} from "./kamiji-hand-look";
import {
  ACCESSORY_EMOJI,
  ACCESSORY_LABELS,
  ANIMATION_LABELS,
  COLOR_LABELS,
  EXPRESSION_LABELS,
  POSE_LABELS,
  SHAPE_LABELS,
} from "./kamiji-hand-labels";
import { KamijiHandPreview } from "./kamiji-hand-preview";
import type { KamijiExpression } from "./kamiji-expressions";
import type { KamijiPropName } from "./kamiji-catalog";

const MOTION_ANIMATION_PREFIX = "animation:";
const MOTION_POSE_PREFIX = "pose:";
const NO_ACCESSORY = "";

const CUSTOM_GRADIENT =
  "conic-gradient(#EF4444, #F59E0B, #22C55E, #14B8A6, #3B82F6, #8B5CF6, #EC4899, #EF4444)";

const fieldClassName =
  "h-8 w-full rounded-md bg-surface-raised px-2 text-sm text-contrast";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function SwitchRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm text-contrast">
      <span>{label}</span>
      <ToggleSwitch enabled={enabled} label={label} onToggle={onToggle} />
    </div>
  );
}

/** Compact editor for the user's Hand avatar; every change is saved at once. */
export function KamijiHandEditor() {
  const { t } = useTranslation("openhands");
  const look = useKamijiHandLook();
  const updateLook = useKamijiHandStore((state) => state.updateLook);
  const resetLook = useKamijiHandStore((state) => state.resetLook);
  const [follow, setFollow] = React.useState(() => !prefersReducedMotion());
  const expressionId = React.useId();
  const motionId = React.useId();
  const accessoryId = React.useId();

  const isPresetColor = KAMIJI_HAND_COLOR_PRESETS.some(
    (preset) => preset.color === look.color,
  );
  const motionValue = look.pose
    ? `${MOTION_POSE_PREFIX}${look.pose}`
    : `${MOTION_ANIMATION_PREFIX}${look.animation}`;

  const changeMotion = (value: string) => {
    if (value.startsWith(MOTION_POSE_PREFIX)) {
      updateLook({
        pose: KAMIJI_HAND_POSES.find(
          (pose) => `${MOTION_POSE_PREFIX}${pose}` === value,
        ),
        animation: "Idle",
      });
      return;
    }
    updateLook({
      pose: null,
      animation: KAMIJI_HAND_ANIMATIONS.find(
        (animation) => `${MOTION_ANIMATION_PREFIX}${animation}` === value,
      ),
    });
  };

  return (
    <div
      data-testid="kamiji-hand-editor"
      className="flex flex-col gap-4 sm:flex-row"
    >
      <div className="flex shrink-0 flex-col items-center gap-3 sm:w-52">
        <KamijiHandPreview look={look} follow={follow} />
        <SwitchRow
          label={t(I18nKey.KAMIJI$FOLLOW_POINTER)}
          enabled={follow}
          onToggle={() => setFollow((value) => !value)}
        />
        <button
          type="button"
          data-testid="kamiji-hand-reset"
          onClick={resetLook}
          className="h-8 w-full rounded-md border border-border-subtle px-3 text-sm text-contrast hover:bg-surface-raised"
        >
          {t(I18nKey.KAMIJI$RESET)}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <fieldset className="flex flex-col gap-2 text-sm text-contrast">
          <legend className="mb-2">{t(I18nKey.KAMIJI$COLOR)}</legend>
          <div role="radiogroup" className="flex flex-wrap gap-2">
            {KAMIJI_HAND_COLOR_PRESETS.map((preset) => {
              const name = t(COLOR_LABELS[preset.name]);
              const selected = look.color === preset.color;
              return (
                <button
                  key={preset.color}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={name}
                  title={name}
                  onClick={() => updateLook({ color: preset.color })}
                  className={cn(
                    "size-6 cursor-pointer rounded-full border-2 bg-(--swatch) ring-1 ring-inset ring-white/20",
                    selected ? "border-contrast" : "border-transparent",
                  )}
                  style={{ "--swatch": preset.color } as React.CSSProperties}
                />
              );
            })}
            <label
              title={t(I18nKey.COLOR$CUSTOM)}
              className={cn(
                "relative size-6 cursor-pointer overflow-hidden rounded-full border-2 ring-1 ring-inset ring-white/20",
                isPresetColor ? "border-transparent" : "border-contrast",
              )}
              style={{
                background: isPresetColor ? CUSTOM_GRADIENT : look.color,
              }}
            >
              <input
                type="color"
                aria-label={t(I18nKey.COLOR$CUSTOM)}
                value={look.color}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  if (isKamijiHexColor(value)) updateLook({ color: value });
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5 text-sm text-contrast">
          <label htmlFor={expressionId}>{t(I18nKey.KAMIJI$EXPRESSION)}</label>
          <select
            id={expressionId}
            data-testid="kamiji-hand-expression"
            value={look.expression}
            onChange={(event) =>
              updateLook({
                expression: event.currentTarget.value as KamijiExpression,
              })
            }
            className={fieldClassName}
          >
            {KAMIJI_HAND_EXPRESSIONS.map((expression) => (
              <option key={expression} value={expression}>
                {t(EXPRESSION_LABELS[expression])}
              </option>
            ))}
          </select>
        </div>

        <SwitchRow
          label={t(I18nKey.KAMIJI$MOUTH)}
          enabled={look.mouth}
          onToggle={() => updateLook({ mouth: !look.mouth })}
        />

        <fieldset className="flex flex-col gap-2 text-sm text-contrast">
          <legend className="mb-2">{t(I18nKey.KAMIJI$SHAPE)}</legend>
          <div role="radiogroup" className="flex gap-1.5">
            {KAMIJI_SHAPES.map((shape: KamijiShape) => (
              <button
                key={shape}
                type="button"
                role="radio"
                aria-checked={look.shape === shape}
                onClick={() => updateLook({ shape })}
                className={cn(
                  "h-8 flex-1 rounded-md px-2 text-sm",
                  look.shape === shape
                    ? "bg-contrast text-canvas-base"
                    : "bg-surface-raised text-contrast hover:bg-interactive-hover",
                )}
              >
                {t(SHAPE_LABELS[shape])}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5 text-sm text-contrast">
          <label htmlFor={motionId}>{t(I18nKey.KAMIJI$MOTION)}</label>
          <select
            id={motionId}
            data-testid="kamiji-hand-motion"
            value={motionValue}
            onChange={(event) => changeMotion(event.currentTarget.value)}
            className={fieldClassName}
          >
            <optgroup label={t(I18nKey.KAMIJI$MOTION_ANIMATIONS)}>
              {KAMIJI_HAND_ANIMATIONS.map((animation) => (
                <option
                  key={animation}
                  value={`${MOTION_ANIMATION_PREFIX}${animation}`}
                >
                  {t(ANIMATION_LABELS[animation] as I18nKey)}
                </option>
              ))}
            </optgroup>
            <optgroup label={t(I18nKey.KAMIJI$MOTION_POSES)}>
              {KAMIJI_HAND_POSES.map((pose) => (
                <option key={pose} value={`${MOTION_POSE_PREFIX}${pose}`}>
                  {t(POSE_LABELS[pose] as I18nKey)}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-contrast">
          <label htmlFor={accessoryId}>{t(I18nKey.KAMIJI$ACCESSORY)}</label>
          <select
            id={accessoryId}
            data-testid="kamiji-hand-accessory"
            value={look.accessory ?? NO_ACCESSORY}
            onChange={(event) =>
              updateLook({
                accessory:
                  (event.currentTarget.value as KamijiPropName) || null,
              })
            }
            className={fieldClassName}
          >
            <option value={NO_ACCESSORY}>{t(I18nKey.KAMIJI$NONE)}</option>
            {KAMIJI_HAND_ACCESSORIES.map((accessory) => (
              <option key={accessory} value={accessory}>
                {ACCESSORY_EMOJI[accessory]}{" "}
                {t(ACCESSORY_LABELS[accessory] as I18nKey)}
              </option>
            ))}
          </select>
        </div>

        <SwitchRow
          label={t(I18nKey.KAMIJI$OUTLINE)}
          enabled={look.outline}
          onToggle={() => updateLook({ outline: !look.outline })}
        />
      </div>
    </div>
  );
}
