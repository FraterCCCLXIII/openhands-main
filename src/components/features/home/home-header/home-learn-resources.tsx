import { useTranslation } from "react-i18next";
import { BookOpen, GitBranch, MessageSquare } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";

/**
 * Public OpenHands resources shown under the home title. Add the YouTube
 * channel here once its URL is set.
 */
const LEARN_RESOURCES = [
  {
    key: "docs",
    label: I18nKey.SIDEBAR$DOCS,
    href: "https://docs.openhands.dev/",
    Icon: BookOpen,
  },
  {
    key: "slack",
    label: I18nKey.SETTINGS$SLACK,
    href: "https://openhands.dev/joinslack",
    Icon: MessageSquare,
  },
  {
    key: "github",
    label: I18nKey.SETTINGS$GITHUB,
    href: "https://github.com/OpenHands/OpenHands",
    Icon: GitBranch,
  },
] as const;

export function HomeLearnResources() {
  const { t } = useTranslation("openhands");

  return (
    <div
      data-testid="home-learn-resources"
      className="flex flex-col items-center gap-3 pb-3"
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        {LEARN_RESOURCES.map(({ key, label, href, Icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`home-learn-resource-${key}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-interactive-hover"
          >
            <Icon className="size-4" aria-hidden />
            {t(label)}
          </a>
        ))}
      </div>
    </div>
  );
}
