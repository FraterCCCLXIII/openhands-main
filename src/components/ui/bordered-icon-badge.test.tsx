// @vitest-environment jsdom

import { ShieldCheck } from "lucide-react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BorderedIconBadge } from "@/src/components/ui/bordered-icon-badge";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

describe("BorderedIconBadge", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    enableReactActEnvironment();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders the icon inside the bordered badge shell", () => {
    act(() => {
      root.render(<BorderedIconBadge icon={ShieldCheck} />);
    });

    const badge = container.querySelector("span");
    const icon = badge?.querySelector("svg");

    expect(badge?.className).toContain("rounded-md");
    expect(badge?.className).toContain("bg-base-secondary");
    expect(icon).toBeTruthy();
  });
});
