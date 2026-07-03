"use client";

import React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/src/lib/utils";

const SIDEBAR_TOOLTIP_OFFSET_PX = 7;
const SIDEBAR_TOOLTIP_CLOSE_DELAY_MS = 100;
const SIDEBAR_TOOLTIP_ENTER_MS = 200;
const SIDEBAR_TOOLTIP_EXIT_MS = 150;

const sidebarTooltipSurfaceClassName =
  "fixed z-[9999] -translate-y-1/2 rounded-md bg-white px-2 py-1 text-xs font-medium text-black shadow-md pointer-events-none whitespace-nowrap origin-left";

const sidebarTooltipEnterEaseClassName = "ease-[cubic-bezier(0.16,1,0.3,1)]";

function getDisableAnimation(): boolean {
  return process.env.NODE_ENV === "test";
}

interface SidebarTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: "right";
  className?: string;
}

export function SidebarTooltip({
  children,
  content,
  placement = "right",
  className,
}: SidebarTooltipProps) {
  const disableAnimation = getDisableAnimation();
  const [mounted, setMounted] = React.useState(false);
  const [present, setPresent] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterFrameRef = React.useRef<number | null>(null);

  const clearTimers = React.useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterFrameRef.current !== null) {
      cancelAnimationFrame(enterFrameRef.current);
      enterFrameRef.current = null;
    }
  }, []);

  const updatePosition = React.useCallback(() => {
    const node = triggerRef.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    if (placement === "right") {
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + SIDEBAR_TOOLTIP_OFFSET_PX,
      });
    }
  }, [placement]);

  const show = React.useCallback(() => {
    clearTimers();
    updatePosition();

    if (disableAnimation) {
      setMounted(true);
      setPresent(true);
      return;
    }

    setMounted(true);
    enterFrameRef.current = requestAnimationFrame(() => {
      enterFrameRef.current = requestAnimationFrame(() => {
        enterFrameRef.current = null;
        setPresent(true);
      });
    });
  }, [clearTimers, disableAnimation, updatePosition]);

  const hide = React.useCallback(() => {
    clearTimers();

    closeTimerRef.current = setTimeout(() => {
      if (disableAnimation) {
        setPresent(false);
        setMounted(false);
        return;
      }

      setPresent(false);
      exitTimerRef.current = setTimeout(() => {
        setMounted(false);
        exitTimerRef.current = null;
      }, SIDEBAR_TOOLTIP_EXIT_MS);
    }, SIDEBAR_TOOLTIP_CLOSE_DELAY_MS);
  }, [clearTimers, disableAnimation]);

  React.useEffect(() => clearTimers, [clearTimers]);

  return (
    <>
      <span
        ref={triggerRef}
        data-testid="sidebar-tooltip-trigger"
        className={cn("flex w-full min-w-0", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              aria-hidden={!present}
              className={cn(
                sidebarTooltipSurfaceClassName,
                disableAnimation
                  ? present
                    ? "opacity-100"
                    : "opacity-0"
                  : cn(
                      "transition-[transform,opacity] motion-reduce:transition-none",
                      present
                        ? cn(
                            "scale-100 opacity-100",
                            sidebarTooltipEnterEaseClassName,
                          )
                        : "scale-[0.85] opacity-0 ease-out",
                    ),
              )}
              style={{
                top: position.top,
                left: position.left,
                transitionDuration: disableAnimation
                  ? undefined
                  : present
                    ? `${SIDEBAR_TOOLTIP_ENTER_MS}ms`
                    : `${SIDEBAR_TOOLTIP_EXIT_MS}ms`,
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
