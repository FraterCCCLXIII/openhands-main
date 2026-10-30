import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  CANVAS_UI_CLIENT_ACTION_KIND,
  CANVAS_UI_CLIENT_TOOL,
  CANVAS_UI_CLIENT_TOOL_NAME,
  LEGACY_CANVAS_UI_TOOL_NAME,
} from "#/api/canvas-ui-client-tool";
import {
  isCanvasUiActionKind,
  isCanvasUiToolName,
} from "#/constants/canvas-ui";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const legacyToolSource = readFileSync(
  resolve(repoRoot, "tools/canvas_ui_tool.py"),
  "utf8",
);

describe("canvas_ui client tool", () => {
  it("tells the agent to capture a browser screenshot before opening the browser tab", () => {
    const captureInstruction = "browser_get_state(include_screenshot=true)";
    const openBrowserInstruction = 'command="open_tab", tab="browser"';

    expect(CANVAS_UI_CLIENT_TOOL.description).toContain(captureInstruction);
    expect(CANVAS_UI_CLIENT_TOOL.description).toContain(openBrowserInstruction);
    expect(
      CANVAS_UI_CLIENT_TOOL.description.indexOf(captureInstruction),
    ).toBeLessThan(
      CANVAS_UI_CLIENT_TOOL.description.indexOf(openBrowserInstruction),
    );
  });

  it("exports the semantic tool name and generated action kind", () => {
    expect(CANVAS_UI_CLIENT_TOOL_NAME).toBe("canvas_ui_control_v2");
    expect(CANVAS_UI_CLIENT_ACTION_KIND).toBe(
      "ClientAction_canvas_ui_control_v2",
    );
    expect(CANVAS_UI_CLIENT_TOOL.name).toBe(CANVAS_UI_CLIENT_TOOL_NAME);
    expect(CANVAS_UI_CLIENT_TOOL.name).not.toBe(LEGACY_CANVAS_UI_TOOL_NAME);
  });

  it("names the registered tool in its own description", () => {
    expect(CANVAS_UI_CLIENT_TOOL.description).toContain(
      CANVAS_UI_CLIENT_TOOL_NAME,
    );
    expect(CANVAS_UI_CLIENT_TOOL.description).not.toMatch(
      /canvas_ui_control(?!_v)/,
    );
  });

  it.each(["canvas_ui", "canvas_ui_control", CANVAS_UI_CLIENT_TOOL_NAME])(
    "recognises %s as a Canvas UI tool",
    (name) => {
      expect(isCanvasUiToolName(name)).toBe(true);
    },
  );

  it("recognises historical and current client action kinds only", () => {
    expect(isCanvasUiActionKind("ClientAction_canvas_ui_control")).toBe(true);
    expect(isCanvasUiActionKind(CANVAS_UI_CLIENT_ACTION_KIND)).toBe(true);
    expect(isCanvasUiActionKind("CanvasUIAction")).toBe(true);
    expect(isCanvasUiActionKind("ClientAction_other")).toBe(false);
    expect(isCanvasUiToolName("execute_bash")).toBe(false);
  });

  it("retains the Python registration shim for persisted conversations", () => {
    expect(legacyToolSource).toContain("Legacy conversation compatibility");
    expect(legacyToolSource).toContain(
      'register_tool("canvas_ui", CanvasUITool)',
    );
  });
});
