import { describe, expect, it } from "vitest";
import {
  readScrollFadeState,
  readVerticalScrollEdgeState,
} from "#/utils/scroll-fade-state";

function mockHorizontalScrollMetrics(
  element: HTMLElement,
  metrics: { scrollWidth: number; clientWidth: number; scrollLeft: number },
) {
  Object.defineProperty(element, "scrollWidth", {
    configurable: true,
    value: metrics.scrollWidth,
  });
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: metrics.clientWidth,
  });
  Object.defineProperty(element, "scrollLeft", {
    configurable: true,
    writable: true,
    value: metrics.scrollLeft,
  });
}

function mockVerticalScrollMetrics(
  element: HTMLElement,
  metrics: { scrollHeight: number; clientHeight: number; scrollTop: number },
) {
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    writable: true,
    value: metrics.scrollTop,
  });
}

describe("readScrollFadeState", () => {
  it("hides both fades when content fits horizontally", () => {
    const element = document.createElement("div");
    mockHorizontalScrollMetrics(element, {
      scrollWidth: 400,
      clientWidth: 400,
      scrollLeft: 0,
    });

    expect(readScrollFadeState(element)).toEqual({ left: false, right: false });
  });
});

describe("readVerticalScrollEdgeState", () => {
  it("hides both edges when the content fits", () => {
    const element = document.createElement("div");
    mockVerticalScrollMetrics(element, {
      scrollHeight: 400,
      clientHeight: 400,
      scrollTop: 0,
    });

    expect(readVerticalScrollEdgeState(element)).toEqual({
      top: false,
      bottom: false,
    });
  });

  it("shows only the bottom edge at the start of overflowing content", () => {
    const element = document.createElement("div");
    mockVerticalScrollMetrics(element, {
      scrollHeight: 800,
      clientHeight: 300,
      scrollTop: 0,
    });

    expect(readVerticalScrollEdgeState(element)).toEqual({
      top: false,
      bottom: true,
    });
  });

  it("shows both edges in the middle of overflowing content", () => {
    const element = document.createElement("div");
    mockVerticalScrollMetrics(element, {
      scrollHeight: 800,
      clientHeight: 300,
      scrollTop: 250,
    });

    expect(readVerticalScrollEdgeState(element)).toEqual({
      top: true,
      bottom: true,
    });
  });

  it("shows only the top edge at the end of overflowing content", () => {
    const element = document.createElement("div");
    mockVerticalScrollMetrics(element, {
      scrollHeight: 800,
      clientHeight: 300,
      scrollTop: 500,
    });

    expect(readVerticalScrollEdgeState(element)).toEqual({
      top: true,
      bottom: false,
    });
  });
});
