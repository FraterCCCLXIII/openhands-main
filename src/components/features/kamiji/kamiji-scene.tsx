import React from "react";
import {
  KAMIJI_SHOW_MOUTH,
  KamijiAnimation,
  KamijiExpression,
  KamijiPose,
} from "./kamiji-expressions";
import { KamijiShape } from "./kamiji-shape";
import {
  KAMIJI_BUFFER_SIZE,
  KamijiInstance,
  registerKamiji,
} from "./kamiji-stage";

interface KamijiSceneProps {
  color: string;
  expression: KamijiExpression;
  animation: KamijiAnimation;
  speaking: boolean;
  lockFace?: boolean;
  shape?: KamijiShape;
  shapeDurationMs?: number;
  pose?: KamijiPose;
  poseDurationMs?: number;
  mouth?: boolean;
  outline?: boolean;
  viewYaw?: number;
  viewPitch?: number;
  onReady: () => void;
  onUnavailable: () => void;
}

/** The three.js half of KamijiAvatar; loaded lazily so three stays out of the eager bundle. */
export default function KamijiScene({
  color,
  expression,
  animation,
  speaking,
  lockFace,
  shape,
  shapeDurationMs,
  pose,
  poseDurationMs,
  mouth,
  outline,
  viewYaw,
  viewPitch,
  onReady,
  onUnavailable,
}: KamijiSceneProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const instanceRef = React.useRef<KamijiInstance | null>(null);
  const latest = React.useRef({
    color,
    expression,
    animation,
    speaking,
    lockFace,
    shape,
    shapeDurationMs,
    pose,
    poseDurationMs,
    mouth,
    outline,
    viewYaw,
    viewPitch,
  });
  latest.current = {
    color,
    expression,
    animation,
    speaking,
    lockFace,
    shape,
    shapeDurationMs,
    pose,
    poseDurationMs,
    mouth,
    outline,
    viewYaw,
    viewPitch,
  };
  const callbacks = React.useRef({ onReady, onUnavailable });
  callbacks.current = { onReady, onUnavailable };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      callbacks.current.onUnavailable();
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

    KamijiInstance.create(latest.current)
      .then((instance) => {
        if (cancelled) {
          instance.dispose();
          return;
        }
        instance.setColor(latest.current.color);
        instance.setExpression(latest.current.expression);
        instance.setAnimation(latest.current.animation);
        instance.setPose(latest.current.pose, 0);
        instance.setSpeaking(latest.current.speaking);
        instance.setLockFace(!!latest.current.lockFace);
        instance.setShape(latest.current.shape, 0);
        instance.setMouth(latest.current.mouth ?? KAMIJI_SHOW_MOUTH);
        instance.setOutline(!!latest.current.outline);
        instance.tick(0);
        instance.draw(context);
        instanceRef.current = instance;
        unregister = registerKamiji(instance, context, () => visible);
        callbacks.current.onReady();
      })
      .catch(() => {
        if (!cancelled) callbacks.current.onUnavailable();
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      unregister?.();
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  React.useEffect(() => instanceRef.current?.setColor(color), [color]);
  React.useEffect(
    () => instanceRef.current?.setExpression(expression),
    [expression],
  );
  React.useEffect(
    () => instanceRef.current?.setAnimation(animation),
    [animation],
  );
  React.useEffect(() => instanceRef.current?.setSpeaking(speaking), [speaking]);
  React.useEffect(
    () => instanceRef.current?.setLockFace(!!lockFace),
    [lockFace],
  );
  React.useEffect(
    () => instanceRef.current?.setShape(shape, shapeDurationMs),
    [shape, shapeDurationMs],
  );
  React.useEffect(
    () => instanceRef.current?.setPose(pose, poseDurationMs),
    [pose, poseDurationMs],
  );
  React.useEffect(
    () => instanceRef.current?.setMouth(mouth ?? KAMIJI_SHOW_MOUTH),
    [mouth],
  );
  React.useEffect(() => instanceRef.current?.setOutline(!!outline), [outline]);
  React.useEffect(
    () => instanceRef.current?.setView(viewYaw, viewPitch),
    [viewYaw, viewPitch],
  );

  return (
    <canvas
      ref={canvasRef}
      width={KAMIJI_BUFFER_SIZE}
      height={KAMIJI_BUFFER_SIZE}
      className="absolute inset-0 size-full"
      aria-hidden="true"
    />
  );
}
