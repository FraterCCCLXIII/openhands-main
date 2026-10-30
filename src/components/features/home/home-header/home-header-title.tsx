import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography } from "#/ui/typography";
import { I18nKey } from "#/i18n/declaration";
import { HomeDashboardSection } from "../home-dashboard-section";
import { HomeLearnResources } from "./home-learn-resources";

/** Welcome-back lines; one is picked at random on every page load. */
const WELCOME_BACK_MESSAGES = [
  "Welcome back!",
  "Good to see you again!",
  "Ready when you are.",
  "Nice to have you back!",
  "Let's pick up where you left off.",
];

/** Extra subtitle lines, shuffled in alongside the translated subheader. */
const SUBTITLE_MESSAGES = [
  "Bugs fear you. Let's get to work.",
  "Small steps, big commits. What are we building?",
  "Your codebase called. It wants a little attention.",
  "Tests are optional. Confidence is not. Let's go.",
  "Every great app started as a blank prompt.",
  "Ship something good today.",
];

/** Same pace as the composer placeholder typewriter (1.1s across the text). */
const TYPE_DURATION_MS = 1100;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function pickWelcomeBackMessage() {
  const index = Math.floor(Math.random() * WELCOME_BACK_MESSAGES.length);
  return WELCOME_BACK_MESSAGES[index];
}

/** Reveals `text` one character at a time, like the composer placeholder. */
function useTypedText(text: string): string {
  const [count, setCount] = useState(() =>
    prefersReducedMotion() ? text.length : 0,
  );

  useEffect(() => {
    if (count >= text.length) return undefined;
    const timer = window.setTimeout(
      () => setCount((current) => current + 1),
      TYPE_DURATION_MS / text.length,
    );
    return () => window.clearTimeout(timer);
  }, [count, text]);

  return text.slice(0, count);
}

function WelcomeBackHeading({ message }: { message: string }) {
  const typed = useTypedText(message);

  // The full line sits in the grid cell invisibly so the centered heading does
  // not shift while the characters appear.
  return (
    <span className="inline-grid justify-items-center">
      <span className="invisible col-start-1 row-start-1">{message}</span>
      <span
        aria-hidden="true"
        data-testid="home-welcome-message"
        className="col-start-1 row-start-1 animate-[placeholder-fade_400ms_ease-out_0.15s_both] text-left"
      >
        {typed}
      </span>
    </span>
  );
}

export function HomeHeaderTitle() {
  const { t } = useTranslation("openhands");
  const [welcomeMessage] = useState(pickWelcomeBackMessage);
  const [subtitle] = useState(() => {
    const options = [
      t(I18nKey.HOME$ENGINEERING_TASKS_SUBHEADER),
      ...SUBTITLE_MESSAGES,
    ];
    return options[Math.floor(Math.random() * options.length)];
  });

  return (
    <div className="flex w-full flex-col items-center gap-2 py-2">
      <Typography.H1 className="w-full text-center leading-normal">
        <span className="sr-only">{t(I18nKey.HOME$WHAT_TO_WORK_ON)}</span>
        <WelcomeBackHeading message={welcomeMessage} />
      </Typography.H1>
      <p data-testid="home-header-subtitle" className="text-center text-muted">
        {subtitle}
      </p>
      <div className="mt-3 flex w-full justify-center">
        <HomeDashboardSection id="learnResources">
          <HomeLearnResources />
        </HomeDashboardSection>
      </div>
    </div>
  );
}
