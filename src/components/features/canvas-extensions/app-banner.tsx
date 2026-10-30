import React from "react";
import { useCanvasExtensionIcon } from "#/hooks/query/use-canvas-extension-icon";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { StyledIcon, resolveBackgroundColor } from "#/ui/styled-icon";
import {
  appBannerBackground,
  appBannerStops,
} from "#/utils/app-banner-gradient";
import { canvasExtensionIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";
import type { CanvasExtensionManifest } from "#/types/canvas-extension";

interface AppBannerProps {
  name: string;
  displayName: string;
  manifest?: CanvasExtensionManifest | null;
  /** Centred logo size in px; shrinks to `NARROW_LOGO_SIZE` on narrow banners. */
  logoSize?: number;
  className?: string;
  children?: React.ReactNode;
}

/** Lower-left app icon tile, matching the tile used before the banner redesign. */
const TILE_SIZE = 64;
/** Horizontal inset of the lower-left tile (`px-4`). */
const BANNER_PADDING = 16;
const TILE_GAP = 8;
const NARROW_LOGO_SIZE = 56;

/** Narrowest banner whose centred logo of `logoSize` clears the lower-left tile on both sides. */
function minWidthForLogo(logoSize: number): number {
  return 2 * (BANNER_PADDING + TILE_SIZE + TILE_GAP) + logoSize;
}

/** Colour gradient banner: the app's white logo centred as the hero, its icon tile lower-left. */
export function AppBanner({
  name,
  displayName,
  manifest,
  logoSize = 80,
  className,
  children,
}: AppBannerProps) {
  const { data: icon } = useCanvasExtensionIcon(name, Boolean(manifest?.icon));
  const custom = useFeedIconsStore(
    (s) => s.icons[canvasExtensionIconKey(name)],
  );
  const appearance = custom ?? manifest?.icon_appearance;
  const [maskUrl, setMaskUrl] = React.useState<string | null>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);
  const [bannerWidth, setBannerWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!icon) return undefined;
    const url = URL.createObjectURL(icon);
    setMaskUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setMaskUrl(null);
    };
  }, [icon]);

  React.useEffect(() => {
    const element = bannerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setBannerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const accent = appearance?.background
    ? resolveBackgroundColor(appearance.background)
    : null;
  const tileColor = accent ?? appBannerStops(name)[0];
  const logoBox =
    bannerWidth !== null && bannerWidth < minWidthForLogo(logoSize)
      ? NARROW_LOGO_SIZE
      : logoSize;
  const hasGlyph = Boolean(appearance?.emoji || appearance?.lucide_icon);

  /** A white glyph of `size` px: the app's emoji or Lucide icon, its logo mask, or an initial. */
  const renderGlyph = (size: number, isCentredLogo = false) => {
    if (hasGlyph) {
      return (
        <StyledIcon
          size={size}
          background="transparent"
          emoji={appearance?.emoji}
          lucideIcon={appearance?.lucide_icon}
          borderRadius={0}
        />
      );
    }
    if (maskUrl) {
      return (
        <span
          aria-hidden
          data-testid={isCentredLogo ? "app-banner-logo-mask" : undefined}
          className="block bg-white"
          style={{
            width: size,
            height: size,
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
    }
    return (
      <span
        aria-hidden
        className="font-bold text-white uppercase leading-none"
        style={{ fontSize: Math.round(size * 0.8) }}
      >
        {(displayName || name).charAt(0)}
      </span>
    );
  };

  return (
    <div
      ref={bannerRef}
      data-testid="app-banner"
      className={cn("relative flex items-end px-4 pb-4", className)}
      style={{ background: appBannerBackground(name, accent) }}
    >
      <span
        data-testid="app-banner-icon-tile"
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white shadow-md shadow-black/20 ring-1 ring-white/10"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: tileColor,
        }}
      >
        {renderGlyph(Math.round(TILE_SIZE * 0.6))}
      </span>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          data-testid="app-banner-logo"
          className="flex items-center justify-center"
          style={{
            width: logoBox,
            height: logoBox,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))",
          }}
        >
          {renderGlyph(logoBox, true)}
        </div>
      </div>
      {children}
    </div>
  );
}
