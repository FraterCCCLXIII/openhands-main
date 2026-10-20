import React from "react";
import { useTranslation } from "react-i18next";
import i18n from "#/i18n";
import { ExpandChevron } from "#/components/shared/expand-chevron";
import { MarkdownRenderer } from "../markdown/markdown-renderer";

interface ErrorMessageProps {
  errorId?: string;
  defaultMessage: string;
}

export function ErrorMessage({ errorId, defaultMessage }: ErrorMessageProps) {
  const { t } = useTranslation("openhands");
  const [showDetails, setShowDetails] = React.useState(false);

  const hasValidTranslationId = !!errorId && i18n.exists(errorId);
  const errorKey = hasValidTranslationId
    ? errorId
    : "CHAT_INTERFACE$AGENT_ERROR_MESSAGE";

  return (
    <div className="flex flex-col gap-2 my-2 py-2 text-sm w-full">
      <div className="font-bold text-danger">
        {t(errorKey)}
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="cursor-pointer text-left"
        >
          <ExpandChevron
            expanded={showDetails}
            className="h-3 w-3 ml-2 inline text-danger"
          />
        </button>
      </div>

      {showDetails && <MarkdownRenderer>{defaultMessage}</MarkdownRenderer>}
    </div>
  );
}
