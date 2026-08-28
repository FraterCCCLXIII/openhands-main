"use client";

import { useState, type FormEvent } from "react";

import { integrationWizardInputClassName } from "@/src/components/integrations/wizard/utils";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalFooterActionsClassName, modalShellClassName } from "@/src/components/ui/modal-shell";
import { ADMIN_INTEGRATIONS_PAGE_COPY } from "@/src/constants/admin-integrations-page";
import { fetchJson } from "@/src/lib/fetch-json";
import { cn } from "@/src/lib/utils";
import type { AuthStrategy, ManagedConnectorDefinition } from "@/src/types/integrations-hub";

const COPY = ADMIN_INTEGRATIONS_PAGE_COPY;

export type CustomMcpAuthStrategy = Extract<AuthStrategy, "none" | "bearer" | "api_key">;

const AUTH_OPTIONS: ReadonlyArray<{ value: CustomMcpAuthStrategy; label: string }> = [
  { value: "bearer", label: COPY.addCustomMcpAuthBearer },
  { value: "api_key", label: COPY.addCustomMcpAuthApiKey },
  { value: "none", label: COPY.addCustomMcpAuthNone },
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugFromDisplayName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function credentialCopy(auth: CustomMcpAuthStrategy) {
  if (auth === "api_key") {
    return {
      credentialLabel: "API key",
      credentialPlaceholder: "Paste API key",
      credentialHelp: "Secret used with a header.",
    };
  }
  if (auth === "bearer") {
    return {
      credentialLabel: "Access token",
      credentialPlaceholder: "OAuth or bearer token",
      credentialHelp: "Use this for bearer-token MCP servers.",
    };
  }
  return {
    credentialLabel: "No auth",
    credentialPlaceholder: "No credential required",
    credentialHelp: "This MCP server does not require credentials.",
  };
}

export function buildCustomMcpPayload(input: {
  name: string;
  slug: string;
  serverUrl: string;
  authStrategy: CustomMcpAuthStrategy;
}) {
  const credentials = credentialCopy(input.authStrategy);
  return {
    slug: input.slug,
    name: input.name,
    description: `Custom MCP server at ${input.serverUrl}`,
    categories: ["Custom"],
    authModes: [input.authStrategy],
    authStrategy: input.authStrategy,
    provider: "mcp" as const,
    serverUrl: input.serverUrl,
    ...credentials,
    enabled: true,
    tools: [],
  };
}

interface AddCustomMcpModalProps {
  existingSlugs: string[];
  onClose: () => void;
  onRegistered: (connector: ManagedConnectorDefinition) => void;
  initialName?: string;
}

export function AddCustomMcpModal({
  existingSlugs,
  onClose,
  onRegistered,
  initialName = "",
}: AddCustomMcpModalProps) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(() => slugFromDisplayName(initialName));
  const [slugTouched, setSlugTouched] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [authStrategy, setAuthStrategy] = useState<CustomMcpAuthStrategy>("bearer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const takenSlugs = new Set(existingSlugs.map((value) => value.toLowerCase()));

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugFromDisplayName(value));
    }
  };

  const validate = (): string | null => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const trimmedUrl = serverUrl.trim();
    if (!trimmedName) return COPY.addCustomMcpNameRequired;
    if (!trimmedSlug) return COPY.addCustomMcpSlugRequired;
    if (!SLUG_PATTERN.test(trimmedSlug)) return COPY.addCustomMcpSlugInvalid;
    if (takenSlugs.has(trimmedSlug.toLowerCase())) return COPY.addCustomMcpSlugTaken;
    if (!trimmedUrl) return COPY.addCustomMcpUrlRequired;
    if (!isValidHttpUrl(trimmedUrl)) return COPY.addCustomMcpUrlInvalid;
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const connector = await fetchJson<ManagedConnectorDefinition>(
        "/api/admin/modify-integrations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildCustomMcpPayload({
              name: name.trim(),
              slug: slug.trim(),
              serverUrl: serverUrl.trim(),
              authStrategy,
            }),
          ),
        },
      );
      onRegistered(connector);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to register custom MCP server.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop ariaLabel={COPY.addCustomMcpModalAriaLabel} onClose={onClose}>
      <section
        data-testid="add-custom-mcp-modal"
        className={cn(modalShellClassName("lg"), "min-h-0")}
      >
        <ModalCloseButton onClose={onClose} testId="add-custom-mcp-modal-close" />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void handleSubmit(event)}>
          <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-4 pt-7">
            <h2 className="pr-8 text-base font-semibold text-white">
              {COPY.addCustomMcpModalTitle}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              {COPY.addCustomMcpModalDescription}
            </p>

            <div className="mt-6 grid gap-3">
              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">{COPY.addCustomMcpNameLabel}</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder={COPY.addCustomMcpNamePlaceholder}
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  autoComplete="off"
                />
              </label>

              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">{COPY.addCustomMcpSlugLabel}</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder={COPY.addCustomMcpSlugPlaceholder}
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                  autoComplete="off"
                />
                <span className="text-xs leading-5 text-[var(--color-text-base)]">
                  {COPY.addCustomMcpSlugHelp}
                </span>
              </label>

              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">{COPY.addCustomMcpServerUrlLabel}</span>
                <input
                  className={integrationWizardInputClassName}
                  placeholder={COPY.addCustomMcpServerUrlPlaceholder}
                  value={serverUrl}
                  onChange={(event) => setServerUrl(event.target.value)}
                  autoComplete="off"
                />
              </label>

              <label className="grid gap-1.5 text-sm text-white">
                <span className="font-medium">{COPY.addCustomMcpAuthLabel}</span>
                <select
                  className={integrationWizardInputClassName}
                  value={authStrategy}
                  onChange={(event) =>
                    setAuthStrategy(event.target.value as CustomMcpAuthStrategy)
                  }
                >
                  {AUTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? (
              <p className="mt-4 text-sm text-[var(--oh-color-danger)]" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className={cn(modalFooterActionsClassName, "border-t border-[var(--oh-border)] px-7 py-4")}>
            <BrandButton type="button" variant="secondary" onClick={onClose} isDisabled={submitting}>
              {COPY.addCustomMcpCancelLabel}
            </BrandButton>
            <BrandButton type="submit" variant="primary" isDisabled={submitting}>
              {submitting ? COPY.addCustomMcpSubmittingLabel : COPY.addCustomMcpSubmitLabel}
            </BrandButton>
          </div>
        </form>
      </section>
    </ModalBackdrop>
  );
}
