"use client";

import { useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";

interface LegacySharedOAuthCredentialSummary {
  key: string;
  name: string;
  kind: string;
  provider: string;
  credentialKeys: string[];
  credentialCount: number;
}

interface InspectionResponse {
  legacySharedOAuthCredentials: LegacySharedOAuthCredentialSummary[];
  count: number;
  detail?: string;
}

interface ScrubResponse {
  scrubbedIntegrations: LegacySharedOAuthCredentialSummary[];
  scrubbedCount: number;
  detail?: string;
}

export function LegacySharedOAuthCleanup() {
  const [results, setResults] = useState<LegacySharedOAuthCredentialSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<{
    tone: "idle" | "success" | "error";
    message: string;
  }>({
    tone: "idle",
    message: "",
  });

  const handleInspect = async () => {
    setLoading(true);
    setStatus({ tone: "idle", message: "" });

    try {
      const response = await fetch("/api/admin/legacy-shared-oauth-credentials", {
        method: "GET",
      });
      const body = (await response.json().catch(() => null)) as InspectionResponse | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to inspect legacy shared OAuth credentials.");
      }

      setResults(body?.legacySharedOAuthCredentials ?? []);
      setStatus({
        tone: "success",
        message:
          (body?.count ?? 0) > 0
            ? `Found ${(body?.count ?? 0).toString()} shared integration${body?.count === 1 ? "" : "s"} with legacy OAuth credentials.`
            : "No legacy shared OAuth credentials were found.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to inspect legacy shared OAuth credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!results || results.length === 0) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Delete legacy shared OAuth credentials from ${results.length.toString()} shared integration${results.length === 1 ? "" : "s"}? This only scrubs embedded shared OAuth tokens; it does not affect per-user OAuth connections.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setStatus({ tone: "idle", message: "" });

    try {
      const response = await fetch("/api/admin/legacy-shared-oauth-credentials", {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as ScrubResponse | null;
      if (!response.ok) {
        throw new Error(body?.detail || "Failed to scrub legacy shared OAuth credentials.");
      }

      setResults([]);
      setStatus({
        tone: "success",
        message:
          (body?.scrubbedCount ?? 0) > 0
            ? `Deleted legacy shared OAuth credentials from ${(body?.scrubbedCount ?? 0).toString()} shared integration${body?.scrubbedCount === 1 ? "" : "s"}.`
            : "There were no legacy shared OAuth credentials to delete.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to scrub legacy shared OAuth credentials.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              Legacy shared OAuth credential cleanup
            </h3>
            <Badge tone="warning">Admin only</Badge>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-base)]">
            Scan shared integrations for embedded legacy <code className="text-white">oauth2</code>{" "}
            credentials that predate per-user connection storage. This tool only shows
            integration names and credential field names, never raw secret values.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void handleInspect()} disabled={loading || deleting}>
            {loading
              ? "Inspecting…"
              : results
                ? "Refresh legacy credential scan"
                : "Show legacy shared OAuth credentials"}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void handleDelete()}
            disabled={loading || deleting || !results || results.length === 0}
          >
            {deleting ? "Deleting…" : "Delete listed credentials"}
          </Button>
        </div>
      </div>

      {status.message ? (
        <p
          className={`mt-3 text-sm ${
            status.tone === "error"
              ? "text-[var(--color-danger)]"
              : status.tone === "success"
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-base)]"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      {results === null ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Run the inspection before deleting anything.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          No legacy shared OAuth credentials are currently stored on shared integrations.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {results.map((item) => (
            <div
              key={item.key}
              className="flex flex-wrap items-center gap-2 px-3 py-3 text-sm text-[var(--color-text-base)]"
            >
              <span className="font-medium text-white">{item.name}</span>
              <span className="text-[var(--color-text-muted)]">({item.key})</span>
              <Badge>{item.provider}</Badge>
              <Badge>{item.kind}</Badge>
              <span className="text-[var(--color-text-muted)]">Fields:</span>
              {item.credentialKeys.map((field) => (
                <Badge key={field} tone="warning">
                  {field}
                </Badge>
              ))}
              <span className="text-[var(--color-text-muted)]">
                {item.credentialCount} stored field{item.credentialCount === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
