import React from "react";
import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { I18nKey } from "#/i18n/declaration";
import { Typography } from "#/ui/typography";
import {
  CONNECT_TUNNEL_PATH,
  isUnreachableFromPhone,
} from "#/utils/mobile-connect-host";
import { buildMobileConnectUrl } from "#/utils/mobile-connect-payload";
import { mobileConnectQrDataUrl } from "#/utils/mobile-connect-qr";

async function requestInternetLink(): Promise<string> {
  const response = await fetch(CONNECT_TUNNEL_PATH, { method: "POST" });
  const body = (await response.json()) as { url?: unknown; error?: unknown };
  if (!response.ok || typeof body.url !== "string" || !body.url.trim()) {
    throw new Error(
      typeof body.error === "string" && body.error.trim() ? body.error : "",
    );
  }
  return body.url.trim();
}

export function MobileSettingsScreen() {
  const { t } = useTranslation("openhands");
  const { backend } = useActiveBackend();
  const [host, setHost] = React.useState("");
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [qrError, setQrError] = React.useState<string | null>(null);
  const [linkBusy, setLinkBusy] = React.useState(false);
  const [linkError, setLinkError] = React.useState<string | null>(null);

  const hasSessionKey = Boolean(backend.apiKey.trim());
  const hostUnreachable = isUnreachableFromPhone(host);

  const showQrForHost = React.useCallback(
    async (nextHost: string) => {
      setQrError(null);
      const pairingUrl = buildMobileConnectUrl({
        host: nextHost,
        apiKey: backend.apiKey,
        name: backend.name,
      });
      setQrDataUrl(await mobileConnectQrDataUrl(pairingUrl));
    },
    [backend.apiKey, backend.name],
  );

  const openInternetLink = React.useCallback(async () => {
    setLinkBusy(true);
    setLinkError(null);
    try {
      const url = await requestInternetLink();
      setHost(url);
      await showQrForHost(url);
    } catch (caught) {
      setLinkError(
        caught instanceof Error && caught.message.trim()
          ? caught.message
          : t(I18nKey.SETTINGS$MOBILE_CREATE_LINK_ERROR),
      );
    } finally {
      setLinkBusy(false);
    }
  }, [showQrForHost, t]);

  React.useEffect(() => {
    if (!backend.apiKey.trim()) {
      return;
    }
    void openInternetLink();
    // Open the internet tunnel once per session key. Refresh is explicit.
  }, [backend.apiKey]);

  const onShowQr = async () => {
    try {
      await showQrForHost(host);
    } catch {
      setQrError(t(I18nKey.SETTINGS$MOBILE_QR_ERROR));
    }
  };

  return (
    <div data-testid="mobile-settings-screen" className="flex flex-col gap-6">
      <Typography.Paragraph className="text-sm text-[var(--oh-text-tertiary)]">
        {t(I18nKey.SETTINGS$MOBILE_INTRO)}
      </Typography.Paragraph>

      {!hasSessionKey ? (
        <Typography.Paragraph className="text-sm text-[var(--oh-text-tertiary)]">
          {t(I18nKey.SETTINGS$MOBILE_NO_KEY)}
        </Typography.Paragraph>
      ) : (
        <>
          {linkBusy && !qrDataUrl ? (
            <p
              data-testid="mobile-connect-creating-link"
              className="text-sm text-[var(--oh-text-tertiary)]"
            >
              {t(I18nKey.SETTINGS$MOBILE_CREATING_LINK)}
            </p>
          ) : null}

          <SettingsInput
            testId="mobile-connect-host"
            name="mobile-connect-host"
            label={t(I18nKey.SETTINGS$MOBILE_HOST_LABEL)}
            type="url"
            value={host}
            onChange={(value) => {
              setHost(value);
              setQrDataUrl(null);
            }}
            ariaDescribedBy="mobile-connect-host-help"
          />
          <p
            id="mobile-connect-host-help"
            className="text-sm text-[var(--oh-text-tertiary)]"
          >
            {hostUnreachable
              ? t(I18nKey.SETTINGS$MOBILE_HOST_LOOPBACK)
              : t(I18nKey.SETTINGS$MOBILE_HOST_HELP)}
          </p>

          {linkError ? (
            <p className="text-sm text-red-400">{linkError}</p>
          ) : null}

          <BrandButton
            testId="mobile-connect-create-link"
            type="button"
            variant="secondary"
            isDisabled={linkBusy}
            onClick={() => {
              void openInternetLink();
            }}
          >
            {t(I18nKey.SETTINGS$MOBILE_CREATE_LINK)}
          </BrandButton>

          <BrandButton
            testId="mobile-connect-show-qr"
            type="button"
            variant="primary"
            isDisabled={hostUnreachable || linkBusy || !host}
            onClick={() => {
              void onShowQr();
            }}
          >
            {t(I18nKey.SETTINGS$MOBILE_SHOW_QR)}
          </BrandButton>

          {qrError ? <p className="text-sm text-red-400">{qrError}</p> : null}

          {qrDataUrl ? (
            <div className="flex flex-col items-start gap-3">
              <img
                data-testid="mobile-connect-qr"
                src={qrDataUrl}
                alt={t(I18nKey.SETTINGS$MOBILE_QR_ALT)}
                className="rounded-lg bg-white p-2"
              />
              <p className="text-sm text-[var(--oh-text-tertiary)]">
                {t(I18nKey.SETTINGS$MOBILE_QR_HINT)}
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default MobileSettingsScreen;
