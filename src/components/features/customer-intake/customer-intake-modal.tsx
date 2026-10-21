import React from "react";
import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  FolderGit2,
  Monitor,
  Smartphone,
  Users,
} from "lucide-react";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalCloseButton } from "#/components/shared/modals/modal-close-button";
import { I18nKey } from "#/i18n/declaration";
import {
  type CustomerCompanySize,
  type CustomerCompanyType,
  type CustomerIntakeAction,
  useTracking,
} from "#/hooks/use-tracking";
import {
  CUSTOMER_INTAKE_COMPANY_SIZES,
  CUSTOMER_INTAKE_COMPANY_TYPES,
  CUSTOMER_INTAKE_DISMISSED_STORAGE_KEY,
  OPENHANDS_DESKTOP_DOWNLOAD_URL,
  OPENHANDS_MOBILE_APP_URL,
  OPENHANDS_PRICING_URL,
  OPENHANDS_REPO_URL,
} from "./customer-intake.constants";

const SIZE_LABEL_KEYS: Record<CustomerCompanySize, I18nKey> = {
  solo: I18nKey.CUSTOMER_INTAKE$SIZE_SOLO,
  "2_10": I18nKey.CUSTOMER_INTAKE$SIZE_2_10,
  "11_50": I18nKey.CUSTOMER_INTAKE$SIZE_11_50,
  "51_200": I18nKey.CUSTOMER_INTAKE$SIZE_51_200,
  "201_1000": I18nKey.CUSTOMER_INTAKE$SIZE_201_1000,
  "1000_plus": I18nKey.CUSTOMER_INTAKE$SIZE_1000_PLUS,
};

const TYPE_LABEL_KEYS: Record<CustomerCompanyType, I18nKey> = {
  startup: I18nKey.CUSTOMER_INTAKE$TYPE_STARTUP,
  agency: I18nKey.CUSTOMER_INTAKE$TYPE_AGENCY,
  enterprise: I18nKey.CUSTOMER_INTAKE$TYPE_ENTERPRISE,
  education: I18nKey.CUSTOMER_INTAKE$TYPE_EDUCATION,
  nonprofit: I18nKey.CUSTOMER_INTAKE$TYPE_NONPROFIT,
  government: I18nKey.CUSTOMER_INTAKE$TYPE_GOVERNMENT,
  other: I18nKey.CUSTOMER_INTAKE$TYPE_OTHER,
};

const DOWNLOAD_ROWS: {
  action: CustomerIntakeAction;
  url: string;
  icon: typeof Monitor;
  titleKey: I18nKey;
  descriptionKey: I18nKey;
}[] = [
  {
    action: "download_repo",
    url: OPENHANDS_REPO_URL,
    icon: FolderGit2,
    titleKey: I18nKey.CUSTOMER_INTAKE$REPO_TITLE,
    descriptionKey: I18nKey.CUSTOMER_INTAKE$REPO_DESCRIPTION,
  },
  {
    action: "download_desktop",
    url: OPENHANDS_DESKTOP_DOWNLOAD_URL,
    icon: Monitor,
    titleKey: I18nKey.CUSTOMER_INTAKE$DESKTOP_TITLE,
    descriptionKey: I18nKey.CUSTOMER_INTAKE$DESKTOP_DESCRIPTION,
  },
  {
    action: "get_mobile_app",
    url: OPENHANDS_MOBILE_APP_URL,
    icon: Smartphone,
    titleKey: I18nKey.CUSTOMER_INTAKE$MOBILE_TITLE,
    descriptionKey: I18nKey.CUSTOMER_INTAKE$MOBILE_DESCRIPTION,
  },
];

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function readDismissed(): boolean {
  try {
    return (
      window.localStorage.getItem(CUSTOMER_INTAKE_DISMISSED_STORAGE_KEY) ===
      "true"
    );
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(CUSTOMER_INTAKE_DISMISSED_STORAGE_KEY, "true");
  } catch {
    // Storage is unavailable, so the modal may reappear on the next visit.
  }
}

interface CustomerIntakeModalProps {
  onClose: () => void;
}

/**
 * Two-step customer intake: a details form that feeds Datadog-backed tracking,
 * then a final step that points to the repo, desktop app, mobile app, and the
 * Teams pricing page.
 */
export function CustomerIntakeModal({ onClose }: CustomerIntakeModalProps) {
  const { t } = useTranslation("openhands");
  const { trackCustomerIntakeSubmitted, trackCustomerIntakeActionClicked } =
    useTracking();
  const [isFinalStep, setIsFinalStep] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [companySize, setCompanySize] = React.useState<
    CustomerCompanySize | ""
  >("");
  const [companyType, setCompanyType] = React.useState<
    CustomerCompanyType | ""
  >("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companySize || !companyType) return;

    trackCustomerIntakeSubmitted({
      name: name.trim() || undefined,
      email: email.trim(),
      companySize,
      companyType,
    });
    setIsFinalStep(true);
  };

  return (
    <ModalBackdrop
      onClose={onClose}
      aria-label={t(I18nKey.CUSTOMER_INTAKE$ARIA_LABEL)}
    >
      <section className="relative flex w-130 max-w-[90vw] flex-col gap-5 rounded-3xl border border-border bg-base-secondary p-6 shadow-xl">
        <ModalCloseButton onClose={onClose} testId="customer-intake-close" />

        {isFinalStep ? (
          <>
            <header className="flex flex-col gap-1 pr-8">
              <h2 className="text-base font-semibold leading-6 text-contrast">
                {t(I18nKey.CUSTOMER_INTAKE$GET_TITLE)}
              </h2>
              <p className="text-sm text-[var(--oh-text)]">
                {t(I18nKey.CUSTOMER_INTAKE$GET_DESCRIPTION)}
              </p>
            </header>

            <ul className="flex flex-col gap-2">
              {DOWNLOAD_ROWS.map(
                ({ action, url, icon: Icon, titleKey, descriptionKey }) => (
                  <li key={action}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackCustomerIntakeActionClicked({ action })
                      }
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-foreground transition-colors hover:bg-interactive-hover"
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium">
                          {t(titleKey)}
                        </span>
                        <span className="text-xs text-[var(--oh-text)]">
                          {t(descriptionKey)}
                        </span>
                      </span>
                      <ExternalLink className="size-4 shrink-0" aria-hidden />
                    </a>
                  </li>
                ),
              )}
            </ul>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-5 shrink-0" aria-hidden />
                <p className="text-sm text-[var(--oh-text)]">
                  {t(I18nKey.CUSTOMER_INTAKE$TEAMS_DESCRIPTION)}
                </p>
              </div>
              <a
                href={OPENHANDS_PRICING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackCustomerIntakeActionClicked({ action: "add_teams" })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
              >
                {t(I18nKey.CUSTOMER_INTAKE$ADD_TEAMS)}
                <ExternalLink className="size-4 shrink-0" aria-hidden />
              </a>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm text-[var(--oh-text)] transition-colors hover:bg-interactive-hover hover:text-foreground"
              >
                {t(I18nKey.CUSTOMER_INTAKE$MAYBE_LATER)}
              </button>
            </div>
          </>
        ) : (
          <>
            <header className="flex flex-col gap-1 pr-8">
              <h2 className="text-base font-semibold leading-6 text-contrast">
                {t(I18nKey.CUSTOMER_INTAKE$TITLE)}
              </h2>
              <p className="text-sm text-[var(--oh-text)]">
                {t(I18nKey.CUSTOMER_INTAKE$DESCRIPTION)}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm text-foreground">
                {t(I18nKey.CUSTOMER_INTAKE$NAME_LABEL)}
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-foreground">
                {t(I18nKey.CUSTOMER_INTAKE$EMAIL_LABEL)}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-foreground">
                {t(I18nKey.CUSTOMER_INTAKE$COMPANY_SIZE_LABEL)}
                <select
                  name="companySize"
                  required
                  value={companySize}
                  onChange={(event) =>
                    setCompanySize(event.target.value as CustomerCompanySize)
                  }
                  className={FIELD_CLASS}
                >
                  <option value="" disabled>
                    {t(I18nKey.CUSTOMER_INTAKE$SELECT_PLACEHOLDER)}
                  </option>
                  {CUSTOMER_INTAKE_COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {t(SIZE_LABEL_KEYS[size])}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-foreground">
                {t(I18nKey.CUSTOMER_INTAKE$COMPANY_TYPE_LABEL)}
                <select
                  name="companyType"
                  required
                  value={companyType}
                  onChange={(event) =>
                    setCompanyType(event.target.value as CustomerCompanyType)
                  }
                  className={FIELD_CLASS}
                >
                  <option value="" disabled>
                    {t(I18nKey.CUSTOMER_INTAKE$SELECT_PLACEHOLDER)}
                  </option>
                  {CUSTOMER_INTAKE_COMPANY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(TYPE_LABEL_KEYS[type])}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-2 text-sm text-[var(--oh-text)] transition-colors hover:bg-interactive-hover hover:text-foreground"
                >
                  {t(I18nKey.CUSTOMER_INTAKE$SKIP)}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
                >
                  {t(I18nKey.CUSTOMER_INTAKE$CONTINUE)}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </ModalBackdrop>
  );
}

/**
 * Presents the customer intake modal once per browser. Closing it, by skipping
 * or submitting, remembers the choice so it does not reappear.
 */
export function CustomerIntakeHost() {
  const [isOpen, setIsOpen] = React.useState(() => !readDismissed());

  if (!isOpen) return null;

  const handleClose = () => {
    writeDismissed();
    setIsOpen(false);
  };

  return <CustomerIntakeModal onClose={handleClose} />;
}
