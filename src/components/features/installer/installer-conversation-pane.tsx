import React from "react";
import { useTranslation } from "react-i18next";
import { ChatMessage } from "#/components/features/chat/chat-message";
import { CustomChatInput } from "#/components/features/chat/custom-chat-input";
import { I18nKey } from "#/i18n/declaration";
import { Text } from "#/ui/typography";
import type { SourceType } from "#/types/agent-server/core/base/common";

interface InstallerConversationMessage {
  id: string;
  type: SourceType;
  message: string;
}

interface InstallerConversationPaneProps {
  messages: InstallerConversationMessage[];
  onSubmit: (message: string) => void;
}

export function InstallerConversationPane({
  messages,
  onSubmit,
}: InstallerConversationPaneProps) {
  const { t } = useTranslation("openhands");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-base overflow-hidden">
      <div
        data-testid="installer-chat-header"
        className="flex h-10 min-h-10 shrink-0 items-center px-4"
      >
        <Text className="truncate font-medium">
          {t(I18nKey.INSTALLER$CONVERSATION_TITLE)}
        </Text>
      </div>
      <div
        className="relative flex h-full min-h-0 flex-col justify-between px-4"
        data-testid="installer-chat-interface"
      >
        <div
          ref={scrollRef}
          className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="flex flex-col gap-3 py-2">
            {messages.map((item) => (
              <ChatMessage
                key={item.id}
                type={item.type}
                message={item.message}
              />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col pb-4">
          <CustomChatInput
            onSubmit={onSubmit}
            hasStartedConversation
            showButton
          />
        </div>
      </div>
    </div>
  );
}
