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
import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import {
  AGENT_CONNECTION_PAGE_COPY,
  permissionProfilesCountAriaLabel,
} from "@/src/constants/agent-connection-page";
import { fetchJson } from "@/src/lib/fetch-json";
import { cn } from "@/src/lib/utils";
import type { PermissionProfile } from "@/src/types/integrations-hub";
import {
  settingsListContainerClassName,
  settingsListDividerClassName,
  settingsListIconActionButtonClassName,
  settingsListRowClassName,
} from "@/src/styles/settings-list-classes";

const profileLabel = (profile: PermissionProfile) =>
  profile.name ?? "Default profile";

interface ApiKeyListRowProps {
  badgeLabel: string;
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
  badgeLabel,
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
        <span className="shrink-0 rounded-md border border-[var(--oh-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-tertiary-light">
          {badgeLabel}
        </span>
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-tertiary-light">
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

function ProfileAgentKeyListRow({
  profile,
}: {
  profile: PermissionProfile;
}) {
  const label = `${profileLabel(profile)} agent key`;
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

  return (
    <ApiKeyListRow
      testId="agent-connection-agent-key-row"
      label={label}
      badgeLabel={profile.name ? "Named" : "Default"}
      maskedValue={
        hasKey
          ? maskApiKey(agentApiKey, revealed)
          : keyActionError ?? AGENT_CONNECTION_PAGE_COPY.noProfileAgentKey
      }
      copied={copied}
      revealed={revealed}
      revealDisabled={!hasKey}
      onCopy={handleCopy}
      onRevealToggle={() => setRevealed((current) => !current)}
      onRotate={handleRotate}
      rotateDisabled={keyActionPending}
      rotateLabel={
        keyActionPending
          ? hasKey
            ? "Rotating"
            : "Provisioning"
          : hasKey
            ? "Rotate"
            : "Provision"
      }
    />
  );
}

interface AgentConnectionSectionProps {
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
  adminKey,
  adminPromptExample,
  adminSchemaEndpoint,
  agentMcpConfigExample,
  agentMcpEndpoint,
  agentMcpToolName,
  agentOpenApiSchemaEndpoint,
  agentRestPromptExample,
  isAdmin,
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
  const defaultProfileId = useMemo(
    () =>
      permissionProfiles.find((profile) => profile.name === null)?.id ??
      permissionProfiles[0]?.id ??
      "",
    [permissionProfiles],
  );
  const [selectedProfileId, setSelectedProfileId] = useState(defaultProfileId);

  useEffect(() => {
    if (!defaultProfileId) {
      setSelectedProfileId("");
      return;
    }

    const selectedProfileExists = permissionProfiles.some(
      (profile) => profile.id === selectedProfileId,
    );
    if (!selectedProfileId || !selectedProfileExists) {
      setSelectedProfileId(defaultProfileId);
    }
  }, [defaultProfileId, permissionProfiles, selectedProfileId]);

  const selectedProfile =
    permissionProfiles.find((profile) => profile.id === selectedProfileId) ??
    permissionProfiles.find((profile) => profile.id === defaultProfileId);

  const profileOptions = permissionProfiles.map((profile) => ({
    value: profile.id,
    label: profileLabel(profile),
  }));

  let agentKeyRow: ReactNode;
  if (selectedProfile) {
    agentKeyRow = (
      <ProfileAgentKeyListRow key={selectedProfile.id} profile={selectedProfile} />
    );
  } else {
    agentKeyRow = (
      <div
        data-testid="agent-connection-agent-key-empty"
        className={cn(settingsListRowClassName, "text-sm text-tertiary-light")}
      >
        {permissionProfilesError
          ? `Unable to load agent key: ${permissionProfilesError}`
          : permissionProfilesLoading
            ? "Loading agent key…"
            : "No agent key available. Save a permission profile to provision one."}
      </div>
    );
  }

  return (
    <section data-testid="agent-connection-page" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-white">
          {AGENT_CONNECTION_PAGE_COPY.apiKeysTitle}
        </h2>
        <p className="text-sm leading-5 text-tertiary-light">
          {AGENT_CONNECTION_PAGE_COPY.apiKeysDescription}
        </p>
      </div>

      {permissionProfiles.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-tertiary-light">
            {AGENT_CONNECTION_PAGE_COPY.permissionProfileLabel}
          </span>
          <SelectDropdown
            testId="agent-connection-permission-profile-select"
            ariaLabel={AGENT_CONNECTION_PAGE_COPY.permissionProfileLabel}
            value={selectedProfile?.id ?? ""}
            options={profileOptions}
            onChange={setSelectedProfileId}
            variant="filter"
            className="min-w-[12rem]"
          />
          <span
            className="text-xs text-tertiary-light"
            aria-label={permissionProfilesCountAriaLabel(permissionProfiles.length)}
          >
            {permissionProfiles.length}{" "}
            {AGENT_CONNECTION_PAGE_COPY.profilesCountLabel.toLowerCase()}
          </span>
        </div>
      ) : null}

      <div
        className={cn(settingsListContainerClassName, settingsListDividerClassName)}
      >
        {agentKeyRow}
        <ApiKeyListRow
          testId="agent-connection-user-key-row"
          label={AGENT_CONNECTION_PAGE_COPY.userAutomationKeyTitle}
          badgeLabel={AGENT_CONNECTION_PAGE_COPY.userAutomationKeyBadge}
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
            badgeLabel={AGENT_CONNECTION_PAGE_COPY.adminAutomationKeyBadge}
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
      </div>

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
    </section>
  );
};
