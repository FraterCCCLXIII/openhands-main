import React from "react";
import { cn } from "#/utils/utils";
import { KamijiAvatar } from "./kamiji-avatar";
import { DEFAULT_KAMIJI_COLOR, KamijiExpression } from "./kamiji-expressions";

const DEFAULT_SIZE = 96;
const HAND_SCALE = 0.64;
const LINES_SCALE = 0.36;
// Hands lean so the wrists nearly touch and the fingertips fan apart.
const TILT_DEGREES = 10;
const HAND_OVERLAP = 0.4;

// Three strokes radiating up from the gap between the hands (64x40 box).
const CLAP_LINES = ["M15 20 L22 36", "M32 6 V30", "M49 20 L42 36"] as const;

export interface KamijiHandsUpProps {
  color?: string;
  expression?: KamijiExpression;
  /** Edge length of the square emoji in CSS pixels. */
  size?: number;
  className?: string;
}

/** Two raised open Kamiji hands with three black clap lines between them. */
export function KamijiHandsUp({
  color = DEFAULT_KAMIJI_COLOR,
  expression = "happy",
  size = DEFAULT_SIZE,
  className,
}: KamijiHandsUpProps) {
  const handSize = Math.round(size * HAND_SCALE);
  const linesWidth = Math.round(size * LINES_SCALE);
  const linesHeight = Math.round(linesWidth * 0.625);
  const hand = (side: "left" | "right") => (
    <span
      className="inline-block origin-bottom"
      style={{
        marginLeft:
          side === "right" ? -Math.round(handSize * HAND_OVERLAP) : undefined,
        // Right hand mirrors first, then tilts clockwise so the tips lean out.
        transform:
          side === "left"
            ? `rotate(${-TILT_DEGREES}deg)`
            : `rotate(${TILT_DEGREES}deg) scaleX(-1)`,
      }}
    >
      <KamijiAvatar
        color={color}
        expression={expression}
        pose="open"
        size={handSize}
      />
    </span>
  );
  return (
    <span
      data-testid="kamiji-hands-up"
      className={cn("relative inline-flex items-end justify-center", className)}
      style={{ width: size, height: size }}
    >
      {hand("left")}
      {hand("right")}
      <svg
        width={linesWidth}
        height={linesHeight}
        viewBox="0 0 64 40"
        aria-hidden="true"
        data-testid="kamiji-clap-lines"
        className="kamiji-emote pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ bottom: Math.round(handSize * 0.74) }}
      >
        {/* eslint-disable-next-line shadcn/no-raw-colors -- the clap lines are always black */}
        <g fill="none" stroke="black" strokeWidth="7" strokeLinecap="round">
          {CLAP_LINES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
    </span>
  );
}
