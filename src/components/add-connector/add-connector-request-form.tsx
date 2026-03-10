"use client";

import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { getAdminContactInstruction } from "@/src/lib/integrations/connector-requests";

const inputClassName =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[var(--color-accent)]";

const INITIAL_FORM = {
  requesterName: "",
  requesterEmail: "",
  providerName: "",
  providerSlug: "",
  providerUrl: "",
  docsUrl: "",
  authorizationUrl: "",
  tokenUrl: "",
  scopes: "",
  useCase: "",
  notes: "",
};

export const AddConnectorRequestForm = ({
  adminEmail,
}: {
  adminEmail: string | null;
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
          const response = await fetch("/api/add-connector", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
          });
          const body = (await response.json().catch(() => null)) as {
            detail?: string;
          } | null;

          if (!response.ok) {
            throw new Error(body?.detail ?? "Could not submit connector request.");
          }

          setForm(INITIAL_FORM);
          setStatus(
            body?.detail ??
              `Submitted. Next step: ${getAdminContactInstruction(adminEmail ?? undefined)} for follow-up.`,
          );
        } catch (error) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Could not submit connector request.",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">Your name</span>
          <input
            className={inputClassName}
            value={form.requesterName}
            onChange={(event) => updateField("requesterName", event.target.value)}
            placeholder="Alex Example"
          />
        </label>

        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">Your email</span>
          <input
            className={inputClassName}
            type="email"
            value={form.requesterEmail}
            onChange={(event) => updateField("requesterEmail", event.target.value)}
            placeholder="alex@example.com"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">Provider name</span>
          <input
            className={inputClassName}
            value={form.providerName}
            onChange={(event) => updateField("providerName", event.target.value)}
            placeholder="HubSpot"
            required
          />
        </label>

        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">Provider slug</span>
          <input
            className={inputClassName}
            value={form.providerSlug}
            onChange={(event) => updateField("providerSlug", event.target.value)}
            placeholder="hubspot"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">Provider app URL</span>
          <input
            className={inputClassName}
            type="url"
            value={form.providerUrl}
            onChange={(event) => updateField("providerUrl", event.target.value)}
            placeholder="https://app.hubspot.com"
          />
        </label>

        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">OAuth docs URL</span>
          <input
            className={inputClassName}
            type="url"
            value={form.docsUrl}
            onChange={(event) => updateField("docsUrl", event.target.value)}
            placeholder="https://developers.hubspot.com/docs/api/oauth-quickstart-guide"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">Authorization URL</span>
          <input
            className={inputClassName}
            type="url"
            value={form.authorizationUrl}
            onChange={(event) => updateField("authorizationUrl", event.target.value)}
            placeholder="https://app.hubspot.com/oauth/authorize"
          />
        </label>

        <label className="grid gap-2 text-sm text-white">
          <span className="font-medium">Token URL</span>
          <input
            className={inputClassName}
            type="url"
            value={form.tokenUrl}
            onChange={(event) => updateField("tokenUrl", event.target.value)}
            placeholder="https://api.hubapi.com/oauth/v1/token"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-white">
        <span className="font-medium">Requested scopes</span>
        <textarea
          className={`${inputClassName} min-h-24 resize-y`}
          value={form.scopes}
          onChange={(event) => updateField("scopes", event.target.value)}
          placeholder="crm.objects.contacts.read, crm.objects.contacts.write"
        />
        <span className="text-xs leading-6 text-[var(--color-text-base)]">
          Separate scopes with commas or one per line.
        </span>
      </label>

      <label className="grid gap-2 text-sm text-white">
        <span className="font-medium">Use case</span>
        <textarea
          className={`${inputClassName} min-h-28 resize-y`}
          value={form.useCase}
          onChange={(event) => updateField("useCase", event.target.value)}
          placeholder="We want agents to update CRM notes and create follow-up tasks after support calls."
          required
        />
      </label>

      <label className="grid gap-2 text-sm text-white">
        <span className="font-medium">Extra notes</span>
        <textarea
          className={`${inputClassName} min-h-24 resize-y`}
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Any callback URL constraints, tenant requirements, or security notes."
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-[var(--color-text-base)]">
          Admins can add a new connector in source by updating
          <code className="mx-1 text-white">src/lib/integrations/built-in-connectors.ts</code>
          and the matching
          <code className="mx-1 text-white">app/api/mcp/&lt;provider&gt;/route.ts</code>,
          or register a service-level OAuth MCP through the admin flow on this
          page. Submitted details are still saved as in-app notifications so the
          team can review and prioritize requests.
        </p>
        <Button className="h-10 rounded-lg px-4" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting..." : "Submit provider information"}
        </Button>
      </div>

      {status ? (
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-active)]">
          {status}
        </p>
      ) : null}
    </form>
  );
};
