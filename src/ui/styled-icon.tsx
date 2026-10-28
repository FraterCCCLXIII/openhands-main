import React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "#/utils/utils";

/** Predefined background color presets for extension icons. */
export const ICON_BACKGROUND_PRESETS = {
  blue: "#3B82F6",
  violet: "#8B5CF6",
  pink: "#EC4899",
  red: "#EF4444",
  orange: "#F97316",
  amber: "#F59E0B",
  yellow: "#EAB308",
  lime: "#84CC16",
  green: "#22C55E",
  emerald: "#10B981",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  sky: "#0EA5E9",
  indigo: "#6366F1",
  purple: "#A855F7",
  fuchsia: "#D946EF",
  rose: "#F43F5E",
  slate: "#64748B",
  gray: "#6B7280",
  zinc: "#71717A",
  neutral: "#737373",
  stone: "#78716C",
} as const;

export type IconBackgroundPresetKey = keyof typeof ICON_BACKGROUND_PRESETS;

/** Resolve a color value, supporting both preset keys and direct CSS colors. */
export function resolveBackgroundColor(
  color: string | null | undefined,
): string {
  if (!color) return ICON_BACKGROUND_PRESETS.slate;
  const presetKey = color as IconBackgroundPresetKey;
  if (presetKey in ICON_BACKGROUND_PRESETS) {
    return ICON_BACKGROUND_PRESETS[presetKey];
  }
  return color;
}

/** Determine if the background is dark enough to need white foreground text. */
function needsLightForeground(bgColor: string): boolean {
  // Simple heuristic: check if it's a hex color and calculate luminance
  if (bgColor.startsWith("#")) {
    const hex = bgColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.6;
  }
  return true; // Default to light foreground for non-hex colors
}

type LucideIconName = keyof typeof LucideIcons;

function isValidLucideIcon(name: string): name is LucideIconName {
  return name in LucideIcons;
}

function capitalizeIconName(name: string): string {
  // Convert kebab-case or snake_case to PascalCase
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

interface StyledIconProps {
  /** Size of the icon container in pixels. */
  size: number;
  /** Background color (preset key or CSS color value). */
  background?: string | null;
  /** Emoji to display (takes precedence over lucideIcon and children). */
  emoji?: string | null;
  /** Lucide icon name (e.g., "folder", "database"). */
  lucideIcon?: string | null;
  /** Fallback content if no emoji or lucide icon is provided. */
  children?: React.ReactNode;
  /** Additional CSS classes for the container. */
  className?: string;
  /** Border radius in pixels (default: 6). */
  borderRadius?: number;
}

/**
 * Renders an icon with a rounded background color.
 * Supports emojis, Lucide icons by name, or custom children.
 */
export function StyledIcon({
  size,
  background,
  emoji,
  lucideIcon,
  children,
  className,
  borderRadius = 6,
}: StyledIconProps) {
  const bgColor = resolveBackgroundColor(background);
  const useLightFg = needsLightForeground(bgColor);
  const iconSize = Math.round(size * 0.6);

  const renderContent = () => {
    // Priority: emoji > lucideIcon > children
    if (emoji) {
      return (
        <span
          role="img"
          aria-hidden
          style={{ fontSize: iconSize }}
          className="leading-none"
        >
          {emoji}
        </span>
      );
    }

    if (lucideIcon) {
      const pascalName = capitalizeIconName(lucideIcon);
      if (isValidLucideIcon(pascalName)) {
        const IconComponent = LucideIcons[pascalName] as React.FC<{
          width: number;
          height: number;
          className?: string;
        }>;
        return (
          <IconComponent
            width={iconSize}
            height={iconSize}
            className={useLightFg ? "text-white" : "text-gray-900"}
          />
        );
      }
    }

    return children;
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        useLightFg ? "text-white" : "text-gray-900",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        borderRadius,
      }}
      aria-hidden
      data-testid="styled-icon"
    >
      {renderContent()}
    </span>
  );
}
