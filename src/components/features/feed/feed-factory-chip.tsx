import { FeedCustomIcon } from "./feed-custom-icon";
import { FeedIconTile } from "./feed-icon-tile";
import { factoryIconKey } from "#/utils/feed-icon-keys";
import type { FeedFactory } from "#/utils/feed-team-demo";

interface FeedFactoryChipProps {
  factory: Pick<FeedFactory, "id" | "name" | "Icon" | "className">;
  testId?: string;
}

/** A factory's icon and name as a small pill. */
export function FeedFactoryChip({ factory, testId }: FeedFactoryChipProps) {
  const { id, name, Icon, className } = factory;
  return (
    <span
      data-testid={testId}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface py-0.5 pl-0.5 pr-2 text-xs text-contrast"
    >
      <FeedCustomIcon
        iconKey={factoryIconKey(id)}
        size={18}
        radius={9}
        glyph={<Icon size={11} />}
        fallback={
          <FeedIconTile className={className}>
            <Icon size={11} />
          </FeedIconTile>
        }
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
