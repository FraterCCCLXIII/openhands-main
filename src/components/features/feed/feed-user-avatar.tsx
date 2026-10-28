import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import ProfileIcon from "#/icons/profile.svg?react";
import { FEED_ME_ID } from "#/utils/feed-team-demo";
import { personIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";
import { FeedCustomIcon } from "./feed-custom-icon";

/** A person who can post in a conversation. Several can share one. */
export interface FeedMember {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
}

interface FeedUserAvatarProps {
  /** The poster. Omit while the backend does not say who it is. */
  member?: FeedMember | null;
  /** Avatar diameter in px. */
  size?: number;
  className?: string;
}

/** Round avatar for a person: their picture when known, else the profile icon. */
export function FeedUserAvatar({
  member,
  size = 32,
  className,
}: FeedUserAvatarProps) {
  const { t } = useTranslation("openhands");
  const avatar = (
    <span
      data-testid="feed-user-avatar"
      title={member?.name ?? undefined}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        // The user's own colour: a gradient behind the profile mark, until a
        // picture replaces it.
        member?.avatarUrl
          ? "bg-surface text-muted"
          : "bg-linear-to-br from-fuchsia-500 via-violet-500 to-sky-500 text-white",
        className,
      )}
      ref={(el) => {
        el?.style.setProperty("width", `${size}px`);
        el?.style.setProperty("height", `${size}px`);
      }}
    >
      {member?.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.name ?? t(I18nKey.AVATAR$ALT_TEXT)}
          className="size-full"
        />
      ) : (
        <ProfileIcon
          aria-label={t(I18nKey.USER$AVATAR_PLACEHOLDER)}
          width={size}
          height={size}
        />
      )}
    </span>
  );
  // A picture wins; otherwise the person's custom icon replaces the gradient.
  if (member?.avatarUrl) return avatar;
  return (
    <FeedCustomIcon
      iconKey={personIconKey(member?.id ?? FEED_ME_ID)}
      size={size}
      radius={size / 2}
      glyph={
        <ProfileIcon
          aria-label={t(I18nKey.USER$AVATAR_PLACEHOLDER)}
          width={size}
          height={size}
        />
      }
      fallback={avatar}
    />
  );
}
