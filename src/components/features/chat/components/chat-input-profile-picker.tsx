import React from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatInputProfileState } from "#/hooks/use-chat-input-profile-state";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import RobotIcon from "#/icons/u-robot.svg?react";
import { ContextMenu } from "#/ui/context-menu";
import { ExpandChevron } from "#/components/shared/expand-chevron";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import type { AgentProfileSummary } from "#/api/agent-profiles-service/agent-profiles-service.api";
import {
  chatInputIconButtonClassName,
  chatInputPillButtonClassName,
} from "#/utils/form-control-classes";
import SettingsGearIcon from "#/icons/settings-gear.svg?react";
import CheckIcon from "#/icons/checkmark.svg?react";
import { NavigationLink } from "#/components/shared/navigation-link";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { Divider } from "#/ui/divider";
import { Typography } from "#/ui/typography";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { getLockedCloudHost } from "#/api/agent-server-config";

interface ChatInputProfileMenuContentProps {
  onClose: () => void;
  dividerInset?: "menu";
  settingsLinkClassName?: string;
  settingsIconClassName?: string;
}

/**
 * The agent-profile list rendered inside the "+" tools menu's "Switch agent
 * profile" submenu, offered only while starting a new conversation (OSS-5735 —
 * the profile is locked once a conversation starts). Selecting a profile
 * activates it (home) or recreates the blank conversation with it (see
 * `useChatInputProfileState`). Also the menu of the
 * {@link ChatInputAgentProfilePicker} pill.
 */
export function ChatInputProfileMenuContent({
  onClose,
  dividerInset,
  settingsLinkClassName,
  settingsIconClassName,
}: ChatInputProfileMenuContentProps) {
  const { t } = useTranslation("openhands");
  const {
    profiles,
    currentProfileId,
    isInConversation,
    isSwitching,
    selectProfile,
  } = useChatInputProfileState();
  // Locked-to-Cloud blocks the Canvas agent profiles page this links to
  // (OHE-3457).
  const showSettingsLink = getLockedCloudHost() === null;

  const handleSelect = (profile: (typeof profiles)[number]) => {
    selectProfile(profile);
    onClose();
  };

  return (
    <>
      {profiles.length > 0 && (
        <>
          {/* role="presentation" keeps this a valid <li> child of the
              ContextMenu <ul> without exposing the label as a menu item. */}
          <li role="presentation" className="px-2 pt-1 pb-0.5">
            <Typography.Text className="text-[11px] font-medium text-text-dim uppercase tracking-wide leading-4">
              {t(I18nKey.SETTINGS$AVAILABLE_PROFILES)}
            </Typography.Text>
          </li>
          {profiles.map((profile) => {
            const isCurrent =
              profile.id != null && profile.id === currentProfileId;
            return (
              <ContextMenuListItem
                key={profile.id ?? profile.name}
                testId={`chat-input-agent-profile-option-${profile.name}`}
                isDisabled={isSwitching}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (isCurrent) {
                    onClose();
                    return;
                  }
                  handleSelect(profile);
                }}
                className={cn(
                  "flex items-center gap-2",
                  isCurrent && "bg-interactive-hover",
                )}
              >
                <span
                  className="flex-1 truncate text-sm leading-5"
                  title={profile.name}
                >
                  {profile.name}
                </span>
                {isCurrent && (
                  <CheckIcon
                    width={14}
                    height={14}
                    className="shrink-0"
                    aria-hidden
                  />
                )}
              </ContextMenuListItem>
            );
          })}
          {isInConversation && (
            <li role="presentation" className="px-2 pt-0.5 pb-1">
              <Typography.Text className="text-[11px] text-text-dim leading-4">
                {t(I18nKey.CHAT$START_NEW_WITH_PROFILE_HINT)}
              </Typography.Text>
            </li>
          )}
        </>
      )}
      {showSettingsLink && profiles.length > 0 && (
        <Divider inset={dividerInset} />
      )}
      {showSettingsLink && (
        <li className="text-sm">
          <NavigationLink
            to="/settings/agents"
            onClick={onClose}
            className={cn(
              "flex h-7.5 items-center gap-2 rounded p-2 leading-5 text-foreground hover:bg-interactive-hover transition-colors",
              settingsLinkClassName,
            )}
          >
            <SettingsGearIcon
              width={16}
              height={16}
              className={cn("shrink-0", settingsIconClassName)}
              aria-hidden
            />
            <span>{t(I18nKey.CHAT$MANAGE_AGENT_PROFILES)}</span>
          </NavigationLink>
        </li>
      )}
    </>
  );
}

interface AgentProfileRowProps {
  profile: AgentProfileSummary;
  isCurrent: boolean;
  isMenuOpen: boolean;
  showSettingsLink: boolean;
  onSelect: (profile: AgentProfileSummary) => void;
  onToggleMenu: (profileKey: string | null) => void;
  onClose: () => void;
}

/**
 * One agent in the pill's dropdown: icon, name, check when active, and a
 * three-dot button that expands a small per-agent action list. The row body and
 * the three-dot button are siblings, so opening the menu never selects the row.
 */
function AgentProfileRow({
  profile,
  isCurrent,
  isMenuOpen,
  showSettingsLink,
  onSelect,
  onToggleMenu,
  onClose,
}: AgentProfileRowProps) {
  const { t } = useTranslation("openhands");
  const profileKey = profile.id ?? profile.name;
  // "Set as active" needs an id to activate and is pointless on the active row.
  const canSetActive = !isCurrent && Boolean(profile.id);
  const hasActions = canSetActive || showSettingsLink;

  return (
    <li role="presentation" className="flex flex-col">
      <div
        className={cn(
          "flex items-center rounded",
          isCurrent && "bg-interactive-hover",
        )}
      >
        <ContextMenuListItem
          testId={`chat-input-agent-profile-option-${profile.name}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect(profile);
          }}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <RobotIcon width={14} height={14} className="shrink-0" aria-hidden />
          <span
            className="flex-1 truncate text-left text-sm leading-5"
            title={profile.name}
          >
            {profile.name}
          </span>
          {isCurrent && (
            <CheckIcon
              width={14}
              height={14}
              className="shrink-0"
              aria-hidden
            />
          )}
        </ContextMenuListItem>
        {hasActions && (
          <button
            type="button"
            className={cn(chatInputIconButtonClassName, "mr-1 size-6 shrink-0")}
            aria-label={`${t(I18nKey.COMMON$MORE_OPTIONS)}: ${profile.name}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            data-testid={`chat-input-agent-profile-more-${profile.name}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleMenu(isMenuOpen ? null : profileKey);
            }}
          >
            <MoreHorizontal width={16} height={16} aria-hidden />
          </button>
        )}
      </div>
      {isMenuOpen && hasActions && (
        <ul
          role="menu"
          data-testid={`chat-input-agent-profile-menu-${profile.name}`}
          className="ml-6 flex flex-col py-0.5"
        >
          {canSetActive && (
            <li role="presentation">
              <ContextMenuListItem
                testId={`chat-input-agent-profile-set-active-${profile.name}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect(profile);
                }}
              >
                <span className="text-sm leading-5">
                  {t(I18nKey.SETTINGS$PROFILE_SET_ACTIVE)}
                </span>
              </ContextMenuListItem>
            </li>
          )}
          {showSettingsLink && (
            <li role="presentation" className="text-sm">
              <NavigationLink
                to="/settings/agents"
                onClick={onClose}
                data-testid={`chat-input-agent-profile-settings-${profile.name}`}
                className="flex h-7.5 items-center rounded p-2 leading-5 text-foreground hover:bg-interactive-hover transition-colors"
              >
                {t(I18nKey.CHAT$OPEN_AGENT_SETTINGS)}
              </NavigationLink>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

/**
 * The agent-profile pill next to the LLM model pill: names the active agent
 * profile and opens a list of agents to switch between. It stays visible in a
 * started conversation (picking another agent there starts a new conversation
 * with it) and is disabled, with an explanatory tooltip, when switching isn't
 * possible (a switch is in flight, or a cloud start task is provisioning).
 */
export function ChatInputAgentProfilePicker() {
  const { t } = useTranslation("openhands");
  const {
    profiles,
    currentProfileId,
    currentProfileName,
    isInConversation,
    isLoading,
    isSwitching,
    selectProfile,
  } = useChatInputProfileState();
  const [isOpen, setIsOpen] = React.useState(false);
  const [openMenuKey, setOpenMenuKey] = React.useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => {
    setIsOpen(false);
    setOpenMenuKey(null);
  }, []);
  const popoverRef = useClickOutsideElement<HTMLUListElement>(
    close,
    triggerRef,
  );
  useCloseOnEscape(isOpen, close, triggerRef);
  // Locked-to-Cloud blocks the Canvas agent profiles page (OHE-3457).
  const showSettingsLink = getLockedCloudHost() === null;

  if (isLoading || !currentProfileName) return null;

  const isDropdownOpen = isOpen && !isSwitching;

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        className={cn(chatInputPillButtonClassName, "max-w-40 bg-surface")}
        title={
          isSwitching
            ? t(I18nKey.CHAT$AGENT_PROFILE_SWITCH_UNAVAILABLE)
            : t(I18nKey.CHAT$SWITCH_AGENT_PROFILE)
        }
        aria-label={`${t(I18nKey.CHAT$SWITCH_AGENT_PROFILE)}: ${currentProfileName}`}
        data-testid="chat-input-agent-profile"
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        disabled={isSwitching}
        aria-busy={isSwitching}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isOpen) {
            close();
          } else {
            setIsOpen(true);
          }
        }}
      >
        <span className="truncate">{currentProfileName}</span>
        <ExpandChevron expanded={isDropdownOpen} className="size-3.5" />
      </button>
      {isDropdownOpen && (
        <ContextMenu
          ref={popoverRef}
          testId="chat-input-agent-profile-popover"
          position="top"
          alignment="left"
          spacing="none"
          className="z-[60] mb-2 min-w-56 max-w-80 max-h-[60vh] overflow-y-auto"
        >
          {profiles.map((profile) => {
            const profileKey = profile.id ?? profile.name;
            return (
              <AgentProfileRow
                key={profileKey}
                profile={profile}
                isCurrent={
                  profile.id != null && profile.id === currentProfileId
                }
                isMenuOpen={openMenuKey === profileKey}
                showSettingsLink={showSettingsLink}
                onSelect={(selected) => {
                  selectProfile(selected);
                  close();
                }}
                onToggleMenu={setOpenMenuKey}
                onClose={close}
              />
            );
          })}
          {isInConversation && (
            <li role="presentation" className="px-2 pt-0.5 pb-1">
              <Typography.Text className="text-[11px] text-text-dim leading-4">
                {t(I18nKey.CHAT$START_NEW_WITH_PROFILE_HINT)}
              </Typography.Text>
            </li>
          )}
        </ContextMenu>
      )}
    </div>
  );
}
