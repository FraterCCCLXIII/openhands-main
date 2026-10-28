import React from "react";
import { useTranslation } from "react-i18next";
import { CopyToClipboardButton } from "#/components/shared/buttons/copy-to-clipboard-button";
import { I18nKey } from "#/i18n/declaration";

export const MOBILE_APP_REPO_URL =
  "https://github.com/OpenHands/openhands-mobile";

const INSTALL_COMMANDS = `git clone ${MOBILE_APP_REPO_URL}.git
cd openhands-mobile
npm install`;

export function MobileAppSetupSection() {
  const { t } = useTranslation("openhands");
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMANDS);
      setIsCopied(true);
    } catch {
      // Clipboard unavailable; the commands remain selectable.
    }
  };

  return (
    <section
      className="flex flex-col gap-2"
      data-testid="mobile-app-setup-section"
    >
      <h3 className="text-sm font-medium text-contrast">
        {t(I18nKey.MOBILE_APP$TITLE)}
      </h3>
      <p className="text-sm text-muted">{t(I18nKey.MOBILE_APP$DESCRIPTION)}</p>
      <div className="flex flex-col gap-3 rounded-md border border-border-subtle p-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-contrast">
            {t(I18nKey.MOBILE_APP$INSTALL_LABEL)}
          </span>
          <div className="flex items-start gap-2 rounded-md border border-border-subtle p-2">
            <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs text-contrast">
              <code>{INSTALL_COMMANDS}</code>
            </pre>
            <CopyToClipboardButton
              isHidden={false}
              isDisabled={isCopied}
              onClick={handleCopy}
              mode={isCopied ? "copied" : "copy"}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">
            {t(I18nKey.MOBILE_APP$REACH_INTRO)}
          </p>
          <ul className="list-disc pl-5 text-sm text-muted">
            <li>{t(I18nKey.MOBILE_APP$REACH_LAN)}</li>
            <li>{t(I18nKey.MOBILE_APP$REACH_TAILSCALE)}</li>
            <li>{t(I18nKey.MOBILE_APP$REACH_TUNNEL)}</li>
          </ul>
        </div>
        <a
          href={MOBILE_APP_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="mobile-app-repo-link"
          className="self-start text-sm text-contrast underline"
        >
          {t(I18nKey.MOBILE_APP$GITHUB_LINK)}
        </a>
      </div>
    </section>
  );
}
