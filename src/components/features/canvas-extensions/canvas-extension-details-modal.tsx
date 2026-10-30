import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";
import { canvasExtensionBannerUrl } from "#/utils/canvas-extension-banner";
import { extensionModuleCardPillClassName } from "#/utils/extension-module-card-classes";
import { CanvasExtensionIcon } from "./canvas-extension-icon";

const CANVAS_EXTENSIONS_DOCS_URL =
  "https://docs.openhands.dev/openhands/usage/agent-canvas/canvas-extensions";

interface CanvasExtensionDetailsModalProps {
  extension: InstalledCanvasExtensionInfo;
  openHref?: string | null;
  onOpen: () => void;
  onClose: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold text-contrast">{title}</h4>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  const { t } = useTranslation("openhands");
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="break-words text-sm text-contrast">
        {value || (
          <span className="text-muted">
            {t(I18nKey.SETTINGS$APPS_DETAILS_NOT_PROVIDED)}
          </span>
        )}
      </dd>
    </div>
  );
}

function LinkOut({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-contrast underline underline-offset-2 hover:opacity-80"
    >
      {label}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

/** Everything known about an installed app: usage, installation, details and where to get help. */
export function CanvasExtensionDetailsModal({
  extension,
  openHref,
  onOpen,
  onClose,
}: CanvasExtensionDetailsModalProps) {
  const { t } = useTranslation("openhands");
  const manifest = extension.manifest;
  const displayName = manifest?.display_name || extension.name;
  const description = extension.description || manifest?.description;
  const pages = manifest?.contributes?.pages ?? [];
  const installed = Number.isNaN(Date.parse(extension.installed_at))
    ? extension.installed_at
    : new Date(extension.installed_at).toLocaleString();
  const source = [extension.source, extension.requested_ref]
    .filter(Boolean)
    .join(" @ ");

  return (
    <ModalBackdrop onClose={onClose} aria-label={displayName}>
      <ModalBody
        testID={`canvas-extension-details-${extension.name}`}
        width="xl"
        className="max-h-[90vh] w-full max-w-3xl items-stretch gap-0 overflow-hidden p-0"
      >
        <div
          className="relative flex h-36 shrink-0 items-end bg-(image:--banner-url) bg-cover bg-center px-6 pb-4"
          style={
            {
              "--banner-url": `url("${canvasExtensionBannerUrl(extension.name)}")`,
            } as React.CSSProperties
          }
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 to-black/10" />
          <div className="relative flex items-end gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-linear-to-b from-white/20 to-white/5 inset-shadow-xs inset-shadow-white/40 shadow-md shadow-black/20 ring-1 ring-white/10">
              <CanvasExtensionIcon extension={extension} size={36} />
            </div>
            <div className="min-w-0 pb-1">
              <h3 className="truncate text-xl font-semibold text-white">
                {displayName}
              </h3>
              <p className="text-xs text-white/70">
                v{extension.version}
                {manifest?.author ? ` · ${manifest.author}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          <div className="flex flex-wrap gap-1.5">
            <span className={extensionModuleCardPillClassName}>
              {extension.enabled
                ? t(I18nKey.SETTINGS$SKILLS_ENABLED)
                : t(I18nKey.SETTINGS$SKILLS_DISABLED)}
            </span>
            <span className={extensionModuleCardPillClassName}>
              v{extension.version}
            </span>
            {pages.map((page) => (
              <span key={page.id} className={extensionModuleCardPillClassName}>
                {page.nav_label || page.title}
              </span>
            ))}
          </div>

          <Section title={t(I18nKey.SETTINGS$APPS_DETAILS_ABOUT)}>
            <p className="text-sm leading-relaxed text-tertiary-light">
              {description || t(I18nKey.SETTINGS$APPS_DETAILS_NOT_PROVIDED)}
            </p>
          </Section>

          <Section title={t(I18nKey.SETTINGS$APPS_DETAILS_USAGE)}>
            <p className="text-sm leading-relaxed text-tertiary-light">
              {t(I18nKey.SETTINGS$APPS_DETAILS_USAGE_BODY)}
            </p>
            {pages.length ? (
              <ul className="flex flex-col gap-1 text-sm text-contrast">
                {pages.map((page) => (
                  <li key={page.id} className="flex flex-col">
                    <span className="font-medium">
                      {page.title}
                      <span className="ml-2 font-mono text-xs text-muted">
                        {page.path}
                      </span>
                    </span>
                    {page.description ? (
                      <span className="text-xs text-muted">
                        {page.description}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section title={t(I18nKey.SETTINGS$APPS_DETAILS_INSTALL)}>
            <p className="text-sm leading-relaxed text-tertiary-light">
              {t(I18nKey.SETTINGS$APPS_DETAILS_INSTALL_BODY)}
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Fact
                label={t(I18nKey.SETTINGS$APPS_DETAILS_VERSION)}
                value={extension.version}
              />
              <Fact
                label={t(I18nKey.SETTINGS$APPS_DETAILS_INSTALLED)}
                value={installed}
              />
              <Fact
                label={t(I18nKey.SETTINGS$APPS_DETAILS_SOURCE)}
                value={source}
              />
              <Fact
                label={t(I18nKey.SETTINGS$APPS_DETAILS_LOCATION)}
                value={extension.install_path}
              />
            </dl>
          </Section>

          <Section title={t(I18nKey.SETTINGS$APPS_DETAILS)}>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Fact
                label={t(I18nKey.SETTINGS$APPS_DETAILS_AUTHOR)}
                value={manifest?.author}
              />
              <Fact
                label={t(I18nKey.SETTINGS$APPS_DETAILS_LICENSE)}
                value={manifest?.license}
              />
              <Fact
                label={t(I18nKey.SETTINGS$APPS_DETAILS_PAGES)}
                value={pages.length ? String(pages.length) : null}
              />
            </dl>
          </Section>

          <Section title={t(I18nKey.SETTINGS$APPS_DETAILS_SUPPORT)}>
            <p className="text-sm leading-relaxed text-tertiary-light">
              {t(I18nKey.SETTINGS$APPS_DETAILS_SUPPORT_BODY)}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {manifest?.homepage ? (
                <LinkOut
                  href={manifest.homepage}
                  label={t(I18nKey.SETTINGS$APPS_DETAILS_WEBSITE)}
                />
              ) : null}
              {manifest?.support_url ? (
                <LinkOut
                  href={manifest.support_url}
                  label={t(I18nKey.SETTINGS$APPS_DETAILS_SUPPORT_LINK)}
                />
              ) : null}
              <LinkOut
                href={CANVAS_EXTENSIONS_DOCS_URL}
                label={t(I18nKey.SETTINGS$APPS_DETAILS_DOCS)}
              />
            </div>
          </Section>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
          <BrandButton
            type="button"
            variant="secondary"
            testId="canvas-extension-details-close"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CLOSE)}
          </BrandButton>
          <BrandButton
            type="button"
            variant="primary"
            testId="canvas-extension-details-open"
            isDisabled={!openHref}
            onClick={onOpen}
          >
            {t(I18nKey.SETTINGS$APPS_OPEN)}
          </BrandButton>
        </footer>
      </ModalBody>
    </ModalBackdrop>
  );
}
