import React from "react";
import { useTranslation } from "react-i18next";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { useActiveBackend } from "#/contexts/active-backend-context";
import type { Backend } from "#/api/backend-registry/types";
import { useSaveSettings } from "#/hooks/mutation/use-save-settings";
import { useBackendsHealth } from "#/hooks/query/use-backends-health";
import { useSettings } from "#/hooks/query/use-settings";
import { I18nKey } from "#/i18n/declaration";
import { OPENHANDS_I18N_NAMESPACE } from "#/i18n";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import OpenHandsLogoWhite from "#/assets/branding/openhands-logo-white.svg?react";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { BrandButton } from "#/components/features/settings/brand-button";
import { setTelemetryConsent } from "#/services/telemetry";
import { useNavigation } from "#/context/navigation-context";
import { AGENT_CANVAS_CLIENT_VERSION } from "#/api/client-source";

/** Matches `--duration-motion-base` in tailwind.css (the modal exit). */
const CONSENT_EXIT_MS = 200;

/** Browser-local flag set by "Do not show again"; hides the prompt on reloads. */
const CONSENT_PROMPT_DISMISSED_STORAGE_KEY =
  "openhands-telemetry-consent-prompt-dismissed";

function readConsentPromptDismissed(): boolean {
  try {
    return (
      window.localStorage.getItem(CONSENT_PROMPT_DISMISSED_STORAGE_KEY) ===
      "true"
    );
  } catch {
    return false;
  }
}

function writeConsentPromptDismissed(): void {
  try {
    window.localStorage.setItem(CONSENT_PROMPT_DISMISSED_STORAGE_KEY, "true");
  } catch {
    // Storage can be unavailable (private windows, blocked site data).
  }
}

interface TelemetryConsentBannerProps {
  onChoice?: (granted: boolean) => void;
}

function LocalTelemetryConsentBanner({
  backend,
  onChoice,
}: TelemetryConsentBannerProps & {
  backend: Backend;
}) {
  const { t, ready } = useTranslation(OPENHANDS_I18N_NAMESPACE);
  const { navigate } = useNavigation();
  const health = useBackendsHealth([backend]);
  const isBackendConnected = health[backend.id]?.isConnected === true;
  const { data: settings, isSuccess: hasLoadedSettings } = useSettings();
  const { mutateAsync: saveSettings, isPending: isSavingSettings } =
    useSaveSettings();
  const [isReady, setIsReady] = React.useState(false);
  const [hasSubmittedChoice, setHasSubmittedChoice] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isPromptDismissed] = React.useState(readConsentPromptDismissed);

  React.useEffect(() => {
    setHasSubmittedChoice(false);
    setIsClosing(false);
  }, [backend.id]);

  const shouldShow =
    isBackendConnected &&
    hasLoadedSettings &&
    settings?.user_consents_to_analytics === null &&
    !hasSubmittedChoice &&
    !isPromptDismissed;

  React.useEffect(() => {
    if (ready && shouldShow) {
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    }
    setIsReady(false);
    return undefined;
  }, [ready, shouldShow]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const granted = formData.get("analytics") === "on";
    const doNotShowAgain = formData.get("doNotShowAgain") === "on";

    try {
      await saveSettings({ user_consents_to_analytics: granted });
    } catch {
      return;
    }

    if (doNotShowAgain) writeConsentPromptDismissed();

    // Play the exit animation before the banner unmounts; the saved settings
    // flip `shouldShow` off right away, so `isClosing` keeps it mounted.
    setIsClosing(true);
    await new Promise((resolve) => setTimeout(resolve, CONSENT_EXIT_MS));
    setHasSubmittedChoice(true);
    // Unmount after the exit animation; `shouldShow` is already false.
    setIsClosing(false);
    await setTelemetryConsent(granted ? "granted" : "denied");
    onChoice?.(granted);
  };

  if (!isClosing && (!shouldShow || !isReady)) return null;

  return (
    <ModalBackdrop
      elevated
      exiting={isClosing}
      aria-label={t(I18nKey.TELEMETRY$CONSENT_TITLE)}
    >
      <form
        data-testid="telemetry-consent-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-2"
      >
        <ModalBody className="border border-border">
          <span
            data-testid="telemetry-consent-logo"
            className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-border bg-[linear-gradient(180deg,rgb(38_38_38),rgb(0_0_0))] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_6px_16px_-6px_rgb(0_0_0/0.6)]"
          >
            <OpenHandsLogoWhite
              width={40}
              height={40}
              className="text-contrast [&_path:not([fill=transparent])]:fill-current"
              aria-hidden
            />
          </span>
          <div className="flex items-baseline justify-center gap-2">
            <BaseModalTitle title={t(I18nKey.ONBOARDING$TITLE)} />
            <p
              data-testid="telemetry-consent-version"
              className="text-xs text-muted tabular-nums"
            >
              {`v${AGENT_CANVAS_CLIENT_VERSION}`}
            </p>
          </div>
          <p className="text-center text-pretty text-sm font-medium text-muted">
            {t(I18nKey.TELEMETRY$CONSENT_TITLE)}
          </p>
          <div className="w-full rounded-xl border border-border-subtle bg-surface-raised px-3 py-2">
            <p className="text-xs text-contrast">
              {t(I18nKey.TELEMETRY$BACKEND_SCOPE, {
                name: backend.name,
                host: backend.host,
              })}
            </p>
          </div>

          <div className="flex w-full flex-col gap-1">
            <div className="flex w-full items-center justify-between gap-3">
              <label className="flex gap-2 items-center self-start text-sm cursor-pointer">
                <input
                  name="analytics"
                  type="checkbox"
                  defaultChecked
                  className="oh-checkbox"
                />
                {t(I18nKey.TELEMETRY$SEND_ANONYMOUS_DATA)}
              </label>
              <BrandButton
                testId="telemetry-review-settings"
                type="button"
                variant="secondary"
                className="h-7 min-h-0 rounded-md px-3 text-xs"
                onClick={() => navigate("/settings")}
              >
                {t(I18nKey.SETUP$REVIEW_TITLE)}
              </BrandButton>
            </div>
            <p className="pl-6 text-xs text-muted">
              {t(I18nKey.TELEMETRY$CONSENT_DESCRIPTION)}{" "}
              <a
                href="https://docs.openhands.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {t(I18nKey.TELEMETRY$REVIEW_SECURITY)}
              </a>
            </p>
          </div>

          <label className="flex gap-2 items-center self-start text-sm cursor-pointer">
            <input
              name="doNotShowAgain"
              type="checkbox"
              defaultChecked
              className="oh-checkbox"
            />
            {t(I18nKey.TELEMETRY$DO_NOT_SHOW_AGAIN)}
          </label>

          <BrandButton
            testId="confirm-telemetry-preferences"
            type="submit"
            variant="primary"
            className="w-full"
            isDisabled={isSavingSettings}
          >
            {t(I18nKey.BUTTON$CONTINUE)}
          </BrandButton>
        </ModalBody>
      </form>
    </ModalBackdrop>
  );
}

export function TelemetryConsentBanner({
  onChoice,
}: TelemetryConsentBannerProps) {
  const { backend } = useActiveBackend();

  if (getLockedCloudHost() !== null || backend.kind !== "local") return null;

  return <LocalTelemetryConsentBanner backend={backend} onChoice={onChoice} />;
}
