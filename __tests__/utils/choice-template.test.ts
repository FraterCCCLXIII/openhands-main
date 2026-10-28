import { describe, expect, it } from "vitest";
import { parseChoiceTemplate } from "#/utils/choice-template";

const valid = {
  question: "Which version should I merge?",
  options: [
    { label: "Option A", description: "Detail" },
    { label: "Compare first" },
  ],
};

describe("parseChoiceTemplate", () => {
  it("parses a valid template and defaults allowOther to false", () => {
    expect(parseChoiceTemplate(JSON.stringify(valid))).toEqual({
      ...valid,
      allowOther: false,
    });
  });

  it("honours allowOther when true", () => {
    const result = parseChoiceTemplate(
      JSON.stringify({ ...valid, allowOther: true }),
    );
    expect(result?.allowOther).toBe(true);
  });

  it("returns null for invalid JSON", () => {
    expect(parseChoiceTemplate("{not json")).toBeNull();
  });

  it("returns null with fewer than two options", () => {
    const source = JSON.stringify({ ...valid, options: [{ label: "Only" }] });
    expect(parseChoiceTemplate(source)).toBeNull();
  });

  it("returns null with more than six options", () => {
    const options = Array.from({ length: 7 }, (_, i) => ({ label: `O${i}` }));
    const source = JSON.stringify({ ...valid, options });
    expect(parseChoiceTemplate(source)).toBeNull();
  });

  it("returns null when the question is missing", () => {
    expect(
      parseChoiceTemplate(JSON.stringify({ options: valid.options })),
    ).toBeNull();
  });

  it("returns null when an option has an empty label", () => {
    const source = JSON.stringify({
      ...valid,
      options: [{ label: "A" }, { label: " " }],
    });
    expect(parseChoiceTemplate(source)).toBeNull();
  });
});
