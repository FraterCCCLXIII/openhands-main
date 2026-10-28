import type { FeedTeammate } from "#/utils/feed-team-demo";
import { cn } from "#/utils/utils";

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
  return (
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
}
