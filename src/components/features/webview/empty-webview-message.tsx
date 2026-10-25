import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { ConversationTabEmptyState } from "#/components/features/conversation/conversation-tab-empty-state";

export function EmptyWebviewMessage() {
  const { t } = useTranslation("openhands");

  return (
    <ConversationTabEmptyState icon={<ExternalLink />}>
      {t(I18nKey.WEBVIEW$EMPTY_MESSAGE)}
    </ConversationTabEmptyState>
  );
}
