import { cn } from "#/utils/utils";
import { useKamijiHandLook } from "#/stores/kamiji-hand-store";
import type { KamijiHandLook } from "./kamiji-hand-look";
import { KamijiAvatar, type KamijiAvatarProps } from "./kamiji-avatar";
import { KamijiProp } from "./kamiji-prop";

/** The accessory is drawn this share of the avatar's edge, in the top-right corner. */
const ACCESSORY_SCALE = 0.42;

export interface KamijiHandAvatarProps extends Pick<
  KamijiAvatarProps,
  "size" | "speaking" | "viewYaw" | "viewPitch" | "className"
> {
  /** Overrides the saved look, e.g. for the editor's own preview. */
  look?: KamijiHandLook;
}

/**
 * The user's own Hand avatar. It reads the saved customisation, so every place
 * that shows "you" stays in sync with the Hand editor. Agents keep their own
 * per-agent `KamijiAvatar`.
 */
export function KamijiHandAvatar({
  look: lookOverride,
  size = 48,
  className,
  ...avatarProps
}: KamijiHandAvatarProps) {
  const saved = useKamijiHandLook();
  const look = lookOverride ?? saved;
  return (
    <span
      data-testid="kamiji-hand-avatar"
      className={cn("relative inline-block shrink-0", className)}
    >
      <KamijiAvatar
        {...avatarProps}
        size={size}
        color={look.color}
        expression={look.expression}
        animation={look.animation}
        pose={look.pose ?? undefined}
        shape={look.shape}
        mouth={look.mouth}
        outline={look.outline}
      />
      {look.accessory && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0"
        >
          <KamijiProp
            name={look.accessory}
            size={Math.max(16, Math.round(size * ACCESSORY_SCALE))}
            spin={false}
          />
        </span>
      )}
    </span>
  );
}
