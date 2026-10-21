import { describe, expect, it } from "vitest";
import {
  formatModelPillLabel,
  formatModelPrettyLabel,
  formatProviderName,
  getModelProvider,
  prettifyModelName,
} from "./format-model-name";

describe("prettifyModelName", () => {
  it.each([
    ["claude-sonnet-5", "Claude Sonnet 5"],
    ["gpt-5.6-sol", "GPT 5.6 Sol"],
    ["deepseek-v4-flash", "DeepSeek V4 Flash"],
    ["anthropic/claude-opus-4-1", "Claude Opus 4 1"],
    ["openai/gpt-4o-mini", "GPT 4o Mini"],
  ])("prettifies %s", (model, expected) => {
    expect(prettifyModelName(model)).toBe(expected);
  });

  it("returns null without a model or override", () => {
    expect(prettifyModelName(null)).toBeNull();
    expect(prettifyModelName("")).toBeNull();
  });

  it("lets a user override win", () => {
    expect(prettifyModelName("gpt-5.6-sol", "  My fast model ")).toBe(
      "My fast model",
    );
  });
});

describe("getModelProvider and formatProviderName", () => {
  it("reads the provider from the model prefix", () => {
    expect(getModelProvider("OpenAI/gpt-4o")).toBe("openai");
    expect(getModelProvider("openhands/glm-5.2")).toBe("openhands");
  });

  it("has no provider for an unprefixed model", () => {
    expect(getModelProvider("gpt-4o")).toBeNull();
    expect(getModelProvider(null)).toBeNull();
  });

  it("spells known brands", () => {
    expect(formatProviderName("openai")).toBe("OpenAI");
    expect(formatProviderName("deepseek")).toBe("DeepSeek");
  });
});

describe("formatModelPrettyLabel", () => {
  it("prettifies by default and keeps the static OpenHands label", () => {
    expect(formatModelPrettyLabel("anthropic/claude-sonnet-5")).toBe(
      "Claude Sonnet 5",
    );
    expect(formatModelPrettyLabel("openhands/deepseek-v4-flash")).toBe(
      "OpenHands DeepSeek V4 Flash",
    );
  });

  it("prefers an override and appends the free suffix for backend-free models", () => {
    expect(
      formatModelPrettyLabel(
        "openhands/glm-5.2",
        new Set(["openhands/glm-5.2"]),
        "Fast",
      ),
    ).toBe("Fast (free)");
  });

  it("falls back to the override when there is no model", () => {
    expect(formatModelPrettyLabel(null, undefined, "Fast")).toBe("Fast");
    expect(formatModelPrettyLabel(null)).toBeNull();
  });
});

describe("formatModelPillLabel", () => {
  it("keeps the pretty OpenHands label without a free suffix unless backend marks it free", () => {
    expect(formatModelPillLabel("openhands/deepseek-v4-flash")).toBe(
      "OpenHands DeepSeek V4 Flash",
    );

    expect(
      formatModelPillLabel(
        "openhands/deepseek-v4-flash",
        new Set(["openhands/deepseek-v4-flash"]),
      ),
    ).toBe("OpenHands DeepSeek V4 Flash (free)");
  });
});
