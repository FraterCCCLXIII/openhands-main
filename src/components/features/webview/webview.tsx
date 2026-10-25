import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WebviewChromeBar } from "./webview-chrome-bar";
import { EmptyWebviewMessage } from "./empty-webview-message";
import { useWebviewStore } from "#/stores/webview-store";
import { I18nKey } from "#/i18n/declaration";

export function WebviewPanel() {
  const { t } = useTranslation("openhands");
  const { url } = useWebviewStore();
  const hasPage = Boolean(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setIframeKey((prev) => prev + 1);
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col text-muted">
      <WebviewChromeBar
        url={url}
        hasPage={hasPage}
        onRefresh={hasPage ? handleRefresh : undefined}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide bg-surface">
        {url ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={url}
            title={t(I18nKey.COMMON$WEBVIEW)}
            className="h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            data-testid="webview-iframe"
          />
        ) : (
          <EmptyWebviewMessage />
        )}
      </div>
    </div>
  );
}
