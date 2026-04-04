// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IntegrationMarketplaceCard } from "@/src/components/dashboard/shared";
import { AccessModeSlider } from "@/src/components/integrations/function-access-controls";
import { KindStep } from "@/src/components/integrations/wizard/kind-step";
import { Button } from "@/src/components/ui/button";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("button cursor affordances", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("adds pointer cursors to enabled buttons and preserves the disabled override", async () => {
    await act(async () => {
      root.render(
        <div>
          <Button>Primary action</Button>
          <Button disabled>Disabled action</Button>
          <IntegrationMarketplaceCard
            connector={{
              slug: "github",
              name: "GitHub",
              description: "Code hosting",
              toolCount: 12,
              categories: ["Developer tools"],
              authModes: ["oauth2"],
              authStrategy: "oauth2",
              credentialLabel: "Token",
              credentialPlaceholder: "ghp_...",
              credentialHelp: "Paste a GitHub token.",
            }}
            onClick={vi.fn()}
          />
          <KindStep selectedKind={null} onSelectKind={vi.fn()} />
          <AccessModeSlider functionName="listIssues" mode="enabled" onChange={vi.fn()} />
        </div>,
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const enabledButtons = buttons.filter((button) => !button.disabled);
    const disabledButton = buttons.find((button) => button.disabled);

    expect(enabledButtons.length).toBeGreaterThan(0);
    for (const button of enabledButtons) {
      expect(button.className).toContain("cursor-pointer");
    }

    expect(disabledButton).toBeDefined();
    expect(disabledButton?.className).toContain("disabled:cursor-not-allowed");
  });
});
