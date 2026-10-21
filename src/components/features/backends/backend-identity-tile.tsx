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
  className?: string;
}

/**
 * A rounded square with a subtle raised edge: a top highlight, a soft
 * gradient and a drop shadow. The content is an emoji, a library icon, an
 * uploaded image, or the fallback.
 */
export function BackendIdentityTile({
  identity,
  fallback,
  size = "md",
  className,
}: BackendIdentityTileProps) {
  return (
    <span
      data-testid="backend-identity-tile"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-gradient-to-b from-white/15 to-white/5 ring-1 ring-inset ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_4px_rgba(0,0,0,0.35)]",
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
  return (
    <BackendIdentityTile identity={identity} fallback={fallback} size={size} />
  );
}
