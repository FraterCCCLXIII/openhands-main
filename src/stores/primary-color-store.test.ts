import { beforeEach, describe, expect, it } from "vitest";
import { usePrimaryColorStore } from "./primary-color-store";

const OVERRIDE_TAG_ID = "oh-primary-color-override";

const overrideCss = () =>
  document.getElementById(OVERRIDE_TAG_ID)?.textContent ?? null;

describe("usePrimaryColorStore", () => {
  beforeEach(() => {
    document.getElementById(OVERRIDE_TAG_ID)?.remove();
    usePrimaryColorStore.getState().setPrimaryColorKey(null);
  });

  it("overrides the brand primary with the selected preset", () => {
    usePrimaryColorStore.getState().setPrimaryColorKey("violet");

    expect(usePrimaryColorStore.getState().primaryColorKey).toBe("violet");
    expect(overrideCss()).toContain("--oh-color-primary: #8B5CF6");
    expect(overrideCss()).toContain("--oh-accent: #8B5CF6");
  });

  it("removes the override when cleared so the theme primary shows", () => {
    usePrimaryColorStore.getState().setPrimaryColorKey("teal");
    usePrimaryColorStore.getState().setPrimaryColorKey(null);

    expect(usePrimaryColorStore.getState().primaryColorKey).toBeNull();
    expect(overrideCss()).toBeNull();
  });

  it("applies a custom color with a readable accent foreground", () => {
    usePrimaryColorStore.getState().setCustomPrimaryColor("#FFE600");

    expect(usePrimaryColorStore.getState().primaryColorKey).toBe("custom");
    expect(overrideCss()).toContain("--oh-color-primary: #FFE600");
    expect(overrideCss()).toContain("--oh-accent-foreground: #000000");

    usePrimaryColorStore.getState().setCustomPrimaryColor("#1E3A8A");
    expect(overrideCss()).toContain("--oh-accent-foreground: #FFFFFF");
  });

  it("ignores a custom color that is not a six-digit hex", () => {
    usePrimaryColorStore.getState().setCustomPrimaryColor("red");

    expect(usePrimaryColorStore.getState().primaryColorKey).toBeNull();
    expect(overrideCss()).toBeNull();
  });
});
