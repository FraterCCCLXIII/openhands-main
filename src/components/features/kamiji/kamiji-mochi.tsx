import React from "react";
import { cn } from "#/utils/utils";
import { KamijiExpression } from "./kamiji-expressions";
import { KAMIJI_MOCHI, KamijiMochiId } from "./kamiji-catalog";
import {
  KamijiMochiClip,
  KamijiMochiFaceState,
  getMochiFaceState,
} from "./kamiji-mochi-expressions";
import type { KamijiMochiFrame } from "./kamiji-mochi-stage";
import { KamijiMochiFallback } from "./kamiji-mochi-fallback";

const KamijiMochiScene = React.lazy(() => import("./kamiji-mochi-scene"));

const DEFAULT_SIZE = 64;
const FALLBACK_COLOR = "#f1e6d8";

export interface KamijiMochiProps {
  /** Which Kamikin, e.g. "kamikin-hana"; see `KAMIJI_MOCHI_IDS`. */
  character: KamijiMochiId;
  /** One of Kamiji's 8 expressions, mapped onto the mochi's 6 face states. */
  expression?: KamijiExpression;
  /** Overrides `expression` with a raw face state. */
  face?: KamijiMochiFaceState;
  /** Clip name baked into the GLB. */
  animation?: KamijiMochiClip;
  /** Optional CSS colour multiplied into the body colours (darkens/shifts, never brightens). */
  color?: string;
  /** "head" crops in on the face for avatar-sized use; default shows the whole body. */
  frame?: KamijiMochiFrame;
  /** Edge length in CSS pixels. */
  size?: number;
  className?: string;
  /** Accessible label; defaults to the character's name. */
  alt?: string;
}

export function KamijiMochi({
  character,
  expression = "neutral",
  face,
  animation = "idle",
  color,
  frame = "full",
  size = DEFAULT_SIZE,
  className,
  alt,
}: KamijiMochiProps) {
  const [, setReady] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);
  const faceState = face ?? getMochiFaceState(expression);
  const name = KAMIJI_MOCHI.find((mochi) => mochi.id === character)?.name;

  return (
    <span
      role="img"
      aria-label={alt ?? name ?? character}
      data-testid="kamiji-mochi"
      className={cn("relative inline-block shrink-0", className)}
    >
      <KamijiMochiFallback
        color={color ?? FALLBACK_COLOR}
        size={size}
        face={faceState}
        className={cn("block", !unavailable && "invisible")}
      />
      {!unavailable && (
        <React.Suspense fallback={null}>
          <KamijiMochiScene
            id={character}
            face={faceState}
            clip={animation}
            tint={color}
            frame={frame}
            size={size}
            onReady={() => setReady(true)}
            onUnavailable={() => setUnavailable(true)}
          />
        </React.Suspense>
      )}
    </span>
  );
}
