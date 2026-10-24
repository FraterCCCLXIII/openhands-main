import React from "react";
import { PanelsTopLeft } from "lucide-react";
import { useCanvasExtensionIcon } from "#/hooks/query/use-canvas-extension-icon";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";
import { StyledIcon } from "#/ui/styled-icon";

interface CanvasExtensionIconProps {
  extension: InstalledCanvasExtensionInfo;
  size: number;
  className?: string;
  /** Whether to show the styled background (default: true when appearance is set). */
  showBackground?: boolean;
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
  const appearance = extension.manifest?.icon_appearance;
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
      className={className}
      data-testid="canvas-extension-icon"
      onError={() => setSrc(null)}
    />
  );
}
