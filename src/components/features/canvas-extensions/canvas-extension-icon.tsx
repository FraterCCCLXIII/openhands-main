import React from "react";
import { PanelsTopLeft } from "lucide-react";
import { useCanvasExtensionIcon } from "#/hooks/query/use-canvas-extension-icon";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";
import {
  StyledIcon,
  resolveBackgroundColor,
  needsLightForeground,
} from "#/ui/styled-icon";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { canvasExtensionIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";

interface CanvasExtensionIconProps {
  extension: InstalledCanvasExtensionInfo;
  size: number;
  className?: string;
  /** Whether to show the styled background (default: true when appearance is set). */
  showBackground?: boolean;
}

/** Colors a default tile can take: saturated enough to read behind a white icon. */
const DEFAULT_TILE_COLORS = [
  "blue",
  "violet",
  "pink",
  "orange",
  "emerald",
  "teal",
  "indigo",
  "rose",
  "sky",
  "purple",
] as const;

/** An app that states no color gets a steady one drawn from its name. */
function defaultIconBackground(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return DEFAULT_TILE_COLORS[hash % DEFAULT_TILE_COLORS.length];
}

// Rendered via <img> (never inlined) so the SVG cannot run scripts.
export function CanvasExtensionIcon({
  extension,
  size,
  className,
  showBackground,
}: CanvasExtensionIconProps) {
  const { data: icon } = useCanvasExtensionIcon(
    extension.name,
    Boolean(extension.manifest?.icon),
  );
  const [src, setSrc] = React.useState<string | null>(null);
  // The person's own choice (right-click in the nav) wins over the app's preference.
  const custom = useFeedIconsStore(
    (state) => state.icons[canvasExtensionIconKey(extension.name)],
  );
  const appearance = custom ??
    extension.manifest?.icon_appearance ?? {
      background: defaultIconBackground(extension.name),
    };
  const hasAppearance = Boolean(
    appearance?.background || appearance?.emoji || appearance?.lucide_icon,
  );
  const shouldShowBackground = showBackground ?? hasAppearance;

  React.useEffect(() => {
    if (!icon) return undefined;
    const url = URL.createObjectURL(icon);
    setSrc(url);
    return () => {
      URL.revokeObjectURL(url);
      setSrc(null);
    };
  }, [icon]);

  // If we have appearance settings, use StyledIcon
  if (shouldShowBackground && hasAppearance) {
    return (
      <StyledIcon
        size={size}
        background={appearance?.background}
        emoji={appearance?.emoji}
        lucideIcon={appearance?.lucide_icon}
        className={className}
        data-testid="canvas-extension-styled-icon"
      >
        {/* Fallback to loaded SVG icon or default */}
        {src ? (
          <img
            src={src}
            width={Math.round(size * 0.6)}
            height={Math.round(size * 0.6)}
            alt=""
            aria-hidden
            className={
              needsLightForeground(
                resolveBackgroundColor(appearance?.background),
              )
                ? "brightness-0 invert"
                : "brightness-0"
            }
            onError={() => setSrc(null)}
          />
        ) : (
          <PanelsTopLeft
            width={Math.round(size * 0.6)}
            height={Math.round(size * 0.6)}
            aria-hidden
          />
        )}
      </StyledIcon>
    );
  }

  // No styled background - use plain icon
  if (!src) {
    return (
      <PanelsTopLeft
        width={size}
        height={size}
        className={className}
        aria-hidden
        data-testid="canvas-extension-default-icon"
      />
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden
      className={cn("dark:invert dark:opacity-70", className)}
      data-testid="canvas-extension-icon"
      onError={() => setSrc(null)}
    />
  );
}
