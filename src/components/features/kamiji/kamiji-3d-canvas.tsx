import React from "react";
import { KamijiDrawable, registerKamiji } from "./kamiji-stage";

export interface KamijiCanvasInstance extends KamijiDrawable {
  dispose(): void;
}

interface KamijiCanvasProps<T extends KamijiCanvasInstance> {
  /** Builds the instance once on mount (loads the GLB, claims the renderer). */
  create: () => Promise<T>;
  /** Pushes the latest props onto the instance; runs after every render, so setters must be no-ops when unchanged. */
  sync: (instance: T) => void;
  /** Backing-store edge in pixels. */
  bufferSize: number;
  onReady: () => void;
  onUnavailable: () => void;
}

/**
 * A 2D canvas fed by the shared WebGL renderer. Drawing pauses while the canvas
 * is off screen (IntersectionObserver) and the loop is shared by every instance.
 */
export function KamijiCanvas<T extends KamijiCanvasInstance>({
  create,
  sync,
  bufferSize,
  onReady,
  onUnavailable,
}: KamijiCanvasProps<T>) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const instanceRef = React.useRef<T | null>(null);
  const latest = React.useRef({ create, sync, onReady, onUnavailable });
  latest.current = { create, sync, onReady, onUnavailable };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      latest.current.onUnavailable();
      return undefined;
    }
    let cancelled = false;
    let visible = true;
    let unregister: (() => void) | undefined;
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          })
        : null;
    observer?.observe(canvas);

    latest.current
      .create()
      .then((instance) => {
        if (cancelled) {
          instance.dispose();
          return;
        }
        latest.current.sync(instance);
        instance.tick(0);
        instance.draw(context);
        instanceRef.current = instance;
        unregister = registerKamiji(instance, context, () => visible);
        latest.current.onReady();
      })
      .catch(() => {
        if (!cancelled) latest.current.onUnavailable();
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      unregister?.();
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (instanceRef.current) latest.current.sync(instanceRef.current);
  });

  return (
    <canvas
      ref={canvasRef}
      width={bufferSize}
      height={bufferSize}
      className="absolute inset-0 size-full"
      aria-hidden="true"
    />
  );
}

const MIN_BUFFER = 64;
const MAX_BUFFER = 256;

/** Backing-store size for a CSS size: device pixels, clamped to the shared renderer's 256px. */
export function getBufferSize(cssSize: number): number {
  const ratio =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1;
  return Math.max(MIN_BUFFER, Math.min(MAX_BUFFER, Math.ceil(cssSize * ratio)));
}
