import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAdminApiKeyValue,
  createAgentApiKeyValue,
  createUserApiKeyValue,
  decryptScopedApiKey,
  encryptScopedApiKey,
  getScopedApiKeyPrefix,
  getScopedApiKeySuffix,
  hashScopedApiKey,
  normalizeOwnerId,
  requireAdminApiKeyOwner,
  toAdminApiKeyStatus,
  toUserApiKeyStatus,
} from "@/src/lib/core/scoped-api-keys";
import { encryptCredentials } from "@/src/lib/credential-crypto";
import type { AdminApiKeyRecord, UserApiKeyRecord } from "@/src/types/context-layer";

const timestamp = "2026-04-06T12:00:00.000Z";

describe("scoped-api-keys", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret-material");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,second-admin@example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes owner ids and requires allowlisted admin owners", () => {
    expect(normalizeOwnerId("  Admin@Example.COM "))
      .toBe("admin@example.com");
    expect(requireAdminApiKeyOwner("  Admin@Example.COM "))
      .toBe("admin@example.com");

    expect(() => requireAdminApiKeyOwner("   ")).toThrow(
      "A signed-in admin email is required before issuing an admin API key.",
    );
    expect(() => requireAdminApiKeyOwner("user@example.com")).toThrow(
      "Only allowlisted app administrators can manage admin API keys.",
    );
  });

  it("creates scoped API keys with stable prefixes", () => {
    expect(createAgentApiKeyValue()).toMatch(/^cla_[A-Za-z0-9_-]+$/);
    expect(createUserApiKeyValue()).toMatch(/^clu_[A-Za-z0-9_-]+$/);
    expect(createAdminApiKeyValue()).toMatch(/^clad_[A-Za-z0-9_-]+$/);
  });

  it("hashes keys and exposes fixed prefix and suffix slices", () => {
    const apiKey = "clu_1234567890abcdefghijklmnop";

    expect(hashScopedApiKey(apiKey))
      .toBe("f3834fed747f8fd04db9722eba836a6ca123b49d5e3fa3dac6afabe1b0b10c92");
    expect(getScopedApiKeyPrefix(apiKey)).toBe("clu_12345678");
    expect(getScopedApiKeySuffix(apiKey)).toBe("mnop");
  });

  it("encrypts and decrypts scoped API keys", () => {
    const apiKey = "clu_1234567890abcdefghijklmnop";

    const payload = encryptScopedApiKey(apiKey);

    expect(payload).not.toContain(apiKey);
    expect(decryptScopedApiKey(payload)).toBe(apiKey);
  });

  it("returns null when decrypted payload does not contain a string apiKey", () => {
    const payload = encryptCredentials({ apiKey: 42 });

    expect(decryptScopedApiKey(payload)).toBeNull();
  });

  it("maps user and admin records to public status objects", () => {
    const userRecord: UserApiKeyRecord = {
      ownerId: "owner@example.com",
      apiKeyHash: "user-hash",
      keyPrefix: "clu_12345678",
      keySuffix: "mnop",
      encryptedApiKey: "encrypted-user",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const adminRecord: AdminApiKeyRecord = {
      ownerId: "admin@example.com",
      apiKeyHash: "admin-hash",
      keyPrefix: "clad_123456",
      keySuffix: "qrst",
      encryptedApiKey: "encrypted-admin",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    expect(toUserApiKeyStatus(userRecord)).toEqual({
      keyPrefix: "clu_12345678",
      keySuffix: "mnop",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    expect(toAdminApiKeyStatus(adminRecord)).toEqual({
      keyPrefix: "clad_123456",
      keySuffix: "qrst",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
});
