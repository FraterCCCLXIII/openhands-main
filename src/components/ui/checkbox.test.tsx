// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Checkbox } from "@/src/components/ui/checkbox";
import { formControlCheckboxClassName } from "@/src/styles/form-control-classes";

describe("Checkbox", () => {
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
    document.body.replaceChildren();
  });

  it("renders with the shared white checkbox styling", async () => {
    await act(async () => {
      root.render(
        <Checkbox aria-label="Select example" checked readOnly onChange={() => {}} />,
      );
    });

    const checkbox = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement | null;

    expect(checkbox).toBeTruthy();
    expect(checkbox?.className).toContain(formControlCheckboxClassName);
    expect(checkbox?.className).toContain("accent-[var(--oh-accent)]");
    expect(checkbox?.className).toContain("bg-[var(--oh-bg-input)]");
  });
});
