import { z } from "zod";

import {
  MAX_CASE_BY_CASE_APPROVAL_MINUTES,
} from "@/src/lib/access-requests";

export const toolAccessModeSchema = z.enum([
  "enabled",
  "disabled",
  "approval_required",
]);
export const accessRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export const notificationChannelSchema = z.enum(["email", "in_app", "sms"]);
export const integrationProviderSchema = z.enum(["composio", "mcp", "mock", "http"]);
export const integrationKindSchema = z.enum(["api", "mcp"]);
export const authStrategySchema = z.enum([
  "none",
  "api_key",
  "bearer",
  "basic",
  "oauth2",
  "mcp_session",
]);

const nullableAgentIdentitySchema = z.preprocess(
  (value) => {
    if (value == null) {
      return null;
    }

    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  },
  z.string().min(1).nullable(),
);

export const toolSpecSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  enabled: z.boolean().default(true),
  accessMode: toolAccessModeSchema.default("enabled"),
  maxAccessMode: toolAccessModeSchema.optional(),
  fineGrainedPermissions: z.boolean().default(true),
  defaultScopes: z.array(z.string()).default([]),
  executionMode: z.enum(["provider", "mock"]).default("provider"),
  config: z.record(z.string(), z.unknown()).default({}),
  mockResponse: z.record(z.string(), z.unknown()).optional(),
});


export const integrationSpecSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  kind: integrationKindSchema,
  provider: integrationProviderSchema,
  authStrategy: authStrategySchema,
  enabled: z.boolean().default(true),
  fineGrainedPermissions: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
  tools: z.record(z.string(), toolSpecSchema).default({}),
});

export const policyRuleSchema = z.object({
  integrationKey: z.string().min(1),
  toolNames: z.array(z.string()).default([]),
  scopes: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

export const agentClassPolicySchema = z.object({
  agentClass: z.string().min(1),
  rules: z.array(policyRuleSchema).default([]),
});

export const accessRequestAgentDataSchema = z.object({
  conversationLink: z.string().trim().min(1).optional(),
});

export const accessRequestSchema = z.object({
  id: z.string().min(1),
  agentId: nullableAgentIdentitySchema,
  agentClass: nullableAgentIdentitySchema,
  integrationKey: z.string().min(1),
  toolName: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  requestedMinutes: z.number().int().positive().default(30),
  channels: z.array(notificationChannelSchema).default([]),
  notificationTargets: z.record(z.string(), z.string()).default({}),
  justification: z.string().optional().default(""),
  agentData: accessRequestAgentDataSchema.optional().default({}),
  createdAt: z.string().datetime(),
  status: accessRequestStatusSchema,
  decidedAt: z.string().datetime().optional(),
  decidedBy: z.string().optional(),
});

export const temporaryGrantSchema = z.object({
  id: z.string().min(1),
  agentId: nullableAgentIdentitySchema,
  agentClass: nullableAgentIdentitySchema,
  integrationKey: z.string().min(1),
  toolName: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  grantedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const integrationConnectionStatusSchema = z.object({
  integrationKey: z.string(),
  provider: z.string(),
  authStrategy: authStrategySchema,
  tokenType: z.string().optional(),
  scopes: z.array(z.string()),
  expiresAt: z.string().optional(),
  externalAccountId: z.string().optional(),
  externalWorkspaceId: z.string().optional(),
  displayName: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const accessDecisionSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  effectiveScopes: z.array(z.string()),
});

export const contextInvocationResultSchema = z.object({
  integration: z.string(),
  tool: z.string(),
  provider: integrationProviderSchema,
  kind: integrationKindSchema,
  authStrategy: authStrategySchema,
  decision: accessDecisionSchema,
  data: z.unknown(),
});

export const notificationRecordSchema = z.object({
  id: z.string().min(1),
  channel: notificationChannelSchema,
  recipient: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
});

export const integrationCreateSchema = integrationSpecSchema;
export const toolCreateSchema = toolSpecSchema;
export const policyUpdateSchema = z.object({
  rules: z.array(policyRuleSchema),
});
export const accessRequestCreateSchema = accessRequestSchema.omit({
  id: true,
  createdAt: true,
  status: true,
  decidedAt: true,
  decidedBy: true,
});
export const accessRequestDecisionSchema = z.object({
  approver: z.string().min(1),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(MAX_CASE_BY_CASE_APPROVAL_MINUTES)
    .optional(),
});
export const disableUnusedToolsSchema = z.object({
  thresholdValue: z.number().int().positive().max(3650),
  thresholdUnit: z.enum(["days", "weeks", "months"]),
});
export const contextInvokeSchema = z.object({
  agentId: nullableAgentIdentitySchema.default(null),
  agentClass: nullableAgentIdentitySchema.default(null),
  scopes: z.array(z.string()).default([]),
  payload: z.record(z.string(), z.unknown()).default({}),
});
