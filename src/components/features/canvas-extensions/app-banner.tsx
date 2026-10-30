import React from "react";
import { useCanvasExtensionIcon } from "#/hooks/query/use-canvas-extension-icon";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { StyledIcon, resolveBackgroundColor } from "#/ui/styled-icon";
import { appBannerBackground } from "#/utils/app-banner-gradient";
import { canvasExtensionIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";
import type { CanvasExtensionManifest } from "#/types/canvas-extension";

interface AppBannerProps {
  name: string;
  displayName: string;
  manifest?: CanvasExtensionManifest | null;
  /** Logo box size in px. */
  logoSize?: number;
  className?: string;
  children?: React.ReactNode;
}

/** Colour gradient banner with the app's logo in white and a soft drop shadow. */
export function AppBanner({
  name,
  displayName,
  manifest,
  logoSize = 56,
  className,
  children,
}: AppBannerProps) {
  const { data: icon } = useCanvasExtensionIcon(name, Boolean(manifest?.icon));
  const custom = useFeedIconsStore(
    (s) => s.icons[canvasExtensionIconKey(name)],
  );
  const appearance = custom ?? manifest?.icon_appearance;
  const [maskUrl, setMaskUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!icon) return undefined;
    const url = URL.createObjectURL(icon);
    setMaskUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setMaskUrl(null);
    };
  }, [icon]);

  const accent = appearance?.background
    ? resolveBackgroundColor(appearance.background)
    : null;
  const glyphSize = Math.round(logoSize * 0.8);
  const hasGlyph = Boolean(appearance?.emoji || appearance?.lucide_icon);

  let logo: React.ReactNode;
  if (hasGlyph) {
    logo = (
      <StyledIcon
        size={glyphSize}
        background="transparent"
        emoji={appearance?.emoji}
        lucideIcon={appearance?.lucide_icon}
        borderRadius={0}
      />
    );
  } else if (maskUrl) {
    logo = (
      <span
        aria-hidden
        data-testid="app-banner-logo-mask"
        className="block bg-white"
        style={{
          width: glyphSize,
          height: glyphSize,
          maskImage: `url("${maskUrl}")`,
          WebkitMaskImage: `url("${maskUrl}")`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    );
  } else {
    logo = (
      <span
        aria-hidden
        className="font-bold text-white uppercase leading-none"
        style={{ fontSize: Math.round(glyphSize * 0.8) }}
      >
        {(displayName || name).charAt(0)}
      </span>
    );
  }

  return (
    <div
      data-testid="app-banner"
      className={cn("relative flex items-end px-4 pb-4", className)}
      style={{ background: appBannerBackground(name, accent) }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: logoSize,
          height: logoSize,
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))",
        }}
      >
        {logo}
      </div>
      {children}
    </div>
  );
}
