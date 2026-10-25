import React from "react";
import { cn } from "#/utils/utils";
import { KAMIJI_PROP_TINTS, KamijiPropName } from "./kamiji-catalog";

const KamijiPropScene = React.lazy(() => import("./kamiji-prop-scene"));

const DEFAULT_SIZE = 32;

export interface KamijiPropProps {
  name: KamijiPropName;
  /** Any CSS colour; defaults to the prop's suggested tint. */
  color?: string;
  /** Edge length in CSS pixels. */
  size?: number;
  /** Turns the prop about its vertical axis; otherwise it holds a static 3/4 pose. */
  spin?: boolean;
  className?: string;
  alt?: string;
}

export function KamijiProp({
  name,
  color,
  size = DEFAULT_SIZE,
  spin = false,
  className,
  alt,
}: KamijiPropProps) {
  const [, setReady] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);
  const fill = color ?? KAMIJI_PROP_TINTS[name] ?? "currentColor";

  return (
    <span
      role="img"
      aria-label={alt ?? name.replace(/_/g, " ")}
      data-testid="kamiji-prop"
      className={cn("relative inline-block shrink-0", className)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={cn("block", !unavailable && "invisible")}
        aria-hidden="true"
      >
        <rect x="14" y="14" width="36" height="36" rx="12" fill={fill} />
      </svg>
      {!unavailable && (
        <React.Suspense fallback={null}>
          <KamijiPropScene
            name={name}
            color={color}
            spin={spin}
            size={size}
            onReady={() => setReady(true)}
            onUnavailable={() => setUnavailable(true)}
          />
        </React.Suspense>
      )}
    </span>
  );
}
