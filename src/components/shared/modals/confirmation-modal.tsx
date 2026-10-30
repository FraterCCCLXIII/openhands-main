import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { BrandButton } from "#/components/features/settings/brand-button";
import { modalTitleSmClassName } from "#/utils/modal-classes";
import { ModalBackdrop } from "./modal-backdrop";

interface ConfirmationModalProps {
  text: string;
  /** Optional heading above the text. */
  title?: string;
  /** Optional icon drawn in a tile beside the heading. */
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  /**
   * Disables both action buttons while an asynchronous confirm
   * mutation is in flight. Defaults to false to preserve existing
   * call sites that don't track mutation state.
   */
  isConfirming?: boolean;
}

export function ConfirmationModal({
  text,
  title,
  icon,
  onConfirm,
  onCancel,
  confirmText,
  isConfirming = false,
}: ConfirmationModalProps) {
  const { t } = useTranslation("openhands");
  // Suppress the backdrop's click / Escape close handler while the
  // confirm mutation is in flight; otherwise the user could dismiss
  // the modal mid-request and never see the result (the buttons are
  // already disabled, but the backdrop wasn't).
  return (
    <ModalBackdrop
      onClose={isConfirming ? undefined : onCancel}
      closeOnEscape={!isConfirming}
    >
      <div
        data-testid="confirmation-modal"
        className="modal-surface-gradient flex w-full max-w-md flex-col gap-5 rounded-3xl border border-border bg-base-secondary p-6 shadow-2xl"
      >
        {title || icon ? (
          <div className="flex items-center gap-3">
            {icon ? (
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-contrast"
              >
                {icon}
              </span>
            ) : null}
            {title ? <h2 className={modalTitleSmClassName}>{title}</h2> : null}
          </div>
        ) : null}
        <p className="text-sm leading-6 text-tertiary-light">{text}</p>
        <div className="w-full flex justify-end gap-2">
          <BrandButton
            testId="cancel-button"
            type="button"
            onClick={onCancel}
            variant="secondary"
            isDisabled={isConfirming}
          >
            {t(I18nKey.BUTTON$CANCEL)}
          </BrandButton>
          <BrandButton
            testId="confirm-button"
            type="button"
            onClick={onConfirm}
            variant="primary"
            isDisabled={isConfirming}
          >
            {confirmText ?? t(I18nKey.BUTTON$CONFIRM)}
          </BrandButton>
        </div>
      </div>
    </ModalBackdrop>
  );
}
