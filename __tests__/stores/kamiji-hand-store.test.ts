import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_KAMIJI_HAND_LOOK } from "#/components/features/kamiji/kamiji-hand-look";
import {
  KAMIJI_HAND_STORAGE_KEY,
  useKamijiHandStore,
} from "#/stores/kamiji-hand-store";

const stored = () =>
  JSON.parse(localStorage.getItem(KAMIJI_HAND_STORAGE_KEY) ?? "null");

describe("useKamijiHandStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useKamijiHandStore.getState().resetLook();
  });

  it("starts from the default Hand", () => {
    expect(useKamijiHandStore.getState().look).toEqual(
      DEFAULT_KAMIJI_HAND_LOOK,
    );
  });

  it("merges a partial change and saves it", () => {
    useKamijiHandStore
      .getState()
      .updateLook({ color: "#4F9DFF", accessory: "heart", outline: true });

    expect(useKamijiHandStore.getState().look).toEqual({
      ...DEFAULT_KAMIJI_HAND_LOOK,
      color: "#4f9dff",
      accessory: "heart",
      outline: true,
    });
    expect(stored().state.look.accessory).toBe("heart");
  });

  it("falls back to the default for values that are not valid", () => {
    useKamijiHandStore.getState().updateLook({ shape: "sphere" });

    useKamijiHandStore.getState().updateLook({
      color: "red",
      shape: "blob" as never,
      accessory: "glasses" as never,
    });

    const { look } = useKamijiHandStore.getState();
    expect(look.color).toBe(DEFAULT_KAMIJI_HAND_LOOK.color);
    expect(look.shape).toBe("hand");
    expect(look.accessory).toBeNull();
  });

  it("resets to the default Hand", () => {
    useKamijiHandStore
      .getState()
      .updateLook({ pose: "peace", mouth: true, expression: "angry" });

    useKamijiHandStore.getState().resetLook();

    expect(useKamijiHandStore.getState().look).toEqual(
      DEFAULT_KAMIJI_HAND_LOOK,
    );
    expect(stored().state.look).toEqual(DEFAULT_KAMIJI_HAND_LOOK);
  });

  it("restores a saved Hand when the app starts", async () => {
    localStorage.setItem(
      KAMIJI_HAND_STORAGE_KEY,
      JSON.stringify({
        state: { look: { ...DEFAULT_KAMIJI_HAND_LOOK, shape: "cube" } },
        version: 1,
      }),
    );

    await useKamijiHandStore.persist.rehydrate();

    expect(useKamijiHandStore.getState().look.shape).toBe("cube");
  });

  it("migrates an older flat save and drops what is no longer valid", async () => {
    localStorage.setItem(
      KAMIJI_HAND_STORAGE_KEY,
      JSON.stringify({
        state: { color: "#ff6b6b", expression: "grumpy", mouth: true },
        version: 0,
      }),
    );

    await useKamijiHandStore.persist.rehydrate();

    expect(useKamijiHandStore.getState().look).toEqual({
      ...DEFAULT_KAMIJI_HAND_LOOK,
      color: "#ff6b6b",
      mouth: true,
    });
  });

  it("recovers from corrupt saved data", async () => {
    localStorage.setItem(
      KAMIJI_HAND_STORAGE_KEY,
      JSON.stringify({ state: { look: "not an object" }, version: 1 }),
    );

    await useKamijiHandStore.persist.rehydrate();

    expect(useKamijiHandStore.getState().look).toEqual(
      DEFAULT_KAMIJI_HAND_LOOK,
    );
  });
});
