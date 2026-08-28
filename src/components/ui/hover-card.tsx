"use client";

import React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/src/lib/utils";

const HOVER_CARD_OFFSET_PX = 8;
const HOVER_CARD_CLOSE_DELAY_MS = 80;

function getDisableAnimation(): boolean {
  return process.env.NODE_ENV === "test";
}

interface HoverCardProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  testId?: string;
}

export function HoverCard({
  content,
  children,
  className,
  contentClassName,
  testId,
}: HoverCardProps) {
  const disableAnimation = getDisableAnimation();
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = React.useCallback(() => {
    const node = triggerRef.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    setPosition({
      top: rect.bottom + HOVER_CARD_OFFSET_PX,
      left: Math.min(rect.left, window.innerWidth - 280),
    });
  }, []);

  const show = React.useCallback(() => {
    clearCloseTimer();
    updatePosition();
    setOpen(true);
  }, [clearCloseTimer, updatePosition]);

  const hide = React.useCallback(() => {
    clearCloseTimer();
    if (disableAnimation) {
      setOpen(false);
      return;
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CARD_CLOSE_DELAY_MS);
  }, [clearCloseTimer, disableAnimation]);

  React.useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return (
    <>
      <span
        ref={triggerRef}
        data-testid={testId}
        className={cn("inline-flex", className)}
        onMouseEnter={show}
        onMouseOver={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              data-testid={testId ? `${testId}-content` : undefined}
              className={cn(
                "fixed z-[9999] max-w-xs rounded-lg border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] px-3 py-2 text-xs leading-5 text-white shadow-lg",
                contentClassName,
              )}
              style={{ top: position.top, left: position.left }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
