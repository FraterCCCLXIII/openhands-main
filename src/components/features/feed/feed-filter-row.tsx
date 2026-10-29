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
  /** A second line under the label, such as diff numbers. */
  meta?: ReactNode;
  /** Control shown on hover to the left of the count, such as a menu button. */
  action?: ReactNode;
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
  meta,
  action,
  profile,
}: FeedFilterRowProps) {
  return (
    <li
      className={cn(
        "group flex items-center gap-1 rounded-lg",
        selected
          ? "bg-surface-raised text-contrast"
          : "text-muted hover:bg-surface-raised hover:text-contrast",
      )}
    >
      <button
        type="button"
        data-testid={testId}
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left text-[15px]",
          selected && "font-medium",
        )}
      >
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center">
            {icon}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">{label}</span>
          {meta}
        </span>
      </button>
      {action ? (
        <span className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100">
          {action}
        </span>
      ) : null}
      {count !== undefined ? (
        // The row's button is the accessible control; the chip just extends it.
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          data-testid="feed-filter-count"
          onClick={onSelect}
          className={cn(
            "min-w-6 rounded-full bg-surface px-2 py-0.5 text-center text-xs text-muted",
            profile ? "" : "mr-2",
          )}
        >
          {count}
        </button>
      ) : null}
      {profile ? (
        <NavigationLink
          to={profile.to}
          data-testid="feed-filter-profile-link"
          aria-label={profile.label}
          title={profile.label}
          className="rounded-full p-2 text-muted hover:bg-surface hover:text-contrast"
        >
          <UserRound size={16} />
        </NavigationLink>
      ) : null}
    </li>
  );
}
