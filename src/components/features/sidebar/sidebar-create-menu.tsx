import React, { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import { I18nKey } from "#/i18n/declaration";
import { ContextMenu } from "#/ui/context-menu";
import { cn } from "#/utils/utils";

/** Things a user can create, each opened from the New Chat dropdown. */
const CREATE_ITEMS = [
  {
    key: "conversation",
    label: I18nKey.COMMON$NEW_CONVERSATION,
    to: "/conversations",
  },
  {
    key: "automation",
    label: I18nKey.AUTOMATIONS$ADD_AUTOMATION,
    to: "/automations/setup",
  },
  {
    key: "agent-profile",
    label: I18nKey.SETTINGS$ADD_AGENT_PROFILE,
    to: "/settings/agents",
  },
  {
    key: "skill",
    label: I18nKey.CONVERSATION$OVERVIEW_ADD_SKILL,
    to: "/skills",
  },
  {
    key: "mcp-server",
    label: I18nKey.CONVERSATION$OVERVIEW_ADD_MCP,
    to: "/mcp",
  },
] as const;

/** Chevron beside New Chat that opens a menu of other things to create. */
export function SidebarCreateMenu() {
  const { t } = useTranslation("openhands");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setIsOpen(false);
  const menuRef = useClickOutsideElement<HTMLUListElement>(close, triggerRef);
  useCloseOnEscape(isOpen, close, triggerRef);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        data-testid="sidebar-create-menu-trigger"
        aria-label={t(I18nKey.COMMON$MORE_OPTIONS)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-interactive-hover hover:text-contrast",
          isOpen && "bg-interactive-hover text-contrast",
        )}
      >
        <ChevronDown width={14} height={14} aria-hidden />
      </button>
      {isOpen && (
        <ContextMenu
          ref={menuRef}
          testId="sidebar-create-menu"
          position="bottom"
          alignment="left"
          spacing="none"
          className="z-[60] mt-2 min-w-56 p-1"
        >
          {CREATE_ITEMS.map((item) => (
            <li key={item.key} role="presentation">
              <NavigationLink
                to={item.to}
                onClick={close}
                data-testid={`sidebar-create-${item.key}`}
                className="flex h-8 items-center rounded px-2 text-sm text-foreground hover:bg-interactive-hover"
              >
                {t(item.label)}
              </NavigationLink>
            </li>
          ))}
        </ContextMenu>
      )}
    </div>
  );
}
