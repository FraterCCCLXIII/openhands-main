import { describe, expect, it } from "vitest";
import {
  SECRET_NAME_MAX_LENGTH,
  buildFactorySecretName,
  factorySecretPrefix,
  isFactoryScopedSecretName,
  maxFactorySecretEntryLength,
  parseFactorySecretName,
} from "#/utils/factory-secrets";

describe("factory secret scoping", () => {
  it("round-trips an entry name through the stored secret name", () => {
    const stored = buildFactorySecretName("web", "GITHUB_TOKEN");

    expect(stored).not.toBeNull();
    expect(parseFactorySecretName("web", stored!)).toBe("GITHUB_TOKEN");
  });

  it("keeps stored names valid for the secret store for hyphenated ids", () => {
    const stored = buildFactorySecretName("custom-billing-ops-lx9", "KEY");

    expect(stored).toMatch(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/);
  });

  it("does not read another factory's or an unscoped secret as its own", () => {
    const other = buildFactorySecretName("web-x", "KEY")!;

    expect(parseFactorySecretName("web", other)).toBeNull();
    expect(parseFactorySecretName("web", "GITHUB_TOKEN")).toBeNull();
    expect(
      parseFactorySecretName("web", factorySecretPrefix("web")!),
    ).toBeNull();
  });

  it("rejects entry names the store or the convention cannot hold", () => {
    expect(buildFactorySecretName("web", "has space")).toBeNull();
    expect(buildFactorySecretName("web", "_leading")).toBeNull();
    expect(buildFactorySecretName("web", "")).toBeNull();
    expect(buildFactorySecretName("!!!", "KEY")).toBeNull();
    const tooLong = "A".repeat(maxFactorySecretEntryLength("web") + 1);
    expect(buildFactorySecretName("web", tooLong)).toBeNull();
    const longest = "A".repeat(maxFactorySecretEntryLength("web"));
    expect(buildFactorySecretName("web", longest)).toHaveLength(
      SECRET_NAME_MAX_LENGTH,
    );
  });

  it("maps ids that differ only by punctuation to one prefix (documented limit)", () => {
    expect(factorySecretPrefix("a-b")).toBe(factorySecretPrefix("a_b"));
  });

  it("tells scoped secret names from shared ones", () => {
    expect(isFactoryScopedSecretName(buildFactorySecretName("web", "K")!)).toBe(
      true,
    );
    expect(isFactoryScopedSecretName("OPENAI_API_KEY")).toBe(false);
  });
});
