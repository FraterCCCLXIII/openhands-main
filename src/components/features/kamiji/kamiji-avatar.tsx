import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import {
  KamijiAnimation,
  KamijiExpression,
  KamijiPose,
  DEFAULT_KAMIJI_COLOR,
} from "./kamiji-expressions";
import { KamijiShape } from "./kamiji-shape";
import { KamijiFallback } from "./kamiji-fallback";

const KamijiScene = React.lazy(() => import("./kamiji-scene"));

const DEFAULT_SIZE = 48;

export interface KamijiAvatarProps {
  /** Any CSS colour; see `getKamijiColor` for a per-agent default. */
  color?: string;
  expression?: KamijiExpression;
  animation?: KamijiAnimation;
  /** Tweens the fingers to a hand shape; replaces the clip `animation` while set. */
  pose?: KamijiPose;
  poseDurationMs?: number;
  /** Moves the mouth like talking (e.g. while the agent is responding). */
  speaking?: boolean;
  /** Keeps the eyes facing the camera while the hand turns or spins. */
  lockFace?: boolean;
  /** Morphs the hand into a sphere or rounded cube (fingers stop moving). */
  shape?: KamijiShape;
  shapeDurationMs?: number;
  /** Edge length in CSS pixels. */
  size?: number;
  className?: string;
}

export function KamijiAvatar({
  color = DEFAULT_KAMIJI_COLOR,
  expression = "neutral",
  animation = "Idle",
  pose,
  poseDurationMs,
  speaking = false,
  lockFace = false,
  shape = "hand",
  shapeDurationMs,
  size = DEFAULT_SIZE,
  className,
}: KamijiAvatarProps) {
  const { t } = useTranslation("openhands");
  const [, setReady] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);

  return (
    <span
      role="img"
      aria-label={t(I18nKey.KAMIJI$ALT_TEXT)}
      data-testid="kamiji-avatar"
      className={cn("relative inline-block shrink-0", className)}
    >
      <KamijiFallback
        color={color}
        size={size}
        expression={expression}
        shape={shape}
        className={cn("block", !unavailable && "invisible")}
      />
      {!unavailable && (
        <React.Suspense fallback={null}>
          <KamijiScene
            color={color}
            expression={expression}
            animation={animation}
            speaking={speaking}
            lockFace={lockFace}
            shape={shape}
            shapeDurationMs={shapeDurationMs}
            pose={pose}
            poseDurationMs={poseDurationMs}
            onReady={() => setReady(true)}
            onUnavailable={() => setUnavailable(true)}
          />
        </React.Suspense>
      )}
    </span>
  );
}
