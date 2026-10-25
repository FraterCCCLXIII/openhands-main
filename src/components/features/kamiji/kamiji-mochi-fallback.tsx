import { KamijiMochiFaceState } from "./kamiji-mochi-expressions";

interface KamijiMochiFallbackProps {
  color: string;
  size: number;
  face: KamijiMochiFaceState;
  className?: string;
}

const MOUTH_UP = "M26 41 Q32 46 38 41";
const MOUTH_DOWN = "M26 44 Q32 39 38 44";

/** Flat mochi blob shown while the 3D model loads, or when WebGL is unavailable. */
export function KamijiMochiFallback({
  color,
  size,
  face,
  className,
}: KamijiMochiFallbackProps) {
  const closed = face === "blink";
  const arcs = face === "happy" || face === "joy";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <g fill={color}>
        <ellipse cx="32" cy="38" rx="22" ry="20" />
        <ellipse cx="20" cy="17" rx="6" ry="10" />
        <ellipse cx="44" cy="17" rx="6" ry="10" />
      </g>
      <g
        fill="currentColor"
        stroke="currentColor"
        className="text-black/80"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        {arcs || closed ? (
          <>
            <path
              d={
                closed
                  ? "M20 36 H28 M36 36 H44"
                  : "M20 37 Q24 31 28 37 M36 37 Q40 31 44 37"
              }
              fill="none"
            />
          </>
        ) : (
          <>
            <ellipse
              cx="24"
              cy="36"
              rx={face === "surprised" ? 3.4 : 2.4}
              ry={face === "surprised" ? 4.2 : 3.2}
            />
            <ellipse
              cx="40"
              cy="36"
              rx={face === "surprised" ? 3.4 : 2.4}
              ry={face === "surprised" ? 4.2 : 3.2}
            />
          </>
        )}
        <path d={face === "sad" ? MOUTH_DOWN : MOUTH_UP} fill="none" />
      </g>
    </svg>
  );
}
