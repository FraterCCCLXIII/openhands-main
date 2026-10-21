import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CustomerIntakeHost,
  CustomerIntakeModal,
} from "#/components/features/customer-intake/customer-intake-modal";
import { CUSTOMER_INTAKE_DISMISSED_STORAGE_KEY } from "#/components/features/customer-intake/customer-intake.constants";

const mocks = vi.hoisted(() => ({
  trackEvent: vi.fn<(event: string, properties?: unknown) => Promise<void>>(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("#/services/telemetry", () => ({
  setTelemetryBackendContext: vi.fn(),
  trackEvent: mocks.trackEvent,
}));

vi.mock("#/contexts/active-backend-context", () => ({
  useActiveBackend: () => ({
    backend: { id: "local", kind: "local", host: "http://localhost:3000" },
  }),
}));

vi.mock("#/hooks/query/use-automation-sdk-version", () => ({
  useAutomationSdkVersion: () => null,
}));

function fillDetailsForm() {
  fireEvent.change(screen.getByLabelText("CUSTOMER_INTAKE$NAME_LABEL"), {
    target: { value: "  Ada Lovelace " },
  });
  fireEvent.change(screen.getByLabelText("CUSTOMER_INTAKE$EMAIL_LABEL"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(
    screen.getByLabelText("CUSTOMER_INTAKE$COMPANY_SIZE_LABEL"),
    {
      target: { value: "11_50" },
    },
  );
  fireEvent.change(
    screen.getByLabelText("CUSTOMER_INTAKE$COMPANY_TYPE_LABEL"),
    {
      target: { value: "agency" },
    },
  );
}

describe("CustomerIntakeModal", () => {
  beforeEach(() => {
    mocks.trackEvent.mockReset();
    mocks.trackEvent.mockResolvedValue(undefined);
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("tracks the submitted details and moves to the final step", () => {
    render(<CustomerIntakeModal onClose={vi.fn()} />);

    fillDetailsForm();
    fireEvent.submit(
      screen
        .getByRole("button", { name: "CUSTOMER_INTAKE$CONTINUE" })
        .closest("form")!,
    );

    expect(mocks.trackEvent).toHaveBeenCalledWith(
      "customer_intake_submitted",
      expect.objectContaining({
        customer_name: "Ada Lovelace",
        customer_email: "ada@example.com",
        company_size: "11_50",
        company_type: "agency",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "CUSTOMER_INTAKE$GET_TITLE" }),
    ).toBeInTheDocument();
  });

  it("links Add Teams to the pricing page and tracks the click", () => {
    render(<CustomerIntakeModal onClose={vi.fn()} />);
    fillDetailsForm();
    fireEvent.submit(
      screen
        .getByRole("button", { name: "CUSTOMER_INTAKE$CONTINUE" })
        .closest("form")!,
    );

    const addTeams = screen.getByRole("link", {
      name: /CUSTOMER_INTAKE\$ADD_TEAMS/,
    });
    expect(addTeams).toHaveAttribute("href", "https://openhands.dev/pricing");
    expect(addTeams).toHaveAttribute("target", "_blank");

    fireEvent.click(addTeams);

    expect(mocks.trackEvent).toHaveBeenCalledWith(
      "customer_intake_action_clicked",
      expect.objectContaining({ action: "add_teams" }),
    );
  });

  it("offers the repo, desktop app, and mobile app downloads on the final step", () => {
    render(<CustomerIntakeModal onClose={vi.fn()} />);
    fillDetailsForm();
    fireEvent.submit(
      screen
        .getByRole("button", { name: "CUSTOMER_INTAKE$CONTINUE" })
        .closest("form")!,
    );

    expect(
      screen.getByRole("link", { name: /CUSTOMER_INTAKE\$REPO_TITLE/ }),
    ).toHaveAttribute("href", "https://github.com/OpenHands/OpenHands");
    expect(
      screen.getByRole("link", { name: /CUSTOMER_INTAKE\$DESKTOP_TITLE/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/OpenHands/OpenHands/releases",
    );
    expect(
      screen.getByRole("link", { name: /CUSTOMER_INTAKE\$MOBILE_TITLE/ }),
    ).toHaveAttribute("href", "https://openhands.dev/");
  });

  it("skips without tracking anything", () => {
    const onClose = vi.fn();
    render(<CustomerIntakeModal onClose={onClose} />);

    fireEvent.click(
      screen.getByRole("button", { name: "CUSTOMER_INTAKE$SKIP" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mocks.trackEvent).not.toHaveBeenCalled();
  });
});

describe("CustomerIntakeHost", () => {
  beforeEach(() => {
    mocks.trackEvent.mockReset();
    window.localStorage.clear();
  });

  it("shows the modal until it has been dismissed once", () => {
    const { unmount } = render(<CustomerIntakeHost />);
    expect(
      screen.getByRole("dialog", { name: "CUSTOMER_INTAKE$ARIA_LABEL" }),
    ).toBeInTheDocument();

    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: "CUSTOMER_INTAKE$SKIP" }),
      );
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem(CUSTOMER_INTAKE_DISMISSED_STORAGE_KEY),
    ).toBe("true");

    unmount();
    render(<CustomerIntakeHost />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
