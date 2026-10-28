import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { NavigationLink } from "#/components/shared/navigation-link";
import { cn } from "#/utils/utils";

interface FeedFilterRowProps {
  label: string;
  count?: number;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  testId: string;
  /** Adds a link to this row's profile page beside the filter. */
  profile?: { to: string; label: string };
}

/** One row in the feed's side lists, sized like a Facebook shortcut row. */
export function FeedFilterRow({
  label,
  count,
  icon,
  selected,
  onSelect,
  testId,
  profile,
}: FeedFilterRowProps) {
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        data-testid={testId}
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left text-[15px]",
          selected
            ? "bg-surface-raised font-medium text-contrast"
            : "text-muted hover:bg-surface-raised hover:text-contrast",
        )}
      >
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined ? (
          <span className="text-xs text-muted">{count}</span>
        ) : null}
      </button>
      {profile ? (
        <NavigationLink
          to={profile.to}
          data-testid="feed-filter-profile-link"
          aria-label={profile.label}
          title={profile.label}
          className="rounded-full p-2 text-muted hover:bg-surface-raised hover:text-contrast"
        >
          <UserRound size={16} />
        </NavigationLink>
      ) : null}
    </li>
  );
}
