import { describe, expect, it } from "vitest";
import {
  isExtensionTabId,
  makeExtensionTabId,
  parseExtensionTabId,
} from "#/utils/extension-tab-id";

describe("extension tab ids", () => {
  it("round-trips an extension page", () => {
    const id = makeExtensionTabId("meet", "main-page");

    expect(parseExtensionTabId(id)).toEqual({
      extensionName: "meet",
      pageId: "main-page",
    });
  });

  it.each(["files", "extension:meet", "extension:Meet:home", "", null])(
    "does not treat %s as an extension tab",
    (value) => {
      expect(isExtensionTabId(value)).toBe(false);
    },
  );
});
