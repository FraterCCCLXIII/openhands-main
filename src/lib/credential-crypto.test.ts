import { describe, expect, it } from "vitest";

import { decryptCredentials, encryptCredentials } from "@/src/lib/credential-crypto";

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe("credential-crypto", () => {
  it("encrypts and decrypts credentials with a dedicated encryption key", () => {
    const secrets = env({ CREDENTIAL_ENCRYPTION_KEY: "top-secret" });

    const payload = encryptCredentials({ accessToken: "token-123", refreshToken: "refresh-456" }, secrets);

    expect(decryptCredentials(payload, secrets)).toEqual({
      accessToken: "token-123",
      refreshToken: "refresh-456",
    });
  });

  it("does not fall back to auth secrets for credential encryption", () => {
    const authOnlyEnv = env({ AUTH_SECRET: "top-secret", NEXTAUTH_SECRET: "nextauth-secret" });

    expect(() => encryptCredentials({ accessToken: "token-123" }, authOnlyEnv)).toThrow(
      "CREDENTIAL_ENCRYPTION_KEY must be configured to encrypt stored provider credentials.",
    );
  });

  it("requires explicit secret material even outside production", () => {
    const developmentEnv = env({ NODE_ENV: "development" });

    expect(() => encryptCredentials({ accessToken: "token-123" }, developmentEnv)).toThrow(
      "CREDENTIAL_ENCRYPTION_KEY must be configured to encrypt stored provider credentials.",
    );
  });
});
