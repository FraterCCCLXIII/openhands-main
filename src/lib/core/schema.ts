import { z } from "zod";

import {
  MAX_CASE_BY_CASE_APPROVAL_MINUTES,
} from "@/src/lib/access-requests";

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
  accessMode: z
    .enum(["enabled", "disabled", "approval_required"])
    .default("enabled"),
  fineGrainedPermissions: z.boolean().default(true),
  defaultScopes: z.array(z.string()).default([]),
  executionMode: z.enum(["provider", "mock"]).default("provider"),
  config: z.record(z.string(), z.unknown()).default({}),
  mockResponse: z.record(z.string(), z.unknown()).optional(),
});

export const functionSpecSchema = toolSpecSchema;

export const integrationSpecSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["api", "mcp"]),
  provider: z.enum(["composio", "mcp", "mock", "http"]),
  authStrategy: z.enum([
    "none",
    "api_key",
    "bearer",
    "basic",
    "oauth2",
    "mcp_session",
  ]),
  enabled: z.boolean().default(true),
  fineGrainedPermissions: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
  functions: z.record(z.string(), functionSpecSchema).default({}),
});

export const policyRuleSchema = z.object({
  integrationKey: z.string().min(1),
  functionNames: z.array(z.string()).default([]),
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
  functionName: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  requestedMinutes: z.number().int().positive().default(30),
  channels: z.array(z.enum(["email", "in_app", "sms"])).default([]),
  notificationTargets: z.record(z.string(), z.string()).default({}),
  justification: z.string().optional().default(""),
  agentData: accessRequestAgentDataSchema.optional().default({}),
  createdAt: z.string().datetime(),
  status: z.enum(["pending", "approved", "rejected", "expired"]),
  decidedAt: z.string().datetime().optional(),
  decidedBy: z.string().optional(),
});

export const temporaryGrantSchema = z.object({
  id: z.string().min(1),
  agentId: nullableAgentIdentitySchema,
  agentClass: nullableAgentIdentitySchema,
  integrationKey: z.string().min(1),
  functionName: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  grantedBy: z.string().min(1),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const notificationRecordSchema = z.object({
  id: z.string().min(1),
  channel: z.enum(["email", "in_app", "sms"]),
  recipient: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
});

export const integrationCreateSchema = integrationSpecSchema;
export const toolCreateSchema = toolSpecSchema;
export const functionCreateSchema = toolCreateSchema;
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
export const disableUnusedFunctionsSchema = z.object({
  thresholdValue: z.number().int().positive().max(3650),
  thresholdUnit: z.enum(["days", "weeks", "months"]),
});
export const contextInvokeSchema = z.object({
  agentId: nullableAgentIdentitySchema.default(null),
  agentClass: nullableAgentIdentitySchema.default(null),
  scopes: z.array(z.string()).default([]),
  payload: z.record(z.string(), z.unknown()).default({}),
});
