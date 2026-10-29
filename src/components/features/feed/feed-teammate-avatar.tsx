import type { FeedTeammate } from "#/utils/feed-team-demo";
import { personIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";
import { FeedCustomIcon } from "./feed-custom-icon";

interface FeedTeammateAvatarProps {
  teammate: FeedTeammate;
  /** Avatar diameter in px. */
  size: number;
  className?: string;
}

/** Round initials avatar for a simulated teammate, tinted per person. */
export function FeedTeammateAvatar({
  teammate,
  size,
  className,
}: FeedTeammateAvatarProps) {
  const avatar = (
    <span
      data-testid="feed-teammate-avatar"
      title={teammate.name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        teammate.className,
        className,
      )}
      ref={(el) => {
        el?.style.setProperty("width", `${size}px`);
        el?.style.setProperty("height", `${size}px`);
      }}
    >
      {teammate.initials}
    </span>
  );
  return (
    <FeedCustomIcon
      iconKey={personIconKey(teammate.id)}
      size={size}
      radius={size / 2}
      glyph={<span className="text-xs font-semibold">{teammate.initials}</span>}
      fallback={avatar}
    />
  );
}
