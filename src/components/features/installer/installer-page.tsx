import React from "react";
import { useTranslation } from "react-i18next";
import { ResizeHandle } from "#/components/ui/resize-handle";
import { useResizablePanels } from "#/hooks/use-resizable-panels";
import { I18nKey } from "#/i18n/declaration";
import { InstallerConversationPane } from "./installer-conversation-pane";
import { InstallerFieldsPane } from "./installer-fields-pane";
import {
  createInstallerFieldValues,
  createInstallerSwitchValues,
} from "./installer-fields";

const INSTALLER_PANEL_WIDTH_KEY = "installer-layout-panel-width";

export function InstallerPage() {
  const { t } = useTranslation("openhands");
  const { leftWidth, rightWidth, isDragging, containerRef, handleMouseDown } =
    useResizablePanels({
      defaultLeftWidth: 58,
      minLeftWidth: 36,
      maxLeftWidth: 72,
      storageKey: INSTALLER_PANEL_WIDTH_KEY,
    });

  const [values, setValues] = React.useState(createInstallerFieldValues);
  const [switches, setSwitches] = React.useState(createInstallerSwitchValues);
  const [messages, setMessages] = React.useState(() => [
    {
      id: "welcome",
      type: "agent" as const,
      message: t(I18nKey.INSTALLER$WELCOME),
    },
  ]);

  const handleFieldChange = (id: string, value: string) => {
    setValues((current) => ({ ...current, [id]: value }));
  };

  const handleSwitchChange = (id: string, value: boolean) => {
    setSwitches((current) => ({ ...current, [id]: value }));
  };

  const handleSubmit = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { id: `user-${current.length}`, type: "user", message: trimmed },
      {
        id: `agent-${current.length}`,
        type: "agent",
        message: t(I18nKey.INSTALLER$PLACEHOLDER_REPLY),
      },
    ]);
  };

  return (
    <div
      data-testid="installer-page"
      className="flex h-full min-h-0 flex-col bg-base overflow-hidden"
    >
      <div ref={containerRef} className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className="flex min-h-0 min-w-0 flex-col"
          style={{ width: `${leftWidth}%` }}
        >
          <InstallerConversationPane
            messages={messages}
            onSubmit={handleSubmit}
          />
        </div>
        <ResizeHandle onMouseDown={handleMouseDown} isDragging={isDragging} />
        <div
          className="flex min-h-0 min-w-0 flex-col"
          style={{ width: `${rightWidth}%` }}
        >
          <InstallerFieldsPane
            values={values}
            switches={switches}
            onFieldChange={handleFieldChange}
            onSwitchChange={handleSwitchChange}
          />
        </div>
      </div>
    </div>
  );
}
