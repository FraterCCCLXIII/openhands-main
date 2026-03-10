import { randomUUID } from "node:crypto";

import { z } from "zod";

import { nowIso } from "@/src/lib/core/date";
import type { NotificationRecord } from "@/src/types/context-layer";

const normalizeOptional = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const connectorRequestCreateSchema = z.object({
  requesterName: z.string().trim().max(120).default(""),
  requesterEmail: z.string().trim().email().or(z.literal("")).default(""),
  providerName: z.string().trim().min(1),
  providerSlug: z.string().trim().max(120).default(""),
  providerUrl: z.string().trim().url().or(z.literal("")).default(""),
  docsUrl: z.string().trim().url().or(z.literal("")).default(""),
  authorizationUrl: z.string().trim().url().or(z.literal("")).default(""),
  tokenUrl: z.string().trim().url().or(z.literal("")).default(""),
  scopes: z.string().trim().default(""),
  useCase: z.string().trim().min(1),
  notes: z.string().trim().default(""),
});

export type ConnectorRequestSubmission = z.infer<
  typeof connectorRequestCreateSchema
>;

export const getAdminContactEmail = (adminEmail = process.env.ADMIN_EMAIL) =>
  normalizeOptional(adminEmail);

export const getAdminContactInstruction = (
  adminEmail = process.env.ADMIN_EMAIL,
) => {
  const email = getAdminContactEmail(adminEmail);
  return email ? `contact ${email}` : "contact an admin";
};

export const getConnectorRequestRecipient = (
  adminEmail = process.env.ADMIN_EMAIL,
) => getAdminContactEmail(adminEmail) ?? "admin";

export const parseConnectorRequestScopes = (scopes: string) =>
  scopes
    .split(/[\n,]/)
    .map((scope) => scope.trim())
    .filter(Boolean);

export const buildConnectorRequestNotification = (
  submission: ConnectorRequestSubmission,
  adminEmail = process.env.ADMIN_EMAIL,
): NotificationRecord => {
  const requester =
    normalizeOptional(submission.requesterName) ??
    normalizeOptional(submission.requesterEmail) ??
    "A user";

  return {
    id: randomUUID(),
    channel: "in_app",
    recipient: getConnectorRequestRecipient(adminEmail),
    subject: `Connector request: ${submission.providerName}`,
    body: `${requester} requested OAuth setup guidance for ${submission.providerName}. ${submission.useCase}`,
    metadata: {
      source: "add-connector",
      requesterName: normalizeOptional(submission.requesterName),
      requesterEmail: normalizeOptional(submission.requesterEmail),
      providerName: submission.providerName,
      providerSlug: normalizeOptional(submission.providerSlug),
      providerUrl: normalizeOptional(submission.providerUrl),
      docsUrl: normalizeOptional(submission.docsUrl),
      authorizationUrl: normalizeOptional(submission.authorizationUrl),
      tokenUrl: normalizeOptional(submission.tokenUrl),
      scopes: parseConnectorRequestScopes(submission.scopes),
      useCase: submission.useCase,
      notes: normalizeOptional(submission.notes),
    },
    createdAt: nowIso(),
  };
};
