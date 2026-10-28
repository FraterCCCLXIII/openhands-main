import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FolderGit2, MoreHorizontal, Palette } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { useFeedProjectIconsStore } from "#/stores/feed-project-icons-store";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { ContextMenu } from "#/ui/context-menu";
import { StyledIcon } from "#/ui/styled-icon";
import { pickFeedTint } from "#/utils/feed-demo-agents";
import { FeedFilterRow } from "./feed-filter-row";
import { FeedIconTile } from "./feed-icon-tile";
import { FeedProjectIconModal } from "./feed-project-icon-modal";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useClickOutsideElement<HTMLUListElement>(
    () => setMenuOpen(false),
    triggerRef,
  );

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
    <>
      <FeedFilterRow
        testId="feed-filter-project"
        label={project}
        count={count}
        meta={meta}
        icon={icon}
        selected={selected}
        onSelect={onSelect}
        action={
          <span ref={triggerRef} className="relative block">
            <button
              type="button"
              data-testid="feed-project-menu-trigger"
              aria-label={t(I18nKey.FEED$MORE_ACTIONS)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-full p-2 text-muted hover:bg-surface hover:text-contrast"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen ? (
              <ContextMenu
                ref={menuRef}
                testId="feed-project-menu"
                alignment="right"
                position="bottom"
                className="z-20 min-w-48"
              >
                <ContextMenuListItem
                  testId="feed-project-menu-customize"
                  onClick={() => {
                    setMenuOpen(false);
                    setModalOpen(true);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Palette size={14} />
                    {t(I18nKey.FEED$ICON_CUSTOMIZE)}
                  </span>
                </ContextMenuListItem>
              </ContextMenu>
            ) : null}
          </span>
        }
      />
      {modalOpen ? (
        <FeedProjectIconModal
          project={project}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}
