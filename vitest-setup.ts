import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = "0px";
    readonly thresholds: ReadonlyArray<number> = [0];

    observe = () => {};
    unobserve = () => {};
    disconnect = () => {};
    takeRecords = () => [];
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
}

afterEach(() => {
  cleanup();
});
