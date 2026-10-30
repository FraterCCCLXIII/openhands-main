import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ACP_PROVIDERS } from "@openhands/typescript-client";
import AgentProfilesService, {
  type AgentProfileSaveInput,
} from "#/api/agent-profiles-service/agent-profiles-service.api";
import { BrandButton } from "#/components/features/settings/brand-button";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { useSaveAgentProfile } from "#/hooks/mutation/use-save-agent-profile";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useLlmProfiles } from "#/hooks/query/use-llm-profiles";
import { I18nKey } from "#/i18n/declaration";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import {
  IconAppearancePanel,
  type IconAppearanceValue,
} from "#/ui/icon-appearance-picker";
import {
  FEED_AGENT_COLORS,
  FEED_AGENT_COLOR_KEYS,
  type FeedAgentColor,
} from "#/utils/feed-agent-identity";
import {
  FEED_AGENT_ROLE_KEYS,
  type FeedAgentRoleKey,
} from "#/utils/feed-agent-role";
import { agentIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const fieldClassName =
  "w-full rounded-lg border border-border bg-base-secondary px-3 py-2 text-sm text-contrast";

const KINDS = ["openhands", "acp"] as const;
type Kind = (typeof KINDS)[number];

export const ROLE_LABEL: Record<FeedAgentRoleKey, I18nKey> = {
  conductor: I18nKey.FEED$AGENT_ROLE_CONDUCTOR,
  dispatcher: I18nKey.FEED$AGENT_ROLE_DISPATCHER,
  worker: I18nKey.FEED$AGENT_ROLE_WORKER,
  verifier: I18nKey.FEED$AGENT_ROLE_VERIFIER,
  janitor: I18nKey.FEED$AGENT_ROLE_JANITOR,
  scout: I18nKey.FEED$AGENT_ROLE_SCOUT,
};

export interface AgentProfilePrefill {
  name?: string;
  llmRef?: string;
  instructions?: string;
  role?: FeedAgentRoleKey;
  description?: string;
  color?: string;
  icon?: IconAppearanceValue;
}

interface AgentProfileModalProps {
  onClose: () => void;
  /** Name of the profile to edit; omit to create a new one. */
  editName?: string;
  /** Starting values for a new profile, such as an agent template. */
  prefill?: AgentProfilePrefill;
  /** Called with the profile name once a new profile is saved. */
  onCreated?: (name: string) => void;
}

/**
 * Creates or edits an agent profile. The Agent Server stores the name, kind,
 * model and instructions; the role, description, colour and icon are saved
 * beside it (feed-agent-config and feed-icons stores) and show wherever the
 * agent does.
 */
export function AgentProfileModal({
  onClose,
  editName,
  prefill,
  onCreated,
}: AgentProfileModalProps) {
  const { t } = useTranslation("openhands");
  const editing = Boolean(editName);
  const save = useSaveAgentProfile();
  const { data: existing } = useAgentProfiles();
  const { data: llm } = useLlmProfiles();
  const llmProfiles = llm?.profiles ?? [];
  const acpKeys = Object.keys(ACP_PROVIDERS);
  const savedConfig = useFeedAgentConfigStore((s) =>
    editName ? s.configs[editName] : undefined,
  );
  const setConfig = useFeedAgentConfigStore((s) => s.setConfig);
  const setIcon = useFeedIconsStore((s) => s.setIcon);
  const summary = (existing?.profiles ?? []).find((p) => p.name === editName);
  const savedIcon = useFeedIconsStore((s) =>
    summary?.id ? s.icons[agentIconKey(summary.id)] : undefined,
  );
  const detail = useQuery({
    queryKey: ["agent-profile-detail", editName],
    queryFn: () => AgentProfilesService.getProfile(editName as string),
    enabled: editing,
    meta: { disableToast: true },
  });

  const [name, setName] = useState(editName ?? prefill?.name ?? "");
  const [kind, setKind] = useState<Kind>("openhands");
  const [llmRef, setLlmRef] = useState(prefill?.llmRef ?? "");
  const [acpServer, setAcpServer] = useState(acpKeys[0] ?? "");
  const [instructions, setInstructions] = useState(prefill?.instructions ?? "");
  const [role, setRole] = useState<FeedAgentRoleKey>(
    savedConfig?.role ?? prefill?.role ?? "worker",
  );
  const [description, setDescription] = useState(
    savedConfig?.description ?? prefill?.description ?? "",
  );
  const [color, setColor] = useState<string | undefined>(
    savedConfig?.color ?? prefill?.color,
  );
  const [icon, setIconDraft] = useState<IconAppearanceValue>(
    savedIcon ?? prefill?.icon ?? {},
  );
  const [error, setError] = useState("");

  // Prefill the server-owned fields once the saved profile loads.
  const loaded = detail.data?.profile;
  useEffect(() => {
    if (!loaded) return;
    setKind(loaded.agent_kind);
    if (loaded.agent_kind === "openhands") {
      setLlmRef(loaded.llm_profile_ref ?? "");
      setInstructions(loaded.system_message_suffix ?? "");
    } else {
      setAcpServer(loaded.acp_server);
    }
  }, [loaded]);

  const trimmed = name.trim();
  const taken =
    !editing && (existing?.profiles ?? []).some((p) => p.name === trimmed);
  const nameProblem =
    editing || !trimmed
      ? ""
      : !NAME_PATTERN.test(trimmed)
        ? t(I18nKey.AGENTS$NAME_INVALID)
        : taken
          ? t(I18nKey.AGENTS$NAME_TAKEN)
          : "";
  const ready =
    Boolean(trimmed) &&
    !nameProblem &&
    (editing ? Boolean(loaded) : true) &&
    (kind === "openhands" ? Boolean(llmRef) : Boolean(acpServer));

  const submit = async () => {
    if (!ready) return;
    setError("");
    // Editing starts from the saved profile so fields this form does not show
    // (tools, disabled skills, ...) survive the overwrite.
    const base: Record<string, unknown> = loaded ? { ...loaded } : {};
    ["id", "revision", "schema_version", "name"].forEach((key) => {
      delete base[key];
    });
    const profile = (
      kind === "openhands"
        ? {
            ...base,
            agent_kind: "openhands",
            llm_profile_ref: llmRef,
            system_message_suffix: instructions.trim() || null,
          }
        : { ...base, agent_kind: "acp", acp_server: acpServer }
    ) as AgentProfileSaveInput;
    try {
      await save.mutateAsync({ name: trimmed, profile });
      setConfig(trimmed, {
        role,
        description: description.trim(),
        color,
      });
      const profileId =
        summary?.id ??
        (await AgentProfilesService.getProfile(trimmed)).profile.id;
      if (profileId) setIcon(agentIconKey(profileId), icon);
      if (!editing) onCreated?.(trimmed);
      onClose();
    } catch {
      setError(t(I18nKey.AGENTS$CREATE_FAILED));
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID={editing ? "edit-agent-modal" : "new-agent-modal"}
        width="md"
        className="max-h-[90vh] items-stretch overflow-y-auto border border-border"
      >
        <BaseModalTitle
          title={editing ? t(I18nKey.AGENTS$EDIT) : t(I18nKey.AGENTS$NEW)}
        />
        <SettingsInput
          testId="new-agent-name"
          label={t(I18nKey.AGENTS$FIELD_NAME)}
          type="text"
          value={name}
          onChange={setName}
          isDisabled={editing}
          className="w-full"
        />
        {nameProblem ? (
          <p role="alert" className="-mt-4 text-xs text-danger">
            {nameProblem}
          </p>
        ) : null}
        <label className="flex flex-col gap-1.5 text-sm text-contrast">
          {t(I18nKey.AGENTS$FIELD_KIND)}
          <select
            data-testid="new-agent-kind"
            value={kind}
            disabled={editing}
            onChange={(event) => setKind(event.target.value as Kind)}
            className={fieldClassName}
          >
            {KINDS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {kind === "openhands" ? (
          <>
            <label className="flex flex-col gap-1.5 text-sm text-contrast">
              {t(I18nKey.AGENTS$FIELD_LLM)}
              <select
                data-testid="new-agent-llm"
                value={llmRef}
                onChange={(event) => setLlmRef(event.target.value)}
                className={fieldClassName}
              >
                <option value="">{t(I18nKey.AGENTS$FIELD_LLM_CHOOSE)}</option>
                {llmProfiles.map((profile) => (
                  <option key={profile.name} value={profile.name}>
                    {profile.model
                      ? `${profile.name} · ${profile.model}`
                      : profile.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-contrast">
              {t(I18nKey.AGENTS$FIELD_INSTRUCTIONS)}
              <textarea
                data-testid="new-agent-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                rows={4}
                className={fieldClassName}
              />
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm text-contrast">
            {t(I18nKey.AGENTS$FIELD_ACP_SERVER)}
            <select
              data-testid="new-agent-acp-server"
              value={acpServer}
              onChange={(event) => setAcpServer(event.target.value)}
              className={fieldClassName}
            >
              {acpKeys.map((key) => (
                <option key={key} value={key}>
                  {
                    ACP_PROVIDERS[key as keyof typeof ACP_PROVIDERS]
                      .display_name
                  }
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm text-contrast">
          {t(I18nKey.AGENTS$FIELD_ROLE)}
          <select
            data-testid="new-agent-role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as FeedAgentRoleKey)
            }
            className={fieldClassName}
          >
            {FEED_AGENT_ROLE_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(ROLE_LABEL[key])}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-contrast">
          {t(I18nKey.AGENTS$FIELD_DESCRIPTION)}
          <textarea
            data-testid="new-agent-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            className={fieldClassName}
          />
        </label>
        <fieldset className="flex flex-col gap-1.5 text-sm text-contrast">
          <legend className="mb-1.5">{t(I18nKey.AGENTS$FIELD_COLOR)}</legend>
          <div className="flex flex-wrap gap-2">
            {FEED_AGENT_COLOR_KEYS.map((key: FeedAgentColor) => (
              <button
                key={key}
                type="button"
                data-testid={`new-agent-color-${key}`}
                aria-label={key}
                aria-pressed={color === key}
                onClick={() => setColor(key)}
                className={cn(
                  "size-7 rounded-full border border-border",
                  FEED_AGENT_COLORS[key],
                  color === key &&
                    "ring-2 ring-focus ring-offset-2 ring-offset-canvas-base",
                )}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-1.5 text-sm text-contrast">
          <legend className="mb-1.5">{t(I18nKey.AGENTS$FIELD_ICON)}</legend>
          <IconAppearancePanel value={icon} onChange={setIconDraft} />
        </fieldset>
        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <BrandButton
            type="button"
            variant="secondary"
            testId="new-agent-cancel"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CANCEL)}
          </BrandButton>
          <BrandButton
            type="button"
            variant="primary"
            testId="new-agent-create"
            isDisabled={!ready || save.isPending}
            onClick={() => void submit()}
          >
            {editing ? t(I18nKey.AGENTS$SAVE) : t(I18nKey.AGENTS$CREATE)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}

/** Defines a new agent profile with all of its attributes. */
export function NewAgentModal({ onClose }: { onClose: () => void }) {
  return <AgentProfileModal onClose={onClose} />;
}
