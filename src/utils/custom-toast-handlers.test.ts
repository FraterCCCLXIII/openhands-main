import { describe, it, expect, vi, beforeEach } from "vitest";
import toast from "react-hot-toast";

import {
  displayErrorToast,
  displaySuccessToast,
  reportStatusMessage,
} from "@/src/utils/custom-toast-handlers";

const { toastMock } = vi.hoisted(() => ({
  toastMock: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: toastMock,
}));

describe("custom-toast-handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses compact toast typography for success messages", () => {
    displaySuccessToast("Discovered 320 tools for ElevenLabs.");

    expect(toast.success).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        style: expect.objectContaining({
          fontSize: "14px",
          lineHeight: "20px",
          color: "var(--oh-muted)",
        }),
      }),
    );
  });

  it("routes success status messages to a success toast", () => {
    reportStatusMessage("Saved Research permission profile.");

    expect(toast.success).toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("routes failure status messages to an error toast", () => {
    reportStatusMessage("Unable to enable GitHub right now.");

    expect(toastMock).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("uses compact toast typography for error messages", () => {
    displayErrorToast("Discover failed: upstream error");

    expect(toastMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        style: expect.objectContaining({
          fontSize: "14px",
          lineHeight: "20px",
          color: "var(--oh-muted)",
        }),
      }),
    );
  });
});
