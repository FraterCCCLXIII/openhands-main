/* eslint-disable i18next/no-literal-string -- dev-only design reference page, not product copy */
import React from "react";
import { Navigate } from "react-router";
import { cn } from "#/utils/utils";

const PRESETS: Record<
  string,
  { label: string; width: number; height: number }
> = {
  mobile: { label: "Mobile", width: 390, height: 844 },
  landscape: { label: "Landscape", width: 844, height: 390 },
  square: { label: "Square", width: 600, height: 600 },
  desktop: { label: "Desktop", width: 960, height: 640 },
};

type PresetKey = "mobile" | "landscape" | "square" | "desktop";

/** A custom app window: sized by preset or by dragging its corner. */
export default function MockAppWindow() {
  if (import.meta.env.VITE_MOCK_API !== "true") {
    return <Navigate to="/" replace />;
  }
  return <AppWindowDemo />;
}

function AppWindowDemo() {
  const [preset, setPreset] = React.useState<PresetKey | null>("desktop");
  const [size, setSize] = React.useState({
    width: PRESETS.desktop.width,
    height: PRESETS.desktop.height,
  });
  const frameRef = React.useRef<HTMLDivElement>(null);

  const choose = (key: PresetKey) => {
    setPreset(key);
    setSize({ width: PRESETS[key].width, height: PRESETS[key].height });
  };

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const origin = { x: event.clientX, y: event.clientY, ...size };
    const onMove = (move: PointerEvent) => {
      setPreset(null);
      setSize({
        width: Math.max(280, origin.width + move.clientX - origin.x),
        height: Math.max(220, origin.height + move.clientY - origin.y),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      data-testid="mock-app-window"
      className="flex flex-col items-center gap-4 p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={preset === key}
            onClick={() => choose(key)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
              preset === key
                ? "bg-interactive-hover text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {PRESETS[key].label}
          </button>
        ))}
        <span className="text-xs text-muted">
          {size.width} × {size.height}
        </span>
      </div>

      <div
        ref={frameRef}
        data-testid="mock-app-window-frame"
        style={{ width: size.width, height: size.height }}
        className="relative flex max-w-full flex-col overflow-hidden rounded-3xl border border-border bg-base-secondary shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-status-error" aria-hidden />
          <span
            className="size-2.5 rounded-full bg-feedback-warning"
            aria-hidden
          />
          <span
            className="size-2.5 rounded-full bg-status-success"
            aria-hidden
          />
          <span className="ml-2 truncate text-sm text-muted">
            Agent Canvas Demo
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
          <h2 className="text-base font-semibold text-foreground">
            Release snapshot
          </h2>
          <p className="text-sm text-muted">
            The window reflows its content as it resizes. Drag the corner to try
            any size.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {["Area", "Status", "Next step"].map((cell) => (
              <div
                key={cell}
                className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm"
              >
                {cell}
              </div>
            ))}
          </div>
        </div>
        <div
          role="separator"
          aria-label="Resize window"
          data-testid="mock-app-window-handle"
          onPointerDown={startResize}
          className="absolute right-1 bottom-1 size-4 cursor-nwse-resize rounded-sm border-r-2 border-b-2 border-muted"
        />
      </div>
    </div>
  );
}
