import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FolderGit2, Palette } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { useFeedProjectIconsStore } from "#/stores/feed-project-icons-store";
import { IconAppearancePicker } from "#/ui/icon-appearance-picker";
import { StyledIcon } from "#/ui/styled-icon";
import { pickFeedTint } from "#/utils/feed-demo-agents";
import { FeedFilterRow } from "./feed-filter-row";
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
  const { t } = useTranslation("openhands");
  const custom = useFeedProjectIconsStore(
    (state) => state.iconsByProject[project],
  );
  const setIcon = useFeedProjectIconsStore((state) => state.setIcon);
  const [editing, setEditing] = useState(false);

  const icon = custom ? (
    <StyledIcon
      size={TILE_SIZE}
      borderRadius={TILE_RADIUS}
      background={custom.background}
      emoji={custom.emoji}
      lucideIcon={custom.lucide_icon}
    >
      <FolderGit2 size={20} />
    </StyledIcon>
  ) : (
    <FeedIconTile className={pickFeedTint(project)}>
      <FolderGit2 size={20} />
    </FeedIconTile>
  );

  return (
    <FeedFilterRow
      testId="feed-filter-project"
      label={project}
      count={count}
      meta={meta}
      icon={icon}
      selected={selected}
      onSelect={onSelect}
      action={
        <button
          type="button"
          data-testid="feed-project-icon-edit"
          aria-label={t(I18nKey.FEED$ICON_CUSTOMIZE)}
          title={t(I18nKey.FEED$ICON_CUSTOMIZE)}
          aria-expanded={editing}
          onClick={() => setEditing((value) => !value)}
          className="rounded-full p-2 text-muted hover:bg-surface-raised hover:text-contrast"
        >
          <Palette size={16} />
        </button>
      }
      footer={
        editing ? (
          <div className="px-2 pb-2 pt-1">
            <IconAppearancePicker
              value={custom ?? {}}
              onChange={(value) => setIcon(project, value)}
              previewSize={TILE_SIZE}
            />
          </div>
        ) : null
      }
    />
  );
}
