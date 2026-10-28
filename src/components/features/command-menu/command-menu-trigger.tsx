import React from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { useCommandMenuStore } from "#/stores/command-menu-store";
import { cn } from "#/utils/utils";
import { SidebarCollapsedIconSlot } from "#/components/features/sidebar/sidebar-collapsed-icon-slot";
import {
  SIDEBAR_ICON_SLOT_CLASS,
  sidebarNavRowClassName,
} from "#/components/features/sidebar/sidebar-layout";

interface CommandMenuTriggerProps {
  collapsed: boolean;
}

const COMMAND_MENU_TRIGGER_TEST_ID = "command-menu-trigger";
const COMMAND_MENU_TRIGGER_ICON_SIZE = 18;

export function CommandMenuTrigger({ collapsed }: CommandMenuTriggerProps) {
  const { t } = useTranslation("openhands");
  const open = useCommandMenuStore((state) => state.open);
  const label = t(I18nKey.COMMAND_MENU$OPEN_LABEL);

  const trigger = (
    <button
      type="button"
      data-testid={COMMAND_MENU_TRIGGER_TEST_ID}
      aria-label={label}
      onClick={open}
      className={cn(
        sidebarNavRowClassName({ collapsed }),
        "cursor-pointer",
        !collapsed && "w-auto justify-center text-muted hover:text-contrast",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {collapsed ? (
          <SidebarCollapsedIconSlot active={false}>
            <Search
              width={COMMAND_MENU_TRIGGER_ICON_SIZE}
              height={COMMAND_MENU_TRIGGER_ICON_SIZE}
            />
          </SidebarCollapsedIconSlot>
        ) : (
          <span className={SIDEBAR_ICON_SLOT_CLASS} aria-hidden="true">
            <Search
              width={COMMAND_MENU_TRIGGER_ICON_SIZE}
              height={COMMAND_MENU_TRIGGER_ICON_SIZE}
            />
          </span>
        )}
        <span className="sr-only">{label}</span>
      </span>
    </button>
  );

  if (collapsed) {
    return (
      <StyledTooltip content={label} placement="right">
        {trigger}
      </StyledTooltip>
    );
  }

  return trigger;
}
