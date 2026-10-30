/* eslint-disable i18next/no-literal-string -- dev-only prototype page, not product copy */
import React from "react";
import { Navigate } from "react-router";
import { KamijiHandAvatar } from "#/components/features/kamiji/kamiji-hand-avatar";
import { KamijiHandEditButton } from "#/components/features/kamiji/kamiji-hand-edit-button";
import { KamijiHandEditor } from "#/components/features/kamiji/kamiji-hand-editor";
import { KamijiSimConversation } from "#/components/features/kamiji/kamiji-sim-conversation";

const KamijiHandEditorDialog = React.lazy(
  () => import("#/components/features/kamiji/kamiji-hand-editor-dialog"),
);

const AVATAR_SIZES = [24, 40, 72, 120];

export default function MockKamijiEditor() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  if (import.meta.env.VITE_MOCK_API !== "true") {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="h-full overflow-y-auto bg-canvas-base text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <header>
          <h1 className="text-xl font-semibold">Hand editor</h1>
          <p className="text-sm text-muted">
            Prototype: customise your own Hand. Changes are saved at once and
            every place that shows you reads the same saved look.
          </p>
        </header>

        <section
          className="rounded-2xl border border-border bg-surface p-4"
          data-testid="kamiji-editor-inline"
        >
          <KamijiHandEditor />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">In the sidebar menu</h2>
          <div className="w-72 rounded-xl border border-border-subtle bg-tertiary p-3">
            <KamijiHandEditButton onClick={() => setDialogOpen(true)} />
          </div>
          {dialogOpen && (
            <React.Suspense fallback={null}>
              <KamijiHandEditorDialog onClose={() => setDialogOpen(false)} />
            </React.Suspense>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Your Hand everywhere</h2>
          <div
            className="flex flex-wrap items-end gap-6 rounded-2xl border border-border bg-surface p-4"
            data-testid="kamiji-editor-sizes"
          >
            {AVATAR_SIZES.map((size) => (
              <KamijiHandAvatar key={size} size={size} />
            ))}
          </div>
        </section>

        <KamijiSimConversation />
      </div>
    </div>
  );
}
