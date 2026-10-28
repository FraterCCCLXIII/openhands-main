import React from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatInputProfileState } from "#/hooks/use-chat-input-profile-state";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { ContextMenu } from "#/ui/context-menu";
import { ExpandChevron } from "#/components/shared/expand-chevron";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import type { AgentProfileSummary } from "#/api/agent-profiles-service/agent-profiles-service.api";
import {
  chatInputIconButtonClassName,
  chatInputModelPillClassName,
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
import {
  agentProfileAccentColor,
  AGENT_ACCENT_ICONS,
  agentProfileIconIndex,
} from "./agent-profile-accent";

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
  /** The LLM profile this agent uses by default, when it has one. */
  modelName: string | null;
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
  modelName,
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
    <li role="presentation" className="flex flex-col px-3">
      <div
        className={cn(
          "flex items-center rounded px-2 hover:bg-interactive-hover",
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
          className="flex min-w-0 flex-1 items-center gap-2 px-0 hover:bg-transparent"
        >
          <AgentProfileGlyph
            name={profile.name}
            size={14}
            className="shrink-0"
            framed
          />
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate text-sm leading-5" title={profile.name}>
              {profile.name}
            </span>
            {modelName && (
              <span
                className="truncate text-xs leading-4 text-muted"
                data-testid="chat-input-agent-profile-model"
              >
                {modelName}
              </span>
            )}
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
            className={cn(chatInputIconButtonClassName, "size-6 shrink-0")}
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
interface AgentProfileGlyphProps {
  name: string;
  size: number;
  className?: string;
  testId?: string;
  /** Wraps the icon in a small rounded grey tile (used in dropdown rows). */
  framed?: boolean;
}

/** The profile's stable icon, tinted with its accent color. */
export function AgentProfileGlyph({
  name,
  size,
  className,
  testId,
  framed = false,
}: AgentProfileGlyphProps) {
  const Icon = AGENT_ACCENT_ICONS[agentProfileIconIndex(name)];
  const icon = (
    <Icon
      width={size}
      height={size}
      className={className}
      style={{ color: agentProfileAccentColor(name) }}
      data-testid={testId}
      aria-hidden
    />
  );
  if (!framed) return icon;
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-interactive-hover">
      {icon}
    </span>
  );
}

export function ChatInputAgentProfilePicker() {
  const { t } = useTranslation("openhands");
  const {
    profiles,
    currentProfileId,
    currentProfileName,
    isLoading,
    isSwitching,
    selectProfile,
  } = useChatInputProfileState();
  const [isOpen, setIsOpen] = React.useState(false);
  const [openMenuKey, setOpenMenuKey] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => {
    setIsOpen(false);
    setOpenMenuKey(null);
    setQuery("");
  }, []);
  const visibleProfiles = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return profiles;
    return profiles.filter((profile) =>
      profile.name.toLowerCase().includes(needle),
    );
  }, [profiles, query]);
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
        className={cn(
          chatInputPillButtonClassName,
          chatInputModelPillClassName,
          "group max-w-50 bg-surface",
        )}
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
        <AgentProfileGlyph
          name={currentProfileName}
          size={14}
          className="shrink-0"
          testId="chat-input-agent-profile-icon"
          framed
        />
        {/* Hover (or keyboard focus) expands the name track; otherwise it
            stays collapsed so the pill shows only the icon and chevron. */}
        <span className="grid grid-cols-[0fr] overflow-hidden transition-[grid-template-columns] duration-200 ease-out group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]">
          <span className="min-w-0 truncate capitalize">
            {currentProfileName}
          </span>
        </span>
        <ExpandChevron expanded={isDropdownOpen} className="size-3.5" />
      </button>
      {isDropdownOpen && (
        <ContextMenu
          ref={popoverRef}
          testId="chat-input-agent-profile-popover"
          position="top"
          alignment="left"
          spacing="none"
          className="z-[60] mb-2 min-w-56 max-w-80 p-0"
        >
          <li role="presentation" className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") event.stopPropagation();
                }}
                placeholder={t(I18nKey.CHAT$SEARCH_AGENT_PROFILES)}
                aria-label={t(I18nKey.CHAT$SEARCH_AGENT_PROFILES)}
                data-testid="chat-input-agent-profile-search"
                className="w-full rounded-md border border-border bg-surface px-8 py-1.5 text-sm leading-5 text-foreground placeholder:text-muted transition-colors hover:border-contrast/25 focus:border-contrast/35 focus:outline-none"
              />
            </div>
          </li>
          <li role="presentation">
            <Divider />
          </li>
          <li role="presentation" className="min-h-0">
            <ul className="custom-scrollbar flex max-h-64 flex-col overflow-y-auto">
              {visibleProfiles.map((profile) => {
                const profileKey = profile.id ?? profile.name;
                return (
                  <AgentProfileRow
                    key={profileKey}
                    profile={profile}
                    modelName={profile.llm_profile_ref ?? null}
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
            </ul>
          </li>
          {showSettingsLink && (
            <li role="presentation">
              <Divider />
            </li>
          )}
          {showSettingsLink && (
            <li role="presentation" className="px-3 pt-1 pb-1">
              <NavigationLink
                to="/settings/agents"
                onClick={close}
                data-testid="chat-input-agent-profile-add"
                className="flex h-7.5 items-center gap-2 rounded px-2 text-sm leading-5 text-foreground hover:bg-interactive-hover transition-colors"
              >
                <Plus width={14} height={14} className="shrink-0" aria-hidden />
                <span>{t(I18nKey.SETTINGS$ADD_AGENT_PROFILE)}</span>
              </NavigationLink>
            </li>
          )}
        </ContextMenu>
      )}
    </div>
  );
}
