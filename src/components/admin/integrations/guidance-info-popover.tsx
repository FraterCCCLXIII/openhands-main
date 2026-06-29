"use client";

import { Info, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

import { ADMIN_INTEGRATIONS_PAGE_COPY } from "@/src/constants/admin-integrations-page";
import { cn } from "@/src/lib/utils";

const INFO_TRIGGER_CLASSNAME =
  "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] text-text-dim transition-colors hover:border-[var(--oh-accent)] hover:text-white";

const POPOVER_PANEL_CLASSNAME =
  "m-0 max-w-md rounded-xl border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] p-5 shadow-lg";

interface GuidanceInfoPopoverProps {
  triggerTestId: string;
  sectionTestId: string;
  cardTestId: string;
  ariaLabel: string;
  headerIcon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
}

function GuidanceInfoPopover({
  triggerTestId,
  sectionTestId,
  cardTestId,
  ariaLabel,
  headerIcon: HeaderIcon,
  title,
  subtitle,
  children,
}: GuidanceInfoPopoverProps) {
  const popoverId = useId().replace(/:/g, "");

  return (
    <>
      <button
        type="button"
        popoverTarget={popoverId}
        data-testid={triggerTestId}
        aria-label={ariaLabel}
        className={INFO_TRIGGER_CLASSNAME}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <div
        id={popoverId}
        popover="auto"
        data-testid={sectionTestId}
        className={cn(POPOVER_PANEL_CLASSNAME, "w-[min(100vw-2rem,28rem)]")}
      >
        <div data-testid={cardTestId}>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-md border border-[var(--oh-border)] bg-base-secondary p-2">
              <HeaderIcon className="h-4 w-4 text-primary" aria-hidden />
            </span>
            <div>
              <p className="text-base font-semibold text-white">{title}</p>
              <p className="text-sm text-text-secondary">{subtitle}</p>
            </div>
          </div>
          <div className="space-y-4 text-sm leading-5 text-text-secondary">{children}</div>
        </div>
      </div>
    </>
  );
}

export function UserGuidanceInfoPopover() {
  const copy = ADMIN_INTEGRATIONS_PAGE_COPY;

  return (
    <GuidanceInfoPopover
      triggerTestId="user-guidance-info-trigger"
      sectionTestId="user-guidance-section"
      cardTestId="user-guidance-card"
      ariaLabel={copy.userGuidanceInfoAriaLabel}
      headerIcon={UserRound}
      title={copy.userGuidanceTitle}
      subtitle={copy.userGuidanceSubtitle}
    >
      <p>{copy.userGuidanceBody}</p>
    </GuidanceInfoPopover>
  );
}

export function AdminGuidanceInfoPopover() {
  const copy = ADMIN_INTEGRATIONS_PAGE_COPY;

  return (
    <GuidanceInfoPopover
      triggerTestId="admin-guidance-info-trigger"
      sectionTestId="admin-guidance-section"
      cardTestId="admin-guidance-card"
      ariaLabel={copy.adminGuidanceInfoAriaLabel}
      headerIcon={ShieldCheck}
      title={copy.adminGuidanceTitle}
      subtitle={copy.adminGuidanceSubtitle}
    >
      <p>{copy.adminGuidanceLead}</p>
      <p>
        {copy.adminGuidanceAccessNotePrefix}{" "}
        <code className="text-white">{copy.adminGuidanceAccessNoteEnvVar}</code>{" "}
        {copy.adminGuidanceAccessNoteSuffix}
      </p>
    </GuidanceInfoPopover>
  );
}
