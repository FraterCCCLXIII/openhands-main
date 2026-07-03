// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { WizardProgressBar } from "@/src/components/integrations/wizard/wizard-progress-bar";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

describe("WizardProgressBar", () => {
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

  it("renders three segments for the add flow", async () => {
    await act(async () => {
      root.render(<WizardProgressBar currentStep={2} flow="add" />);
    });

    const progressBar = container.querySelector(
      '[data-testid="integration-wizard-progress-bar"]',
    );
    expect(progressBar?.getAttribute("data-flow")).toBe("add");
    expect(
      container
        .querySelector('[data-testid="integration-wizard-progress-step-0"]')
        ?.getAttribute("data-state"),
    ).toBe("completed");
    expect(
      container
        .querySelector('[data-testid="integration-wizard-progress-step-1"]')
        ?.getAttribute("data-state"),
    ).toBe("current");
    expect(
      container
        .querySelector('[data-testid="integration-wizard-progress-step-2"]')
        ?.getAttribute("data-state"),
    ).toBe("upcoming");
    expect(
      container.querySelector('[data-testid="integration-wizard-progress-step-3"]'),
    ).toBeNull();
  });

  it("renders two segments for the catalog flow starting on connect", async () => {
    await act(async () => {
      root.render(<WizardProgressBar currentStep={2} flow="catalog" />);
    });

    const progressBar = container.querySelector(
      '[data-testid="integration-wizard-progress-bar"]',
    );
    expect(progressBar?.getAttribute("data-flow")).toBe("catalog");
    expect(
      container
        .querySelector('[data-testid="integration-wizard-progress-step-0"]')
        ?.getAttribute("data-state"),
    ).toBe("current");
    expect(
      container
        .querySelector('[data-testid="integration-wizard-progress-step-1"]')
        ?.getAttribute("data-state"),
    ).toBe("upcoming");
    expect(
      container.querySelector('[data-testid="integration-wizard-progress-step-2"]'),
    ).toBeNull();
  });
});
