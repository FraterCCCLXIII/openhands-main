"use client";

import React from "react";

import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalFooterActionsClassName } from "@/src/components/ui/modal-shell";
import { PERMISSION_PROFILES_PAGE_COPY } from "@/src/constants/permission-profiles-page";
import { cn } from "@/src/lib/utils";
import { formControlFieldClassName } from "@/src/styles/form-control-classes";

interface SavePermissionsModalProps {
  onClose: () => void;
  onSave?: (profileName: string) => void;
  actionPending?: boolean;
}

export function SavePermissionsModal({
  onClose,
  onSave,
  actionPending = false,
}: SavePermissionsModalProps) {
  const [profileName, setProfileName] = React.useState("");
  const trimmedName = profileName.trim();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || actionPending) return;

    onSave?.(trimmedName);
  };

  return (
    <ModalBackdrop
      ariaLabel={PERMISSION_PROFILES_PAGE_COPY.saveModalAriaLabel}
      onClose={onClose}
    >
      <form
        data-testid="save-permissions-modal"
        onSubmit={handleSubmit}
        className={cn(
          "relative flex max-h-[85vh] w-[520px] max-w-[90vw] flex-col gap-4 overflow-y-auto",
          "rounded-xl border border-[var(--oh-border)] bg-base-secondary p-6 custom-scrollbar-always",
        )}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="save-permissions-modal-close"
        />

        <h2 className="pr-6 text-base font-semibold text-white">
          {PERMISSION_PROFILES_PAGE_COPY.saveModalTitle}
        </h2>

        <p className="text-sm leading-5 text-tertiary-light">
          {PERMISSION_PROFILES_PAGE_COPY.saveModalDescription}
        </p>

        <label className="flex w-full min-w-0 flex-col gap-2.5">
          <span className="text-sm">{PERMISSION_PROFILES_PAGE_COPY.profileNameLabel}</span>
          <input
            data-testid="save-permissions-profile-name"
            name="profile-name"
            placeholder={PERMISSION_PROFILES_PAGE_COPY.profileNamePlaceholder}
            maxLength={80}
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            className={cn(formControlFieldClassName, "w-full min-w-0")}
          />
        </label>

        <p className="text-xs leading-5 text-[var(--oh-text-dim)]">
          {PERMISSION_PROFILES_PAGE_COPY.saveFootnote}
        </p>

        <div className={cn(modalFooterActionsClassName, "mt-2")}>
          <BrandButton type="button" variant="secondary" onClick={onClose}>
            {PERMISSION_PROFILES_PAGE_COPY.cancel}
          </BrandButton>
          <BrandButton
            type="submit"
            variant="primary"
            isDisabled={trimmedName.length === 0 || actionPending}
          >
            {PERMISSION_PROFILES_PAGE_COPY.saveSubmit}
          </BrandButton>
        </div>
      </form>
    </ModalBackdrop>
  );
}
