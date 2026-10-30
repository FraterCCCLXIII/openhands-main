import React from "react";
import { SidebarNavLink } from "./sidebar-nav-link";
import { CanvasExtensionNavMenu } from "./canvas-extension-nav-menu";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { StyledIcon } from "#/ui/styled-icon";
import { canvasExtensionIconKey } from "#/utils/feed-icon-keys";

interface BuiltInAppNavLinkProps {
  /** Stable name that keys the saved icon, like an extension's name. */
  appName: string;
  to: string;
  label: string;
  testId: string;
  collapsed: boolean;
  /** Tile color when the person has not picked one. */
  defaultBackground: string;
  size: number;
  /** The glyph drawn on the tile. */
  glyph: React.ReactNode;
}

/**
 * Feed and Team chat sit with the other apps: the same rounded tile behind the
 * icon, and a right-click menu to change its color.
 */
export function BuiltInAppNavLink({
  appName,
  to,
  label,
  testId,
  collapsed,
  defaultBackground,
  size,
  glyph,
}: BuiltInAppNavLinkProps) {
  const custom = useFeedIconsStore(
    (state) => state.icons[canvasExtensionIconKey(appName)],
  );
  return (
    <CanvasExtensionNavMenu extensionName={appName} label={label}>
      <SidebarNavLink
        to={to}
        label={label}
        testId={testId}
        collapsed={collapsed}
        icon={
          <StyledIcon
            size={size}
            background={custom?.background ?? defaultBackground}
            emoji={custom?.emoji}
            lucideIcon={custom?.lucide_icon}
          >
            {glyph}
          </StyledIcon>
        }
      />
    </CanvasExtensionNavMenu>
  );
}
