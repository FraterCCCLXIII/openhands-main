import { describe, it, expect, vi, beforeEach } from "vitest";
import toast from "react-hot-toast";
import { useNotificationStackStore } from "#/stores/notification-stack-store";
import {
  displaySuccessToast,
  displayErrorToast,
} from "#/utils/custom-toast-handlers";

const { toastMock } = vi.hoisted(() => ({
  toastMock: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: toastMock,
}));

describe("custom-toast-handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("displaySuccessToast", () => {
    it("should call toast.success with calculated duration for short message", () => {
      const shortMessage = "Settings saved";
      displaySuccessToast(shortMessage);

      expect(toast.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          duration: 5000, // Should use minimum duration of 5000ms
          position: "top-right",
          style: expect.objectContaining({
            borderRadius: "var(--oh-radius)",
            maxWidth: "400px",
            wordBreak: "break-word",
          }),
        }),
      );
    });

    it("should call toast.success with longer duration for long message", () => {
      const longMessage =
        "Settings saved. For old conversations, you will need to stop and restart the conversation to see the changes.";
      displaySuccessToast(longMessage);

      expect(toast.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          duration: expect.any(Number),
          position: "top-right",
          style: expect.objectContaining({
            borderRadius: "var(--oh-radius)",
            maxWidth: "400px",
            wordBreak: "break-word",
          }),
        }),
      );

      // Get the actual duration that was passed
      const callArgs = (
        toast.success as unknown as { mock: { calls: unknown[][] } }
      ).mock.calls[0][1] as { duration: number };
      const actualDuration = callArgs.duration;

      // For a long message, duration should be more than the minimum 5000ms
      expect(actualDuration).toBeGreaterThan(5000);
      // But should not exceed the maximum 10000ms
      expect(actualDuration).toBeLessThanOrEqual(10000);
    });
  });

  describe("displayErrorToast", () => {
    beforeEach(() => {
      useNotificationStackStore.setState({ items: [] });
    });

    it("pushes a short error onto the notification stack with the minimum duration", () => {
      displayErrorToast("Error occurred");

      expect(toastMock).not.toHaveBeenCalled();
      expect(useNotificationStackStore.getState().items).toEqual([
        expect.objectContaining({
          kind: "error",
          message: "Error occurred",
          count: 1,
          duration: 4000,
        }),
      ]);
    });

    it("gives a long error a longer duration, capped at 10 seconds", () => {
      const longMessage =
        "A very long error message that should take more time to read and understand what went wrong with the operation.";
      displayErrorToast(longMessage);

      const [item] = useNotificationStackStore.getState().items;
      expect(item.duration).toBeGreaterThan(4000);
      expect(item.duration).toBeLessThanOrEqual(10000);
    });

    it("folds a repeated error into one card with a count", () => {
      displayErrorToast("Disconnected");
      displayErrorToast("Disconnected");

      const { items } = useNotificationStackStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].count).toBe(2);
    });
  });
});
