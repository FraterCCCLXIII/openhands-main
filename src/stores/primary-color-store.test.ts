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
});
