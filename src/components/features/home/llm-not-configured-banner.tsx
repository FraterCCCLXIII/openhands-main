import { useTranslation } from "react-i18next";
import { FaHand } from "react-icons/fa6";
import { I18nKey } from "#/i18n/declaration";
import { useNavigation } from "#/context/navigation-context";
import { useLlmConfigured } from "#/hooks/use-llm-configured";
import { BrandButton } from "#/components/features/settings/brand-button";
import { Typography } from "#/ui/typography";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { BANNER_SURFACE_CLASSNAME } from "#/components/shared/banner-surface";

/**
 * Warns the user on the home screen when the active agent has no usable LLM —
 * most notably after they skip onboarding, which persists no settings. Offers
 * a single action that routes to LLM settings so the failure is communicated
 * up front instead of surfacing only when a conversation attempt errors out.
 *
 * Renders nothing while settings load (avoids a flash) or once the LLM is
 * configured; the settings query refetches after a key is saved, so the banner
 * unmounts on its own.
 */
// @spec WN-001 — Home no-LLM warning icon uses theme-aware warning feedback
export function LlmNotConfiguredBanner() {
  const { t } = useTranslation("openhands");
  const { navigate } = useNavigation();
  const { isConfigured, isLoading } = useLlmConfigured();

  if (isLoading || isConfigured) {
    return null;
  }

  return (
    <div
      data-testid="home-llm-not-configured-banner"
      role="alert"
      className={`${BANNER_SURFACE_CLASSNAME} justify-between`}
    >
      <div className="flex min-w-0 items-start sm:items-center">
        <div className="flex-shrink-0">
          <FaHand size={12} className="align-middle text-muted" aria-hidden />
        </div>
        <Typography.Text className="ml-3 text-sm font-medium">
          {t(I18nKey.HOME$LLM_NOT_CONFIGURED_MESSAGE)}
        </Typography.Text>
      </div>

      {/* Locked-to-Cloud blocks the Canvas LLM page (OHE-3457). */}
      {getLockedCloudHost() === null && (
        <BrandButton
          testId="home-llm-not-configured-action"
          type="button"
          variant="primary"
          className="h-6 min-h-0 w-fit shrink-0 whitespace-nowrap rounded-md"
          onClick={() => navigate("/settings/llm")}
        >
          {t(I18nKey.HOME$LLM_NOT_CONFIGURED_ACTION)}
        </BrandButton>
      )}
    </div>
  );
}
