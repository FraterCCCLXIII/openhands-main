import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { getLockedCloudHost } from "#/api/agent-server-config";
import { type Backend } from "#/api/backend-registry/types";
import { getMarsBridge } from "#/api/mars/mars-tunnel-backend";
import { BrandButton } from "#/components/features/settings/brand-button";
import { ConfirmationModal } from "#/components/shared/modals/confirmation-modal";
import { useActiveBackendContext } from "#/contexts/active-backend-context";
import { useBackendsHealth } from "#/hooks/query/use-backends-health";
import { useAllCloudOrganizations } from "#/hooks/query/use-cloud-organizations";
import { useCloudCurrentUserId } from "#/hooks/query/use-cloud-current-user-id";
import { I18nKey } from "#/i18n/declaration";
import { BackendFormModal } from "#/components/features/backends/backend-form-modal";
import { BackendRow } from "#/components/features/backends/backend-row";
import { DeviceFlowAuth } from "#/components/features/backends/device-flow-auth";
import { ManagedAgentsView } from "#/components/features/backends/managed-agents/managed-agents-view";
import { MarsBackendRemovalModal } from "#/components/features/backends/managed-agents/mars-backend-removal-modal";
import { useBackendSwitchRedirect } from "#/components/features/backends/use-backend-switch-redirect";

interface PendingRemoval {
  id: string;
  name: string;
  marsSessionId?: string;
}

function resolveBackendOrgLabel(
  backend: Backend,
  cloudOrgs: ReturnType<typeof useAllCloudOrganizations>,
  currentUserIds: ReturnType<typeof useCloudCurrentUserId>,
  personalWorkspaceLabel: string,
): string | undefined {
  if (backend.kind !== "cloud") return undefined;
  const entry = cloudOrgs[backend.id];
  if (!entry || entry.orgs.length === 0) return undefined;
  const userId = currentUserIds[backend.id]?.userId ?? null;
  return entry.orgs
    .map((org) =>
      !!userId && userId === org.id ? personalWorkspaceLabel : org.name,
    )
    .join(", ");
}

export function BackendsSettingsScreen() {
  const { t } = useTranslation("openhands");
  const { backends, active, removeBackend, setActive, updateBackend } =
    useActiveBackendContext();
  const healthByBackendId = useBackendsHealth(backends, {
    probeDisabledOnce: true,
  });
  const cloudOrgs = useAllCloudOrganizations();
  const currentUserIds = useCloudCurrentUserId();
  const personalWorkspaceLabel = t(I18nKey.BACKEND$PERSONAL_WORKSPACE);
  const lockedCloudHost = getLockedCloudHost();
  const isLockedToCloud = lockedCloudHost !== null;
  const isCookieAuthBackend = active.backend.authMode === "cookie";
  const lockedCloudBackend =
    isLockedToCloud && !isCookieAuthBackend && active.backend.kind === "cloud"
      ? active.backend
      : null;
  const lockedCloudReconnectHost =
    lockedCloudHost ?? lockedCloudBackend?.host ?? "";

  const [pendingRemoval, setPendingRemoval] =
    React.useState<PendingRemoval | null>(null);
  const [editingBackend, setEditingBackend] = React.useState<Backend | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = React.useState(false);
  const showManagedAgents = getMarsBridge() !== null && !isLockedToCloud;
  const [showManagedAgentsView, setShowManagedAgentsView] =
    React.useState(false);

  const handleConfirmRemoval = () => {
    if (!pendingRemoval) return;
    removeBackend(pendingRemoval.id);
    setPendingRemoval(null);
  };

  const redirectAfterSwitch = useBackendSwitchRedirect();

  const handleSelectBackend = React.useCallback(
    (backend: Backend) => {
      if (active.backend.id !== backend.id || active.orgId !== null) {
        redirectAfterSwitch();
        setActive(backend.id);
      }
    },
    [active.backend.id, active.orgId, redirectAfterSwitch, setActive],
  );

  const handleCloudLogin = React.useCallback(
    (backend: Backend, apiKey: string) => {
      updateBackend(backend.id, { apiKey });
    },
    [updateBackend],
  );

  const handleLockedCloudReconnect = React.useCallback(
    (apiKey: string) => {
      if (!lockedCloudBackend) return;
      updateBackend(lockedCloudBackend.id, { apiKey });
    },
    [lockedCloudBackend, updateBackend],
  );

  if (showManagedAgentsView) {
    return (
      <div
        data-testid="backends-settings-managed-agents"
        className="flex flex-col"
      >
        <ManagedAgentsView
          onBack={() => setShowManagedAgentsView(false)}
          onDone={() => setShowManagedAgentsView(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div data-testid="backends-settings-screen" className="flex flex-col">
        <div className="flex-1">
          <div
            className="overflow-auto rounded-md border border-border bg-surface-raised custom-scrollbar-always"
            data-testid="backends-settings-list"
          >
            {backends.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-text-secondary">
                {t(I18nKey.BACKEND$MANAGE_EMPTY)}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {backends.map((backend) => (
                  <BackendRow
                    key={backend.id}
                    backend={backend}
                    health={healthByBackendId[backend.id]}
                    orgLabel={resolveBackendOrgLabel(
                      backend,
                      cloudOrgs,
                      currentUserIds,
                      personalWorkspaceLabel,
                    )}
                    onSelect={() => handleSelectBackend(backend)}
                    onEdit={() => setEditingBackend(backend)}
                    onRemove={() =>
                      setPendingRemoval({
                        id: backend.id,
                        name: backend.name,
                        marsSessionId: backend.marsSessionId,
                      })
                    }
                    onLogin={
                      backend.authMode === "cookie"
                        ? undefined
                        : (apiKey) => handleCloudLogin(backend, apiKey)
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-start gap-2 pt-6">
          {isLockedToCloud ? (
            lockedCloudBackend ? (
              <DeviceFlowAuth
                host={lockedCloudReconnectHost}
                onSuccess={handleLockedCloudReconnect}
                testIdRoot="backends-settings-reconnect-cloud"
                idleButtonLabel={t(I18nKey.BACKEND$RECONNECT_CLOUD)}
                className="w-full sm:w-auto"
                buttonClassName="w-full sm:w-auto"
                statusDisplay="modal"
              />
            ) : null
          ) : (
            <>
              <BrandButton
                type="button"
                variant="primary"
                onClick={() => setShowAddForm(true)}
                testId="backends-settings-add"
                startContent={<Plus width={14} height={14} />}
              >
                {t(I18nKey.BACKEND$ADD)}
              </BrandButton>
              {showManagedAgents && (
                <BrandButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowManagedAgentsView(true)}
                  testId="backends-settings-managed-agents-button"
                >
                  {t(I18nKey.DO_AGENTS$TITLE)}
                </BrandButton>
              )}
            </>
          )}
        </div>
      </div>

      {showAddForm ? (
        <BackendFormModal
          mode="add"
          source="backends_settings"
          onClose={() => setShowAddForm(false)}
        />
      ) : null}

      {editingBackend ? (
        <BackendFormModal
          mode="edit"
          backend={editingBackend}
          onClose={() => setEditingBackend(null)}
        />
      ) : null}

      {pendingRemoval?.marsSessionId ? (
        <MarsBackendRemovalModal
          name={pendingRemoval.name}
          sessionId={pendingRemoval.marsSessionId}
          onRemove={handleConfirmRemoval}
          onCancel={() => setPendingRemoval(null)}
        />
      ) : pendingRemoval ? (
        <ConfirmationModal
          text={t(I18nKey.BACKEND$REMOVE_CONFIRMATION, {
            name: pendingRemoval.name,
          })}
          onConfirm={handleConfirmRemoval}
          onCancel={() => setPendingRemoval(null)}
        />
      ) : null}
    </>
  );
}

export default BackendsSettingsScreen;
