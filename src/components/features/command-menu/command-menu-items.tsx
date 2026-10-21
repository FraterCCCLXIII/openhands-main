import React from "react";
import { AppWindow, Brain, Plus, Route, Settings, Shield } from "lucide-react";
import AutomationsIcon from "#/icons/automations.svg?react";
import BlockDrawerLeftIcon from "#/icons/block-drawer-left.svg?react";
import CustomizeBoxesIcon from "#/icons/customize-boxes.svg?react";
import KeyIcon from "#/icons/key.svg?react";
import MemoryIcon from "#/icons/memory_icon.svg?react";
import ServerProcessIcon from "#/icons/server-process.svg?react";
import CircuitIcon from "#/icons/u-circuit.svg?react";
import RobotIcon from "#/icons/u-robot.svg?react";
import { I18nKey } from "#/i18n/declaration";
import {
  automationListPath,
  getInterfaceCopy,
  hasAutomationInterface,
} from "#/manifests/automation-interface";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { getActiveBackend } from "#/api/backend-registry/active-store";
import { LOCKED_CLOUD_SETTINGS_NAV_PATH } from "#/constants/settings-nav";
import { isApplePlatform } from "#/utils/utils";

const ICON_SIZE = 18;

export const COMMAND_MENU_ROUTE = {
  conversations: "/conversations",
  customize: "/customize",
  automations: automationListPath(),
  mcp: "/mcp",
  settings: "/settings",
  agentSettings: "/settings/agents",
  llmSettings: "/settings/llm",
  metaLlmSettings: "/settings/meta-llm",
  condenserSettings: "/settings/condenser",
  agentContextSettings: "/settings/agent-context",
  verificationSettings: "/settings/verification",
  appSettings: "/settings/app",
  secretsSettings: "/settings/secrets",
} as const;

export type CommandMenuGroupId =
  | "conversations"
  | "navigation"
  | "settings"
  | "actions";
export type CommandMenuItemId =
  | "new-chat"
  | "customize"
  | "automations"
  | "mcp"
  | "settings"
  | "agent-settings"
  | "llm-settings"
  | "meta-llm-settings"
  | "condenser-settings"
  | "agent-context-settings"
  | "verification-settings"
  | "app-settings"
  | "secrets-settings"
  | "toggle-sidebar";

export interface CommandMenuItemDefinition {
  id: CommandMenuItemId;
  group: CommandMenuGroupId;
  /** Absent on an item whose copy a manifest owns, which sets the literal. */
  titleKey?: I18nKey;
  descriptionKey?: I18nKey;
  keywordsKey?: I18nKey;
  /** Literal copy, for an item a manifest owns. */
  title?: string;
  description?: string;
  keywords?: string;
  icon: React.ReactElement;
  to?: string;
  perform?: () => void;
}

/**
 * An item's copy: its literal when a manifest owns the item, its translation
 * otherwise.
 */
export function commandMenuItemCopy(
  literal: string | undefined,
  key: I18nKey | undefined,
  translate: (key: I18nKey) => string,
): string {
  if (literal !== undefined) return literal;
  return key === undefined ? "" : translate(key);
}

/**
 * The open-menu shortcut as the platform spells it: ⌘K on Apple platforms,
 * Ctrl+K elsewhere. The key handler accepts either modifier everywhere.
 */
export function getCommandMenuShortcutKey(): I18nKey {
  return isApplePlatform()
    ? I18nKey.COMMAND_MENU$SHORTCUT
    : I18nKey.COMMAND_MENU$SHORTCUT_CTRL;
}

export const COMMAND_MENU_GROUP_LABELS: Record<CommandMenuGroupId, I18nKey> = {
  conversations: I18nKey.COMMAND_MENU$GROUP_CONVERSATIONS,
  navigation: I18nKey.COMMAND_MENU$GROUP_NAVIGATION,
  settings: I18nKey.COMMAND_MENU$GROUP_SETTINGS,
  actions: I18nKey.COMMAND_MENU$GROUP_ACTIONS,
};

export const COMMAND_MENU_GROUP_ORDER: CommandMenuGroupId[] = [
  "navigation",
  "settings",
  "actions",
];

/** When conversation matches are present, show them above static commands. */
export const COMMAND_MENU_GROUP_ORDER_WITH_CONVERSATIONS: CommandMenuGroupId[] =
  ["conversations", ...COMMAND_MENU_GROUP_ORDER];

export const createCommandMenuItems = ({
  toggleSidebar,
}: {
  toggleSidebar: () => void;
}): CommandMenuItemDefinition[] => {
  const items: CommandMenuItemDefinition[] = [
    {
      id: "new-chat",
      group: "navigation",
      titleKey: I18nKey.COMMAND_MENU$NEW_CHAT_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$NEW_CHAT_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$NEW_CHAT_KEYWORDS,
      icon: <Plus size={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.conversations,
    },
    {
      id: "customize",
      group: "navigation",
      titleKey: I18nKey.COMMAND_MENU$CUSTOMIZE_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$CUSTOMIZE_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$CUSTOMIZE_KEYWORDS,
      icon: <CustomizeBoxesIcon width={ICON_SIZE} height={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.customize,
    },
    // The automation interface owns this entry's copy, so an absent manifest
    // leaves the command menu without it rather than with host copy.
    ...(hasAutomationInterface()
      ? [
          {
            id: "automations" as const,
            group: "navigation" as const,
            title: getInterfaceCopy().commandMenuTitle,
            description: getInterfaceCopy().commandMenuDescription,
            keywords: getInterfaceCopy().commandMenuKeywords,
            icon: <AutomationsIcon width={ICON_SIZE} height={ICON_SIZE} />,
            to: COMMAND_MENU_ROUTE.automations,
          },
        ]
      : []),
    {
      id: "mcp",
      group: "navigation",
      titleKey: I18nKey.COMMAND_MENU$MCP_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$MCP_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$MCP_KEYWORDS,
      icon: <ServerProcessIcon width={ICON_SIZE} height={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.mcp,
    },
    {
      id: "settings",
      group: "settings",
      titleKey: I18nKey.COMMAND_MENU$SETTINGS_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$SETTINGS_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$SETTINGS_KEYWORDS,
      icon: <Settings size={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.settings,
    },
    {
      id: "agent-settings",
      group: "settings",
      titleKey: I18nKey.COMMAND_MENU$AGENT_SETTINGS_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$AGENT_SETTINGS_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$AGENT_SETTINGS_KEYWORDS,
      icon: <RobotIcon width={ICON_SIZE} height={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.agentSettings,
    },
    {
      id: "llm-settings",
      group: "settings",
      titleKey: I18nKey.COMMAND_MENU$LLM_SETTINGS_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$LLM_SETTINGS_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$LLM_SETTINGS_KEYWORDS,
      icon: <CircuitIcon width={ICON_SIZE} height={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.llmSettings,
    },
    {
      id: "meta-llm-settings",
      group: "settings",
      titleKey: I18nKey.SETTINGS$NAV_META_LLM,
      descriptionKey: I18nKey.SETTINGS$PAGE_META_LLM_SUBLINE,
      keywordsKey: I18nKey.COMMAND_MENU$META_LLM_SETTINGS_KEYWORDS,
      icon: <Route size={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.metaLlmSettings,
    },
    {
      id: "condenser-settings",
      group: "settings",
      titleKey: I18nKey.COMMAND_MENU$CONDENSER_SETTINGS_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$CONDENSER_SETTINGS_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$CONDENSER_SETTINGS_KEYWORDS,
      icon: <MemoryIcon width={ICON_SIZE} height={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.condenserSettings,
    },
    {
      id: "agent-context-settings",
      group: "settings",
      titleKey: I18nKey.SETTINGS$NAV_AGENT_CONTEXT,
      descriptionKey: I18nKey.SETTINGS$PAGE_AGENT_CONTEXT_SUBLINE,
      keywordsKey: I18nKey.COMMAND_MENU$AGENT_CONTEXT_SETTINGS_KEYWORDS,
      icon: <Brain size={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.agentContextSettings,
    },
    {
      id: "verification-settings",
      group: "settings",
      titleKey: I18nKey.COMMAND_MENU$VERIFICATION_SETTINGS_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$VERIFICATION_SETTINGS_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$VERIFICATION_SETTINGS_KEYWORDS,
      icon: <Shield className="size-[18px]" strokeWidth={2} aria-hidden />,
      to: COMMAND_MENU_ROUTE.verificationSettings,
    },
    {
      id: "app-settings",
      group: "settings",
      titleKey: I18nKey.COMMAND_MENU$APP_SETTINGS_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$APP_SETTINGS_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$APP_SETTINGS_KEYWORDS,
      icon: <AppWindow className="size-[18px]" strokeWidth={2} aria-hidden />,
      to: COMMAND_MENU_ROUTE.appSettings,
    },
    {
      id: "secrets-settings",
      group: "settings",
      titleKey: I18nKey.COMMAND_MENU$SECRETS_SETTINGS_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$SECRETS_SETTINGS_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$SECRETS_SETTINGS_KEYWORDS,
      icon: <KeyIcon width={ICON_SIZE} height={ICON_SIZE} />,
      to: COMMAND_MENU_ROUTE.secretsSettings,
    },
    {
      id: "toggle-sidebar",
      group: "actions",
      titleKey: I18nKey.COMMAND_MENU$TOGGLE_SIDEBAR_TITLE,
      descriptionKey: I18nKey.COMMAND_MENU$TOGGLE_SIDEBAR_DESCRIPTION,
      keywordsKey: I18nKey.COMMAND_MENU$TOGGLE_SIDEBAR_KEYWORDS,
      icon: (
        <BlockDrawerLeftIcon width={ICON_SIZE} height={ICON_SIZE} aria-hidden />
      ),
      perform: toggleSidebar,
    },
  ];

  // Locked-to-Cloud (SaaS / self-hosted OHE) lists only the Application page;
  // the OHE settings shell owns the rest (OHE-3168).
  const isLockedToCloud = getLockedCloudHost() !== null;
  // Locally each agent profile has its own condenser.
  const isCloud = getActiveBackend().backend.kind === "cloud";

  return items.filter(
    (item) =>
      (isCloud || item.to !== COMMAND_MENU_ROUTE.condenserSettings) &&
      (!isLockedToCloud ||
        item.group !== "settings" ||
        item.to === COMMAND_MENU_ROUTE.settings ||
        item.to === LOCKED_CLOUD_SETTINGS_NAV_PATH),
  );
};
