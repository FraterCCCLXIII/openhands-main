import React from "react";
import { useReducedMotion } from "framer-motion";
import { useInView } from "#/hooks/use-in-view";
import { cn } from "#/utils/utils";
import { KamijiAvatar } from "./kamiji-avatar";
import { DEFAULT_KAMIJI_COLOR } from "./kamiji-expressions";
import { KamijiProp } from "./kamiji-prop";
import {
  getKamijiLook,
  withReducedMotion,
  type KamijiLookKey,
} from "./kamiji-look";

/** Below this edge length the prop badge would only be noise. */
const MIN_PROP_BADGE_AVATAR_SIZE = 28;
const PROP_BADGE_RATIO = 0.5;
const MIN_PROP_BADGE_SIZE = 14;

interface KamijiLookPropProps {
  look: KamijiLookKey;
  /** Edge length in CSS pixels. */
  size: number;
  className?: string;
}

/**
 * The look's 3D prop on the shared renderer. It mounts once scrolled near the
 * viewport; until then, and whenever WebGL is unavailable, its emoji shows.
 */
export function KamijiLookProp({ look, size, className }: KamijiLookPropProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const { prop, emoji, tint } = getKamijiLook(look);
  if (!prop) return null;
  return (
    <span
      ref={ref}
      data-testid="kamiji-look-prop"
      data-look={look}
      aria-hidden="true"
      className={cn("inline-flex shrink-0", className)}
    >
      {inView ? (
        <KamijiProp name={prop} color={tint} size={size} fallback={emoji} />
      ) : (
        <span
          className="flex items-center justify-center leading-none"
          ref={(el) => {
            el?.style.setProperty("width", `${size}px`);
            el?.style.setProperty("height", `${size}px`);
            el?.style.setProperty("font-size", `${Math.round(size * 0.8)}px`);
          }}
        >
          {emoji}
        </span>
      )}
    </span>
  );
}

/** A prop with no hand: tool calls, refs and other events a hand did not author. */
export function KamijiLookBadge({
  look,
  size = 16,
  className,
}: {
  look: KamijiLookKey;
  size?: number;
  className?: string;
}) {
  return <KamijiLookProp look={look} size={size} className={className} />;
}

interface KamijiLookAvatarProps {
  look: KamijiLookKey;
  size: number;
  /** Hand colour, usually the agent's; defaults to Kamiji yellow. */
  color?: string;
  /** Force the prop badge on or off; by default it shows from 28px up. */
  showProp?: boolean;
  className?: string;
}

/**
 * A Kamiji hand wearing the face, clip or pose of a look, with the look's
 * prop as a corner badge. Every feed, notification and toast avatar goes
 * through here so they share one renderer, reduced-motion handling and 2D
 * fallback.
 */
export function KamijiLookAvatar({
  look,
  size,
  color = DEFAULT_KAMIJI_COLOR,
  showProp,
  className,
}: KamijiLookAvatarProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const resolved = withReducedMotion(getKamijiLook(look), reduceMotion);
  const propSize = Math.max(
    MIN_PROP_BADGE_SIZE,
    Math.round(size * PROP_BADGE_RATIO),
  );
  const withProp =
    (showProp ?? size >= MIN_PROP_BADGE_AVATAR_SIZE) && !!resolved.prop;
  return (
    <span
      data-testid="kamiji-look-avatar"
      data-look={look}
      className={cn("relative inline-flex shrink-0", className)}
    >
      <KamijiAvatar
        size={size}
        color={color}
        expression={resolved.expression}
        animation={resolved.animation}
        pose={resolved.pose}
      />
      {withProp ? (
        <KamijiLookProp
          look={look}
          size={propSize}
          className="absolute -right-1 -bottom-1"
        />
      ) : null}
    </span>
  );
}
