import React from "react";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { SiApple, SiOpenai } from "react-icons/si";
import OpenHandsLogo from "#/assets/branding/openhands-logo.svg?react";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import {
  MODAL_MAX_WIDTH_VIEWPORT,
  modalWidthClassName,
} from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import { OPENHANDS_I18N_NAMESPACE } from "#/i18n";
import { cn } from "#/utils/utils";

export type LoginMethod =
  | "chatgpt"
  | "google"
  | "apple"
  | "microsoft"
  | "email";

interface LoginModalProps {
  /** Called with the sign-in method the user picked. */
  onSignIn?: (method: LoginMethod) => void;
  /** Called when the user skips connecting an account (or dismisses the modal). */
  onSkip: () => void;
}

const OPTION_BASE_CLASS =
  "flex h-12 w-full items-center justify-center gap-3 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

const OUTLINE_OPTION_CLASS = cn(
  OPTION_BASE_CLASS,
  "border border-neutral-400 bg-white text-neutral-900 hover:bg-neutral-100",
);

function MicrosoftMark() {
  return (
    <svg width={20} height={20} viewBox="0 0 23 23" aria-hidden>
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

/**
 * White account-connect modal that offers each sign-in method, with a skip
 * action at the bottom. Presentational only: the caller decides what each
 * method does via `onSignIn`.
 */
export function LoginModal({ onSignIn, onSkip }: LoginModalProps) {
  const { t, ready } = useTranslation(OPENHANDS_I18N_NAMESPACE);

  if (!ready) return null;

  const handleSignIn = (method: LoginMethod) => () => onSignIn?.(method);

  return (
    <ModalBackdrop onClose={onSkip} aria-label={t(I18nKey.BRANDING$OPENHANDS)}>
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-3xl bg-white p-8 shadow-xl",
          modalWidthClassName("sm"),
          MODAL_MAX_WIDTH_VIEWPORT,
        )}
      >
        <OpenHandsLogo
          width={40}
          height={40}
          className="text-neutral-900 [&_path:not([fill=transparent])]:fill-current"
          aria-hidden
        />

        <button
          type="button"
          onClick={handleSignIn("chatgpt")}
          className={cn(
            OPTION_BASE_CLASS,
            "bg-neutral-900 text-white hover:bg-neutral-800",
          )}
        >
          <SiOpenai size={20} aria-hidden />
          {t(I18nKey.LOGIN$SIGN_IN_WITH_CHATGPT)}
        </button>
        <p className="text-center text-sm text-neutral-500 text-pretty">
          {t(I18nKey.LOGIN$CHATGPT_DESCRIPTION)}
        </p>

        <div className="flex w-full items-center gap-3 text-sm text-neutral-500">
          <span className="h-px flex-1 bg-neutral-200" />
          {t(I18nKey.LOGIN$OR)}
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <button
          type="button"
          onClick={handleSignIn("google")}
          className={OUTLINE_OPTION_CLASS}
        >
          <FcGoogle size={20} aria-hidden />
          {t(I18nKey.LOGIN$SIGN_IN_WITH_GOOGLE)}
        </button>
        <button
          type="button"
          onClick={handleSignIn("apple")}
          className={OUTLINE_OPTION_CLASS}
        >
          <SiApple size={18} aria-hidden />
          {t(I18nKey.LOGIN$SIGN_IN_WITH_APPLE)}
        </button>
        <button
          type="button"
          onClick={handleSignIn("microsoft")}
          className={OUTLINE_OPTION_CLASS}
        >
          <MicrosoftMark />
          {t(I18nKey.LOGIN$SIGN_IN_WITH_MICROSOFT)}
        </button>
        <button
          type="button"
          onClick={handleSignIn("email")}
          className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <Mail size={16} aria-hidden />
          {t(I18nKey.LOGIN$CONTINUE_WITH_EMAIL)}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="mt-2 text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
        >
          {t(I18nKey.LOGIN$SKIP_ACCOUNT_CONNECT)}
        </button>
      </div>
    </ModalBackdrop>
  );
}
