import type { ReactNode } from "react";
import { FolderGit2 } from "lucide-react";
import { pickFeedTint } from "#/utils/feed-demo-agents";
import { projectIconKey } from "#/utils/feed-icon-keys";
import { FeedCustomIcon } from "./feed-custom-icon";
import { FeedFilterRow } from "./feed-filter-row";
import { FeedIconMenu } from "./feed-icon-menu";
import { FeedIconTile } from "./feed-icon-tile";

const TILE_SIZE = 36;
const TILE_RADIUS = 12;

interface FeedProjectRowProps {
  project: string;
  count: number;
  meta?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

/** A project in the left list, with an icon the user can customize. */
export function FeedProjectRow({
  project,
  count,
  meta,
  selected,
  onSelect,
}: FeedProjectRowProps) {
  const iconKey = projectIconKey(project);
  return (
    <FeedFilterRow
      testId="feed-filter-project"
      label={project}
      count={count}
      meta={meta}
      icon={
        <FeedCustomIcon
          iconKey={iconKey}
          size={TILE_SIZE}
          radius={TILE_RADIUS}
          glyph={<FolderGit2 size={20} />}
          fallback={
            <FeedIconTile className={pickFeedTint(project)}>
              <FolderGit2 size={20} />
            </FeedIconTile>
          }
        />
      }
      selected={selected}
      onSelect={onSelect}
      action={<FeedIconMenu iconKey={iconKey} subject={project} />}
    />
  );
}
