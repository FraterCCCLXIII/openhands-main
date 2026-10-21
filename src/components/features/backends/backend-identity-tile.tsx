import React from "react";
import { cn } from "#/utils/utils";
import {
  useBackendIdentityStore,
  type BackendIdentity,
} from "#/stores/backend-identity-store";
import { BACKEND_ICON_LIBRARY } from "./backend-identity-icons";

export type BackendIdentityTileSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BackendIdentityTileSize, string> = {
  sm: "size-6 rounded-md text-sm",
  md: "size-8 rounded-lg text-base",
  lg: "size-12 rounded-xl text-2xl",
};

const ICON_SIZE: Record<BackendIdentityTileSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

export interface BackendIdentityTileProps {
  /** The account's chosen icon; when absent the fallback is drawn. */
  identity?: BackendIdentity | null;
  /** Shown when no identity is set, such as the OpenHands mark. */
  fallback: React.ReactNode;
  size?: BackendIdentityTileSize;
  /** Overrides the tile fill with the account's chosen background color. */
  background?: string | null;
  className?: string;
}

/**
 * A rounded square with a flat fill, a hairline border and a faint top
 * highlight. The content is an emoji, a library icon, an uploaded image, or
 * the fallback.
 */
export function BackendIdentityTile({
  identity,
  fallback,
  size = "md",
  background,
  className,
}: BackendIdentityTileProps) {
  return (
    <span
      data-testid="backend-identity-tile"
      style={background ? { backgroundColor: background } : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b from-white/10 to-white/5 shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <TileContent identity={identity} fallback={fallback} size={size} />
    </span>
  );
}

function TileContent({
  identity,
  fallback,
  size,
}: Pick<BackendIdentityTileProps, "identity" | "fallback"> & {
  size: BackendIdentityTileSize;
}) {
  if (!identity) return <>{fallback}</>;

  if (identity.type === "image") {
    return (
      <img
        src={identity.dataUrl}
        alt=""
        className="size-full object-cover"
        draggable={false}
      />
    );
  }

  if (identity.type === "emoji") {
    return (
      <span aria-hidden className="leading-none">
        {identity.value}
      </span>
    );
  }

  const Icon = BACKEND_ICON_LIBRARY[identity.name];
  if (!Icon) return <>{fallback}</>;
  return <Icon aria-hidden size={ICON_SIZE[size]} className="text-contrast" />;
}

export interface AccountIdentityTileProps {
  /** `getBackendIdentityKey` for the account this tile belongs to. */
  identityKey: string;
  /** Icon drawn when the account has not picked one. */
  fallback: React.ReactNode;
  size?: BackendIdentityTileSize;
}

/** Reads the account's saved identity, so the tile repaints on every change. */
export function AccountIdentityTile({
  identityKey,
  fallback,
  size,
}: AccountIdentityTileProps) {
  const identity = useBackendIdentityStore(
    (state) => state.identityByKey[identityKey],
  );
  const background = useBackendIdentityStore(
    (state) => state.backgroundByKey[identityKey],
  );
  return (
    <BackendIdentityTile
      identity={identity}
      fallback={fallback}
      size={size}
      background={background}
    />
  );
}
