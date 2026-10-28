import type { ReactNode } from "react";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { StyledIcon } from "#/ui/styled-icon";

interface FeedCustomIconProps {
  /** Key into the feed icons store. */
  iconKey: string;
  /** Tile size in px. */
  size: number;
  /** Corner radius in px; half of `size` makes it round. */
  radius: number;
  /** The default look, shown until someone customizes the icon. */
  fallback: ReactNode;
  /** The default glyph, drawn on a custom color when no emoji or icon is set. */
  glyph?: ReactNode;
}

/** The custom icon saved for a key, or the default look without one. */
export function FeedCustomIcon({
  iconKey,
  size,
  radius,
  fallback,
  glyph,
}: FeedCustomIconProps) {
  const custom = useFeedIconsStore((state) => state.icons[iconKey]);
  if (!custom) return <>{fallback}</>;
  return (
    <StyledIcon
      size={size}
      borderRadius={radius}
      background={custom.background}
      emoji={custom.emoji}
      lucideIcon={custom.lucide_icon}
    >
      {glyph}
    </StyledIcon>
  );
}
