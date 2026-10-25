import { KAMIJI_SHOW_MOUTH, KamijiExpression } from "./kamiji-expressions";

import { KamijiShape } from "./kamiji-shape";

interface KamijiFallbackProps {
  color: string;
  size: number;
  expression: KamijiExpression;
  shape?: KamijiShape;
  className?: string;
}

const FRIENDLY_MOUTH = "M26 36 Q32 42 38 36";
const GLUM_MOUTH = "M26 40 Q32 35 38 40";
const FROWNING: KamijiExpression[] = ["sad", "angry", "sleepy"];

/** Flat hand shown while the 3D avatar loads, or when WebGL is unavailable. */
export function KamijiFallback({
  color,
  size,
  expression,
  shape = "hand",
  className,
}: KamijiFallbackProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <g fill={color}>
        {shape === "hand" && (
          <>
            <rect
              x="8"
              y="22"
              width="9"
              height="22"
              rx="4.5"
              transform="rotate(-24 12 40)"
            />
            <rect x="17" y="6" width="9" height="30" rx="4.5" />
            <rect x="28" y="3" width="9" height="32" rx="4.5" />
            <rect x="39" y="7" width="9" height="30" rx="4.5" />
            <rect
              x="47"
              y="24"
              width="9"
              height="22"
              rx="4.5"
              transform="rotate(26 52 40)"
            />
          </>
        )}
        {shape === "hand" && (
          <rect x="12" y="26" width="40" height="34" rx="15" />
        )}
        {shape === "sphere" && <circle cx="32" cy="32" r="27" />}
        {shape === "cube" && (
          <rect x="7" y="7" width="50" height="50" rx="14" />
        )}
      </g>
      <g fill="currentColor" className="text-black/80">
        <ellipse cx="24" cy="32" rx="2.4" ry="3.2" />
        <ellipse cx="40" cy="32" rx="2.4" ry="3.2" />
      </g>
      {KAMIJI_SHOW_MOUTH && (
        <path
          d={FROWNING.includes(expression) ? GLUM_MOUTH : FRIENDLY_MOUTH}
          fill="none"
          stroke="currentColor"
          className="text-black/80"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
