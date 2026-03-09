// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("theme primitives", () => {
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

  it("uses OpenHands-inspired classes for core UI primitives", async () => {
    await act(async () => {
      root.render(
        <div>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Badge>Default badge</Badge>
          <Card>Card content</Card>
        </div>,
      );
    });

    const [primaryButton, secondaryButton] = Array.from(
      container.querySelectorAll("button"),
    );
    const badge = container.querySelector("span");
    const card = container.querySelector("section");

    expect(primaryButton?.className).toContain("bg-[var(--color-accent)]");
    expect(primaryButton?.className).toContain(
      "text-[var(--color-accent-foreground)]",
    );
    expect(secondaryButton?.className).toContain("border-[var(--color-accent)]");
    expect(secondaryButton?.className).toContain("bg-transparent");
    expect(badge?.className).toContain("bg-[var(--color-surface-subtle)]");
    expect(badge?.className).toContain("rounded-md");
    expect(card?.className).toContain("bg-[var(--color-bg-workspace)]");
    expect(card?.className).toContain("rounded-xl");
  });
});
