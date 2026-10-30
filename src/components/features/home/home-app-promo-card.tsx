import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Smartphone, X } from "lucide-react";
import { useCanvasExtensionsRuntime } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { I18nKey } from "#/i18n/declaration";
import {
  HOME_APP_PROMO_DISMISSED_STORAGE_KEY,
  HOME_APP_PROMO_EXTENSION_NAME,
} from "./home-app-promo.constants";

function readDismissed(): boolean {
  try {
    return (
      window.localStorage.getItem(HOME_APP_PROMO_DISMISSED_STORAGE_KEY) ===
      "true"
    );
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(HOME_APP_PROMO_DISMISSED_STORAGE_KEY, "true");
  } catch {
    // Storage is unavailable, so the card stays hidden only for this view.
  }
}

/**
 * Floating promo for the phone app, pinned to the bottom-left of the home
 * screen. Dismissal is remembered per browser.
 */
function HomeAppPromo({ href }: { href: string }) {
  const { t } = useTranslation("openhands");
  const [isDismissed, setIsDismissed] = useState(readDismissed);

  if (isDismissed) return null;

  const handleDismiss = () => {
    writeDismissed();
    setIsDismissed(true);
  };

  return (
    <aside
      data-testid="home-app-promo"
      aria-label={t(I18nKey.HOME$PHONE_APP_TITLE)}
      className="absolute bottom-4 left-4 z-10 flex w-72 items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-lg"
    >
      <div
        aria-hidden
        className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-background"
      >
        <Smartphone className="size-7" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            {t(I18nKey.HOME$PHONE_APP_TITLE)}
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t(I18nKey.HOME$PHONE_APP_DISMISS_LABEL)}
            className="-mt-1 -mr-1 rounded-md p-1 text-[var(--oh-text-secondary)] transition-colors hover:bg-interactive-hover hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <Link
          to={href}
          className="inline-flex w-fit items-center rounded-md bg-interactive-hover px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-border"
        >
          {t(I18nKey.HOME$PHONE_APP_GET_APP)}
        </Link>
      </div>
    </aside>
  );
}

/**
 * Shown only while the Mobile app extension page is registered in the
 * extension runtime (installed, enabled and activated). The runtime exposes
 * no pages while the extension list loads or on backends without extensions,
 * so the card stays hidden and no dismissal state is read until it can show.
 */
export function HomeAppPromoCard() {
  const { pages } = useCanvasExtensionsRuntime();
  const page = pages.find(
    (entry) => entry.extension.name === HOME_APP_PROMO_EXTENSION_NAME,
  );
  if (!page) return null;
  return <HomeAppPromo href={page.href} />;
}
