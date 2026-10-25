import { describe, expect, it } from "vitest";
import {
  KAMIJI_MOCHI_FACE_STATES,
  getMochiFaceState,
  isMochiClip,
} from "#/components/features/kamiji/kamiji-mochi-expressions";
import { KamijiExpression } from "#/components/features/kamiji/kamiji-expressions";

describe("getMochiFaceState", () => {
  it.each<[KamijiExpression, string]>([
    ["neutral", "neutral"],
    ["happy", "happy"],
    ["excited", "joy"],
    ["thinking", "neutral"],
    ["sad", "sad"],
    ["angry", "sad"],
    ["surprised", "surprised"],
    ["sleepy", "blink"],
  ])("maps %s to the %s face", (expression, face) => {
    expect(getMochiFaceState(expression)).toBe(face);
  });

  it("only ever returns a face state the GLBs ship", () => {
    const all: KamijiExpression[] = [
      "neutral",
      "happy",
      "excited",
      "thinking",
      "sad",
      "angry",
      "surprised",
      "sleepy",
    ];
    all.forEach((expression) =>
      expect(KAMIJI_MOCHI_FACE_STATES).toContain(getMochiFaceState(expression)),
    );
  });
});

describe("isMochiClip", () => {
  it("accepts clip names and rejects hand animations", () => {
    expect(isMochiClip("dance")).toBe(true);
    expect(isMochiClip("Typing")).toBe(false);
  });
});
