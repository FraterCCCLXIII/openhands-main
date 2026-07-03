"use client";

import { Info } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import { infoPopoverTriggerClassName } from "@/src/styles/info-popover-classes";
import type { IntegrationKind } from "@/src/components/integrations/wizard/utils";

const POPOVER_PANEL_CLASSNAME =
  "m-0 max-w-sm rounded-xl border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] p-5 text-sm leading-5 text-[var(--oh-text-secondary)] shadow-lg";

interface WizardStepInfoPopoverProps {
  kind: IntegrationKind | null;
}

export function WizardStepInfoPopover({ kind }: WizardStepInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const bullets =
    kind === "mcp"
      ? INTEGRATIONS_PAGE_COPY.wizardConnectSidebarMcpBullets
      : INTEGRATIONS_PAGE_COPY.wizardConnectSidebarManagedBullets;

  useLayoutEffect(() => {
    if (!open) {
      setPosition(undefined);
      return undefined;
    }

    const trigger = triggerRef.current;
    if (!trigger) {
      return undefined;
    }

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();
      setPosition({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.right,
        transform: "translateX(-100%)",
        width: "min(100vw - 2rem, 28rem)",
        zIndex: 60,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const panel =
    open && position && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={INTEGRATIONS_PAGE_COPY.wizardStepInfoAriaLabel}
            data-testid="integration-wizard-step-info-popover"
            style={position}
            className={cn(POPOVER_PANEL_CLASSNAME, "w-[min(100vw-2rem,28rem)]")}
          >
            <p className="font-semibold text-white">
              {INTEGRATIONS_PAGE_COPY.wizardConnectSidebarTitle}
            </p>
            <ul className="mt-3 space-y-2">
              {bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-testid="integration-wizard-step-info-trigger"
        aria-label={INTEGRATIONS_PAGE_COPY.wizardStepInfoAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={infoPopoverTriggerClassName}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      {panel}
    </>
  );
}
