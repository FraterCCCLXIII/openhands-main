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
  /** Extra control beside the row, such as an edit button. */
  action?: ReactNode;
  /** Content under the row, such as an inline editor. */
  footer?: ReactNode;
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
  footer,
  profile,
}: FeedFilterRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-1">
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
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">{label}</span>
          {meta}
        </span>
        {count !== undefined ? (
          <span
            data-testid="feed-filter-count"
            className="min-w-6 rounded-full bg-surface px-2 py-0.5 text-center text-xs text-muted"
          >
            {count}
          </span>
        ) : null}
      </button>
      {action}
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
      {footer ? <div className="w-full">{footer}</div> : null}
    </li>
  );
}
