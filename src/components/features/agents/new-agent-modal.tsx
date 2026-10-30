import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ACP_PROVIDERS } from "@openhands/typescript-client";
import type { AgentProfileSaveInput } from "#/api/agent-profiles-service/agent-profiles-service.api";
import { BrandButton } from "#/components/features/settings/brand-button";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { useSaveAgentProfile } from "#/hooks/mutation/use-save-agent-profile";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useLlmProfiles } from "#/hooks/query/use-llm-profiles";
import { I18nKey } from "#/i18n/declaration";

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const fieldClassName =
  "w-full rounded-lg border border-border bg-base-secondary px-3 py-2 text-sm text-contrast";

const KINDS = ["openhands", "acp"] as const;
type Kind = (typeof KINDS)[number];

/** Defines a new agent profile: its kind, the model it runs on and optional instructions. */
export function NewAgentModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("openhands");
  const save = useSaveAgentProfile();
  const { data: existing } = useAgentProfiles();
  const { data: llm } = useLlmProfiles();
  const llmProfiles = llm?.profiles ?? [];
  const acpKeys = Object.keys(ACP_PROVIDERS);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("openhands");
  const [llmRef, setLlmRef] = useState("");
  const [acpServer, setAcpServer] = useState(acpKeys[0] ?? "");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");

  const trimmed = name.trim();
  const taken = (existing?.profiles ?? []).some((p) => p.name === trimmed);
  const nameProblem = !trimmed
    ? ""
    : !NAME_PATTERN.test(trimmed)
      ? t(I18nKey.AGENTS$NAME_INVALID)
      : taken
        ? t(I18nKey.AGENTS$NAME_TAKEN)
        : "";
  const ready =
    Boolean(trimmed) &&
    !nameProblem &&
    (kind === "openhands" ? Boolean(llmRef) : Boolean(acpServer));

  const create = async () => {
    if (!ready) return;
    setError("");
    const profile = (
      kind === "openhands"
        ? {
            agent_kind: "openhands",
            llm_profile_ref: llmRef,
            ...(instructions.trim()
              ? { system_message_suffix: instructions.trim() }
              : {}),
          }
        : { agent_kind: "acp", acp_server: acpServer }
    ) as AgentProfileSaveInput;
    try {
      await save.mutateAsync({ name: trimmed, profile });
      onClose();
    } catch {
      setError(t(I18nKey.AGENTS$CREATE_FAILED));
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="new-agent-modal"
        width="md"
        className="items-stretch border border-border"
      >
        <BaseModalTitle title={t(I18nKey.AGENTS$NEW)} />
        <SettingsInput
          testId="new-agent-name"
          label={t(I18nKey.AGENTS$FIELD_NAME)}
          type="text"
          value={name}
          onChange={setName}
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
            onClick={() => void create()}
          >
            {t(I18nKey.AGENTS$CREATE)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
