import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { CircleX, TriangleAlert, X } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import {
  useNotificationStackStore,
  type StackNotification,
} from "#/stores/notification-stack-store";

/** Cards visible behind the front one; anything deeper is hidden. */
const VISIBLE_BEHIND = 3;
/** Vertical offset and shrink per card behind the front. */
const DECK_STEP_PX = 10;
const DECK_SCALE_STEP = 0.04;
/** Drag distance or flick speed that counts as a swipe. */
const SWIPE_DISTANCE_PX = 60;
const SWIPE_VELOCITY = 500;
const FLY_OFF_Y = -260;

interface NotificationCardProps {
  notification: StackNotification;
  depth: number;
  isFront: boolean;
  flyingId: string | null;
  onFlyOffDone: (id: string) => void;
  onDragEnd: (id: string, offsetY: number, velocityY: number) => void;
}

function NotificationCard({
  notification,
  depth,
  isFront,
  flyingId,
  onFlyOffDone,
  onDragEnd,
}: NotificationCardProps) {
  const { t } = useTranslation("openhands");
  const reduceMotion = useReducedMotion();
  const dismiss = useNotificationStackStore((state) => state.dismiss);
  const isFlying = flyingId === notification.id;
  const isError = notification.kind === "error";

  const deckTarget = {
    y: depth * DECK_STEP_PX,
    scale: 1 - depth * DECK_SCALE_STEP,
    opacity: depth < VISIBLE_BEHIND + 1 ? 1 : 0,
  };

  return (
    <motion.div
      data-testid="notification-card"
      data-kind={notification.kind}
      data-depth={depth}
      role={isError ? "alert" : "status"}
      drag={isFront && !isFlying ? "y" : false}
      dragConstraints={{ top: FLY_OFF_Y, bottom: 240 }}
      dragElastic={0.35}
      onDragEnd={(_, info) =>
        onDragEnd(notification.id, info.offset.y, info.velocity.y)
      }
      initial={false}
      animate={
        isFlying ? { y: FLY_OFF_Y, opacity: 0, scale: 0.98 } : deckTarget
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 34 }
      }
      onAnimationComplete={() => {
        if (isFlying) onFlyOffDone(notification.id);
      }}
      style={{ gridArea: "stack", zIndex: 100 - depth }}
      className={cn(
        "relative flex min-w-0 items-start gap-2 rounded-xl border border-[color:var(--oh-border-input)] bg-[var(--oh-color-tertiary)] py-3 pr-10 pl-3 text-sm leading-5 text-contrast shadow-lg",
        isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
      )}
    >
      {isError ? (
        <CircleX
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-status-error"
          strokeWidth={2}
        />
      ) : (
        <TriangleAlert
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-[color:var(--oh-color-warning,#e0a526)]"
          strokeWidth={2}
        />
      )}
      <p className="min-w-0 flex-1 [overflow-wrap:anywhere] whitespace-pre-wrap">
        {notification.message}
      </p>
      {notification.count > 1 ? (
        <span
          data-testid="notification-count"
          className="mt-0.5 shrink-0 rounded-full bg-surface-raised px-1.5 text-xs tabular-nums text-muted"
        >
          ×{notification.count}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={t(I18nKey.CHAT_INTERFACE$MESSAGE_DISMISS)}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => dismiss(notification.id)}
        className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-surface-raised text-muted hover:text-contrast"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </motion.div>
  );
}

/**
 * Top-right deck of error and warning notices. The front card can be:
 * - flicked or dragged up: it flies off and is ignored,
 * - pulled down: it drops away and the card beneath it comes forward, so the
 *   previous message is revealed,
 * - dismissed with the round X.
 * Auto-dismiss applies to the front card only.
 */
export function NotificationStack() {
  const items = useNotificationStackStore((state) => state.items);
  const dismiss = useNotificationStackStore((state) => state.dismiss);
  const cycle = useNotificationStackStore((state) => state.cycle);
  const [flyingId, setFlyingId] = React.useState<string | null>(null);

  const front = items[0];

  React.useEffect(() => {
    if (!front || flyingId) return undefined;
    const timer = setTimeout(() => dismiss(front.id), front.duration);
    return () => clearTimeout(timer);
  }, [front, flyingId, dismiss]);

  const handleDragEnd = (id: string, offsetY: number, velocityY: number) => {
    if (offsetY < -SWIPE_DISTANCE_PX || velocityY < -SWIPE_VELOCITY) {
      setFlyingId(id);
      return;
    }
    if (offsetY > SWIPE_DISTANCE_PX || velocityY > SWIPE_VELOCITY) {
      cycle();
    }
  };

  const handleFlyOffDone = (id: string) => {
    setFlyingId(null);
    dismiss(id);
  };

  if (items.length === 0) return null;

  const visible = items.slice(0, VISIBLE_BEHIND + 1);

  return (
    <div
      data-testid="notification-stack"
      className="pointer-events-none fixed top-4 right-4 z-[110] w-[400px] max-w-[calc(100vw-2rem)]"
    >
      <div
        className="grid pointer-events-auto [grid-template-areas:'stack']"
        style={{ paddingBottom: (visible.length - 1) * DECK_STEP_PX }}
      >
        {visible.map((notification, depth) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            depth={depth}
            isFront={depth === 0}
            flyingId={flyingId}
            onFlyOffDone={handleFlyOffDone}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
