import { useTranslation } from "react-i18next";
import { Power } from "lucide-react";
import { NavigationLink } from "#/components/shared/navigation-link";
import { I18nKey } from "#/i18n/declaration";

interface AppTurnedOffPageProps {
  /** Display name of the app. */
  name: string;
  /** "off": installed or built in but switched off. "missing": not installed. */
  reason?: "off" | "missing";
}

// @spec CE-010 — A route for an app that is off or missing explains itself
/**
 * What a route shows when its app is switched off (or an extension is not
 * installed): a clear explanation and a link to where it is turned on, rather
 * than a 404. The app's data is untouched; turning it back on restores it.
 */
export function AppTurnedOffPage({
  name,
  reason = "off",
}: AppTurnedOffPageProps) {
  const { t } = useTranslation("openhands");
  const isMissing = reason === "missing";

  return (
    <main
      data-testid="app-turned-off-page"
      className="flex h-full flex-col items-center justify-center px-6 py-20 text-center"
    >
      <Power className="size-12 text-muted" aria-hidden />
      <h1 className="mt-4 text-sm font-medium text-contrast">
        {t(
          isMissing
            ? I18nKey.BUILT_IN_APPS$NOT_INSTALLED_TITLE
            : I18nKey.BUILT_IN_APPS$TURNED_OFF_TITLE,
          { name },
        )}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t(
          isMissing
            ? I18nKey.BUILT_IN_APPS$NOT_INSTALLED_MESSAGE
            : I18nKey.BUILT_IN_APPS$TURNED_OFF_MESSAGE,
        )}
      </p>
      <NavigationLink
        to="/apps"
        data-testid="app-turned-off-link"
        className="mt-6 rounded-md border border-border px-3 py-1.5 text-sm text-contrast transition-colors hover:bg-surface-raised"
      >
        {t(I18nKey.BUILT_IN_APPS$OPEN_APPS)}
      </NavigationLink>
    </main>
  );
}
