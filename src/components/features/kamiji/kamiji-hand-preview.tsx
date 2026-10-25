import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { KamijiHandAvatar } from "./kamiji-hand-avatar";
import type { KamijiHandLook } from "./kamiji-hand-look";
import {
  FRONT_VIEW,
  getDragView,
  getFollowView,
  getKeyView,
  type HandView,
} from "./kamiji-hand-view";

interface KamijiHandPreviewProps {
  look: KamijiHandLook;
  /** Turns the hand toward the pointer while it moves over the window. */
  follow: boolean;
  /** Edge length in CSS pixels. */
  size?: number;
  className?: string;
}

interface DragStart {
  x: number;
  y: number;
  view: HandView;
}

/** Live 3D preview: drag (or use the arrow keys) to spin it, and it can follow the pointer. */
export function KamijiHandPreview({
  look,
  follow,
  size = 200,
  className,
}: KamijiHandPreviewProps) {
  const { t } = useTranslation("openhands");
  const ref = React.useRef<HTMLButtonElement>(null);
  const dragStart = React.useRef<DragStart | null>(null);
  const [turn, setTurn] = React.useState<HandView>(FRONT_VIEW);
  const [gaze, setGaze] = React.useState<HandView>(FRONT_VIEW);

  React.useEffect(() => {
    if (!follow) {
      setGaze(FRONT_VIEW);
      return undefined;
    }
    const onMove = (event: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box || dragStart.current) return;
      setGaze(
        getFollowView(
          event.clientX - (box.left + box.width / 2),
          event.clientY - (box.top + box.height / 2),
          window.innerWidth / 2,
          window.innerHeight / 2,
        ),
      );
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [follow]);

  const endDrag = () => {
    dragStart.current = null;
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={t(I18nKey.KAMIJI$PREVIEW_LABEL)}
      data-testid="kamiji-hand-preview"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragStart.current = {
          x: event.clientX,
          y: event.clientY,
          view: turn,
        };
      }}
      onPointerMove={(event) => {
        const start = dragStart.current;
        if (!start) return;
        setTurn(
          getDragView(
            start.view,
            event.clientX - start.x,
            event.clientY - start.y,
          ),
        );
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(event) => {
        const next = getKeyView(turn, event.key);
        if (!next) return;
        event.preventDefault();
        setTurn(next);
      }}
      className={cn(
        "flex w-full cursor-grab touch-none items-center justify-center rounded-xl bg-surface-raised p-2 active:cursor-grabbing",
        "outline-none focus-visible:ring-2 focus-visible:ring-contrast",
        className,
      )}
    >
      <KamijiHandAvatar
        look={look}
        size={size}
        viewYaw={turn.yaw + gaze.yaw}
        viewPitch={turn.pitch + gaze.pitch}
      />
    </button>
  );
}
