import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Palette } from "lucide-react";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import { ContextMenu } from "#/ui/context-menu";
import { FeedIconModal } from "./feed-icon-modal";

interface FeedIconMenuProps {
  /** Key into the feed icons store. */
  iconKey: string;
  /** What is being customized, shown in the modal. */
  subject: string;
}

/** A three-dot button whose menu opens the icon editor in a modal. */
export function FeedIconMenu({ iconKey, subject }: FeedIconMenuProps) {
  const { t } = useTranslation("openhands");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useClickOutsideElement<HTMLUListElement>(
    () => setMenuOpen(false),
    triggerRef,
  );

  return (
    <>
      <span ref={triggerRef} className="relative block">
        <button
          type="button"
          data-testid="feed-icon-menu-trigger"
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
            testId="feed-icon-menu"
            alignment="right"
            position="bottom"
            className="z-20 min-w-48"
          >
            <ContextMenuListItem
              testId="feed-icon-menu-customize"
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
      {modalOpen ? (
        <FeedIconModal
          iconKey={iconKey}
          subject={subject}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}
