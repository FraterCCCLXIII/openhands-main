"use client";

import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  RotateCw,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AgentConnectionDetailsModal } from "@/src/components/agent-connection/agent-connection-details-modal";
import {
  copyTextToClipboard,
  maskApiKey,
} from "@/src/components/dashboard/utils";
import { SavePermissionsModal } from "@/src/components/permission-profiles/save-permissions-modal";
import { SavedPermissionProfilesList } from "@/src/components/permission-profiles/saved-permission-profiles-list";
import { permissionProfileLabel } from "@/src/components/permission-profiles/permission-profile-utils";
import { AGENT_CONNECTION_PAGE_COPY } from "@/src/constants/agent-connection-page";
import { fetchJson } from "@/src/lib/fetch-json";
import { cn } from "@/src/lib/utils";
import { formControlButtonClassName } from "@/src/styles/form-control-classes";
import type { PermissionProfile } from "@/src/types/integrations-hub";
import {
  settingsListContainerClassName,
  settingsListDividerClassName,
  settingsListIconActionButtonClassName,
  settingsListRowClassName,
} from "@/src/styles/settings-list-classes";

interface ApiKeyListRowProps {
  copied: boolean;
  label: string;
  maskedValue: string;
  onCopy: () => void | Promise<void>;
  onRevealToggle: () => void | Promise<void>;
  onRotate?: () => void | Promise<void>;
  revealDisabled?: boolean;
  revealed: boolean;
  rotateDisabled?: boolean;
  rotateLabel?: string;
  testId: string;
}

function ApiKeyListRow({
  copied,
  label,
  maskedValue,
  onCopy,
  onRevealToggle,
  onRotate,
  revealDisabled = false,
  revealed,
  rotateDisabled = false,
  rotateLabel = "Rotate",
  testId,
}: ApiKeyListRowProps) {
  return (
    <div
      data-testid={testId}
      className={cn(settingsListRowClassName, "justify-between gap-3")}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-white">
          {label}
        </span>
        <code className="min-w-0 flex-1 truncate text-right font-mono text-xs text-tertiary-light">
          {maskedValue}
        </code>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          data-testid={`${testId}-reveal`}
          aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Reveal ${label.toLowerCase()}`}
          className={settingsListIconActionButtonClassName}
          disabled={revealDisabled}
          onClick={() => void onRevealToggle()}
        >
          {revealed ? (
            <EyeOff width={16} height={16} aria-hidden />
          ) : (
            <Eye width={16} height={16} aria-hidden />
          )}
        </button>
        <button
          type="button"
          data-testid={`${testId}-copy`}
          aria-label={`Copy ${label.toLowerCase()}`}
          className={settingsListIconActionButtonClassName}
          disabled={revealDisabled}
          onClick={() => void onCopy()}
        >
          {copied ? (
            <CheckCircle2 width={16} height={16} aria-hidden />
          ) : (
            <Copy width={16} height={16} aria-hidden />
          )}
        </button>
        {onRotate ? (
          <button
            type="button"
            data-testid={`${testId}-rotate`}
            aria-label={`${rotateLabel} ${label.toLowerCase()}`}
            className={settingsListIconActionButtonClassName}
            disabled={rotateDisabled}
            onClick={() => void onRotate()}
          >
            <RotateCw width={16} height={16} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProfileAgentKeyActions({
  profile,
}: {
  profile: PermissionProfile;
}) {
  const label = permissionProfileLabel(profile);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agentApiKey, setAgentApiKey] = useState(
    profile.agentApiKey?.trim() ?? "",
  );
  const [keyActionPending, setKeyActionPending] = useState(false);
  const [keyActionError, setKeyActionError] = useState<string | null>(null);
  const hasKey = agentApiKey.length > 0;

  useEffect(() => {
    setAgentApiKey(profile.agentApiKey?.trim() ?? "");
    setRevealed(false);
    setCopied(false);
    setKeyActionError(null);
  }, [profile.agentApiKey, profile.id]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  const handleCopy = async () => {
    if (!hasKey) {
      return;
    }

    await copyTextToClipboard(agentApiKey);
    setCopied(true);
  };

  const handleRotate = async () => {
    if (keyActionPending) {
      return;
    }

    setKeyActionPending(true);
    setKeyActionError(null);

    try {
      const updatedProfile = await fetchJson<PermissionProfile>(
        `/api/permission-profiles/${profile.id}/agent-key`,
        { method: "POST" },
      );
      const nextKey = updatedProfile.agentApiKey?.trim() ?? "";
      setAgentApiKey(nextKey);
      setRevealed(nextKey.length > 0);
      setCopied(false);
    } catch {
      setKeyActionError(
        hasKey
          ? "Unable to rotate the agent key right now."
          : "Unable to provision the agent key right now.",
      );
    } finally {
      setKeyActionPending(false);
    }
  };

  const testId = `agent-connection-agent-key-row-${profile.id}`;
  const maskedValue = hasKey
    ? maskApiKey(agentApiKey, revealed)
    : keyActionError ?? AGENT_CONNECTION_PAGE_COPY.noProfileAgentKey;
  const rotateLabel = keyActionPending
    ? hasKey
      ? "Rotating"
      : "Provisioning"
    : hasKey
      ? "Rotate"
      : "Provision";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 max-w-48 truncate text-right font-mono text-xs text-tertiary-light">
        {maskedValue}
      </code>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          data-testid={`${testId}-reveal`}
          aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Reveal ${label.toLowerCase()}`}
          className={settingsListIconActionButtonClassName}
          disabled={!hasKey}
          onClick={() => setRevealed((current) => !current)}
        >
          {revealed ? (
            <EyeOff width={16} height={16} aria-hidden />
          ) : (
            <Eye width={16} height={16} aria-hidden />
          )}
        </button>
        <button
          type="button"
          data-testid={`${testId}-copy`}
          aria-label={`Copy ${label.toLowerCase()}`}
          className={settingsListIconActionButtonClassName}
          disabled={!hasKey}
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <CheckCircle2 width={16} height={16} aria-hidden />
          ) : (
            <Copy width={16} height={16} aria-hidden />
          )}
        </button>
        <button
          type="button"
          data-testid={`${testId}-rotate`}
          aria-label={`${rotateLabel} ${label.toLowerCase()}`}
          className={settingsListIconActionButtonClassName}
          disabled={keyActionPending}
          onClick={() => void handleRotate()}
        >
          <RotateCw width={16} height={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function KeyListSection({
  action,
  children,
  description,
  testId,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description: string;
  testId: string;
  title: string;
}) {
  return (
    <section data-testid={testId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-white">{title}</h2>
          {action}
        </div>
        <p className="text-sm leading-5 text-tertiary-light">{description}</p>
      </div>
      <div
        className={cn(settingsListContainerClassName, settingsListDividerClassName)}
      >
        {children}
      </div>
    </section>
  );
}

const comparePermissionProfiles = (
  left: PermissionProfile,
  right: PermissionProfile,
) => {
  if (left.name === null && right.name !== null) {
    return -1;
  }
  if (left.name !== null && right.name === null) {
    return 1;
  }
  return permissionProfileLabel(left).localeCompare(permissionProfileLabel(right));
};

interface AgentConnectionSectionProps {
  actionPending?: boolean;
  adminKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
    handleReveal: () => void | Promise<void>;
    handleRotate: () => void | Promise<void>;
    hasKey: boolean;
    maskedValue: string;
    revealed: boolean;
  };
  adminPromptExample: string;
  adminSchemaEndpoint: string;
  agentMcpConfigExample: string;
  agentMcpEndpoint: string;
  agentMcpToolName: string;
  agentOpenApiSchemaEndpoint: string;
  agentRestPromptExample: string;
  isAdmin: boolean;
  isSaveModalOpen?: boolean;
  onCloseSaveModal?: () => void;
  onOpenSaveModal?: () => void;
  onSaveProfile?: (profileName: string) => void;
  onLoadProfile?: (profile: PermissionProfile) => void;
  onUpdateProfile?: (profile: PermissionProfile) => void;
  onDeleteProfile?: (profile: PermissionProfile) => void;
  permissionProfiles: PermissionProfile[];
  permissionProfilesLoading: boolean;
  permissionProfilesError: string | null;
  userKey: {
    copied: boolean;
    handleCopy: () => void | Promise<void>;
    handleReveal: () => void | Promise<void>;
    handleRotate: () => void | Promise<void>;
    hasKey: boolean;
    maskedValue: string;
    revealed: boolean;
  };
  userOpenApiSchemaEndpoint: string;
  userRestPromptExample: string;
  connectionDetailsOpen?: boolean;
  onConnectionDetailsOpenChange?: (open: boolean) => void;
}

export const AgentConnectionSection = ({
  actionPending = false,
  adminKey,
  adminPromptExample,
  adminSchemaEndpoint,
  agentMcpConfigExample,
  agentMcpEndpoint,
  agentMcpToolName,
  agentOpenApiSchemaEndpoint,
  agentRestPromptExample,
  isAdmin,
  isSaveModalOpen = false,
  onCloseSaveModal,
  onOpenSaveModal,
  onSaveProfile,
  onLoadProfile,
  onUpdateProfile,
  onDeleteProfile,
  permissionProfiles,
  permissionProfilesLoading,
  permissionProfilesError,
  userKey,
  userOpenApiSchemaEndpoint,
  userRestPromptExample,
  connectionDetailsOpen,
  onConnectionDetailsOpenChange,
}: AgentConnectionSectionProps) => {
  const [uncontrolledDetailsOpen, setUncontrolledDetailsOpen] = useState(false);
  const detailsOpen = connectionDetailsOpen ?? uncontrolledDetailsOpen;
  const setDetailsOpen =
    onConnectionDetailsOpenChange ?? setUncontrolledDetailsOpen;
  const sortedProfiles = useMemo(
    () => [...permissionProfiles].sort(comparePermissionProfiles),
    [permissionProfiles],
  );

  return (
    <section data-testid="agent-connection-page" className="flex flex-col gap-6">
      <section data-testid="agent-connection-profile-keys" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-white">
              {AGENT_CONNECTION_PAGE_COPY.profileKeysTitle}
            </h2>
            <button
              type="button"
              data-testid="agent-connection-new-profile"
              disabled={actionPending}
              onClick={onOpenSaveModal}
              className={cn(
                formControlButtonClassName,
                "shrink-0 border border-[var(--oh-border)] bg-base-secondary text-white hover:bg-surface-raised",
              )}
            >
              {AGENT_CONNECTION_PAGE_COPY.newProfileButton}
            </button>
          </div>
          <p className="text-sm leading-5 text-tertiary-light">
            {AGENT_CONNECTION_PAGE_COPY.profileKeysDescription}
          </p>
        </div>
        <SavedPermissionProfilesList
          profiles={sortedProfiles}
          isPending={permissionProfilesLoading}
          errorMessage={permissionProfilesError}
          actionPending={actionPending}
          renderTrailing={(profile) => <ProfileAgentKeyActions profile={profile} />}
          onLoadProfile={onLoadProfile}
          onUpdateProfile={onUpdateProfile}
          onDeleteProfile={onDeleteProfile}
        />
      </section>

      <KeyListSection
        testId="agent-connection-automation-keys"
        title={AGENT_CONNECTION_PAGE_COPY.automationKeysTitle}
        description={AGENT_CONNECTION_PAGE_COPY.automationKeysDescription}
      >
        <ApiKeyListRow
          testId="agent-connection-user-key-row"
          label={AGENT_CONNECTION_PAGE_COPY.userAutomationKeyTitle}
          maskedValue={
            userKey.maskedValue || AGENT_CONNECTION_PAGE_COPY.noUserAutomationKey
          }
          copied={userKey.copied}
          revealed={userKey.revealed}
          revealDisabled={false}
          onCopy={userKey.handleCopy}
          onRevealToggle={userKey.handleReveal}
          onRotate={userKey.handleRotate}
          rotateLabel={userKey.hasKey ? "Rotate" : "Create"}
        />
        {isAdmin ? (
          <ApiKeyListRow
            testId="agent-connection-admin-key-row"
            label={AGENT_CONNECTION_PAGE_COPY.adminAutomationKeyTitle}
            maskedValue={
              adminKey.maskedValue ||
              AGENT_CONNECTION_PAGE_COPY.noAdminAutomationKey
            }
            copied={adminKey.copied}
            revealed={adminKey.revealed}
            revealDisabled={false}
            onCopy={adminKey.handleCopy}
            onRevealToggle={adminKey.handleReveal}
            onRotate={adminKey.handleRotate}
            rotateLabel={adminKey.hasKey ? "Rotate" : "Create"}
          />
        ) : null}
      </KeyListSection>

      {detailsOpen ? (
        <AgentConnectionDetailsModal
          onClose={() => setDetailsOpen(false)}
          adminPromptExample={adminPromptExample}
          adminSchemaEndpoint={adminSchemaEndpoint}
          agentMcpConfigExample={agentMcpConfigExample}
          agentMcpEndpoint={agentMcpEndpoint}
          agentMcpToolName={agentMcpToolName}
          agentOpenApiSchemaEndpoint={agentOpenApiSchemaEndpoint}
          agentRestPromptExample={agentRestPromptExample}
          isAdmin={isAdmin}
          userOpenApiSchemaEndpoint={userOpenApiSchemaEndpoint}
          userRestPromptExample={userRestPromptExample}
        />
      ) : null}

      {isSaveModalOpen ? (
        <SavePermissionsModal
          actionPending={actionPending}
          onClose={onCloseSaveModal ?? (() => undefined)}
          onSave={onSaveProfile}
        />
      ) : null}
    </section>
  );
};
