import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "test-utils";
import { HomeHeaderTitle } from "#/components/features/home/home-header/home-header-title";

describe("HomeHeaderTitle", () => {
  it("frames the splash copy around engineering work, not greenfield building", () => {
    // Pin the random subtitle pick to the translated engineering-tasks line.
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    renderWithProviders(<HomeHeaderTitle />);

    expect(screen.getByText("HOME$WHAT_TO_WORK_ON")).toBeInTheDocument();
    expect(screen.getByTestId("home-header-subtitle")).toHaveTextContent(
      "HOME$ENGINEERING_TASKS_SUBHEADER",
    );
    randomSpy.mockRestore();
  });

  describe("welcome-back message", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(Math, "random").mockReturnValue(0);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("types out the picked welcome-back message one character at a time", () => {
      renderWithProviders(<HomeHeaderTitle />);

      const message = screen.getByTestId("home-welcome-message");
      expect(message).toHaveTextContent("");

      act(() => {
        vi.advanceTimersByTime(200);
      });
      const partial = message.textContent ?? "";
      expect(partial.length).toBeGreaterThan(0);
      expect("Welcome back!").toMatch(new RegExp(`^${partial}`));

      // Each character schedules the next after a re-render, so step past the
      // full reveal in small increments.
      for (let elapsed = 0; elapsed < 1500; elapsed += 20) {
        act(() => {
          vi.advanceTimersByTime(20);
        });
      }
      expect(message).toHaveTextContent("Welcome back!");
    });
  });
});
