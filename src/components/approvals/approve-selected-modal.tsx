"use client";

import React from "react";
import Link from "next/link";

import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { StatusPill } from "@/src/components/ui/status-pill";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import {
  APPROVAL_DURATION,
  APPROVALS_PAGE_COPY,
} from "@/src/constants/approvals-page";
import { cn } from "@/src/lib/utils";
import { formControlFieldClassName } from "@/src/styles/form-control-classes";
import { normalizeApprovalDurationHours } from "@/src/lib/access-requests";

interface ApproveSelectedModalProps {
  selectedCount: number;
  initialDurationHours: string;
  onClose: () => void;
  onConfirm: (durationHours: number) => void | Promise<void>;
}

export function ApproveSelectedModal({
  selectedCount,
  initialDurationHours,
  onClose,
  onConfirm,
}: ApproveSelectedModalProps) {
  const [durationHours, setDurationHours] = React.useState(() => {
    const parsed = Number(initialDurationHours);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return APPROVAL_DURATION.defaultHours;
    }
    return normalizeApprovalDurationHours(parsed);
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onConfirm(durationHours);
  };

  return (
    <ModalBackdrop
      ariaLabel={APPROVALS_PAGE_COPY.approveModalAriaLabel}
      onClose={onClose}
    >
      <form
        data-testid="approve-selected-modal"
        onSubmit={handleSubmit}
        className={cn(
          "relative flex max-h-[85vh] w-[520px] max-w-[90vw] flex-col gap-4 overflow-y-auto",
          "rounded-xl border border-[var(--oh-border)] bg-base-secondary p-6 custom-scrollbar-always",
        )}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="approve-selected-modal-close"
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pr-6">
          <h2 className="text-base font-semibold text-white">
            {APPROVALS_PAGE_COPY.decideSelectedTitle}
          </h2>
          <StatusPill className="shrink-0">
            {APPROVALS_PAGE_COPY.selectedCount(selectedCount)}
          </StatusPill>
        </div>

        <p className="text-sm leading-5 text-tertiary-light">
          {APPROVALS_PAGE_COPY.decideSelectedDescription(
            APPROVAL_DURATION.defaultHours,
            APPROVAL_DURATION.maxHours,
          )}{" "}
          {APPROVALS_PAGE_COPY.longDurationHintPrefix}{" "}
          <Link href="/integrations" className="text-white hover:opacity-80">
            {APPROVALS_PAGE_COPY.longDurationHintLink}
          </Link>
          {APPROVALS_PAGE_COPY.longDurationHintSuffix}
        </p>

        <label className="flex w-full min-w-0 flex-col gap-2.5">
          <span className="text-sm">{APPROVALS_PAGE_COPY.durationLabel}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={APPROVAL_DURATION.minHours}
              max={APPROVAL_DURATION.maxHours}
              step={1}
              value={durationHours}
              aria-label={APPROVALS_PAGE_COPY.durationAriaLabel}
              data-testid="approvals-duration-hours"
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (Number.isNaN(nextValue)) return;
                setDurationHours(normalizeApprovalDurationHours(nextValue));
              }}
              className={cn(formControlFieldClassName, "h-9 w-24 px-3 py-2")}
            />
            <span className="text-sm text-tertiary-light">
              {APPROVALS_PAGE_COPY.hoursLabel}
            </span>
          </div>
        </label>

        <div className="mt-2 flex justify-end gap-2">
          <BrandButton type="button" variant="secondary" onClick={onClose}>
            {APPROVALS_PAGE_COPY.cancel}
          </BrandButton>
          <BrandButton type="submit" variant="primary">
            {APPROVALS_PAGE_COPY.confirmApprove}
          </BrandButton>
        </div>
      </form>
    </ModalBackdrop>
  );
}
