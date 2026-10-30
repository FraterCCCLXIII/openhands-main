import { Navigate } from "react-router";
import { AppTurnedOffPage } from "#/components/features/built-in-apps/app-turned-off-page";
import { useCanvasExtensionsRuntime } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { useCanvasExtensions } from "#/hooks/query/use-canvas-extensions";

const KANBAN_EXTENSION = "kanban";

/**
 * The Kanban board is now the `kanban` Canvas App (examples/canvas-apps/kanban).
 * This route only forwards to it when installed and enabled; otherwise it says
 * the app is off or missing. (The home dashboard's Kanban widget still uses the
 * built-in board.)
 */
export default function KanbanRoute() {
  const { pages, activating } = useCanvasExtensionsRuntime();
  const installed = useCanvasExtensions();
  const page = pages.find((p) => p.extension.name === KANBAN_EXTENSION);

  if (page) return <Navigate to={page.href} replace />;
  if (installed.isLoading || activating) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  const extension = installed.data?.find((e) => e.name === KANBAN_EXTENSION);
  return (
    <AppTurnedOffPage
      name={extension?.manifest?.display_name || "Kanban"}
      reason={extension ? "off" : "missing"}
    />
  );
}
