import { createHash, randomBytes } from "node:crypto";

import { isAppAdminEmail } from "@/src/lib/app-admins";
import { ContextLayerError } from "@/src/lib/core/errors";
import { decryptCredentials, encryptCredentials } from "@/src/lib/credential-crypto";
import type {
  AdminApiKeyRecord,
  AdminApiKeyStatus,
  UserApiKeyRecord,
  UserApiKeyStatus,
} from "@/src/types/context-layer";

const USER_API_KEY_PREFIX_LENGTH = 12;
const USER_API_KEY_SUFFIX_LENGTH = 4;

export const normalizeOwnerId = (ownerId: string) => ownerId.trim().toLowerCase();

export const requireAdminApiKeyOwner = (ownerId: string) => {
  const normalizedOwnerId = normalizeOwnerId(ownerId);

  if (!normalizedOwnerId) {
    throw new ContextLayerError(
      "A signed-in admin email is required before issuing an admin API key.",
      400,
    );
  }

  if (!isAppAdminEmail(normalizedOwnerId)) {
    throw new ContextLayerError(
      "Only allowlisted app administrators can manage admin API keys.",
      403,
    );
  }

  return normalizedOwnerId;
};

export const createAgentApiKeyValue = () =>
  `cla_${randomBytes(24).toString("base64url")}`;
export const createUserApiKeyValue = () =>
  `clu_${randomBytes(32).toString("base64url")}`;
export const createAdminApiKeyValue = () =>
  `clad_${randomBytes(32).toString("base64url")}`;

export const hashScopedApiKey = (apiKey: string) =>
  createHash("sha256").update(apiKey).digest("hex");

export const getScopedApiKeyPrefix = (apiKey: string) =>
  apiKey.slice(0, USER_API_KEY_PREFIX_LENGTH);

export const getScopedApiKeySuffix = (apiKey: string) =>
  apiKey.slice(-USER_API_KEY_SUFFIX_LENGTH);

export const encryptScopedApiKey = (apiKey: string) =>
  encryptCredentials({ apiKey });

export const decryptScopedApiKey = (payload: string) => {
  const credentials = decryptCredentials<{ apiKey?: string }>(payload);
  return typeof credentials.apiKey === "string" ? credentials.apiKey : null;
};

export const toUserApiKeyStatus = (
  record: UserApiKeyRecord,
): UserApiKeyStatus => ({
  keyPrefix: record.keyPrefix,
  keySuffix: record.keySuffix,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export const toAdminApiKeyStatus = (
  record: AdminApiKeyRecord,
): AdminApiKeyStatus => ({
  keyPrefix: record.keyPrefix,
  keySuffix: record.keySuffix,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
