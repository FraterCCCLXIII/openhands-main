import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "test-utils";
import { KamijiHandAvatar } from "#/components/features/kamiji/kamiji-hand-avatar";
import { KamijiHandEditor } from "#/components/features/kamiji/kamiji-hand-editor";
import KamijiHandEditorDialog from "#/components/features/kamiji/kamiji-hand-editor-dialog";
import { DEFAULT_KAMIJI_HAND_LOOK } from "#/components/features/kamiji/kamiji-hand-look";
import translations from "#/i18n/translation.json";
import { useKamijiHandStore } from "#/stores/kamiji-hand-store";

// Resolve keys to the real English copy so tests query by what users read.
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string) =>
      (translations as Record<string, { en: string }>)[key]?.en ?? key,
    i18n: { language: "en", exists: () => true },
  }),
}));

const look = () => useKamijiHandStore.getState().look;

describe("KamijiHandEditor", () => {
  beforeEach(() => {
    localStorage.clear();
    useKamijiHandStore.getState().resetLook();
  });

  it("saves a preset colour and a custom colour", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KamijiHandEditor />);

    await user.click(screen.getByRole("radio", { name: "Teal" }));
    expect(look().color).toBe("#2ec4b6");
    expect(screen.getByRole("radio", { name: "Teal" })).toBeChecked();

    fireEvent.change(screen.getByLabelText("Custom"), {
      target: { value: "#123456" },
    });
    expect(look().color).toBe("#123456");
  });

  it("changes expression, shape and accessory", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KamijiHandEditor />);

    await user.selectOptions(screen.getByLabelText("Expression"), "Sleepy");
    await user.click(screen.getByRole("radio", { name: "Sphere" }));
    await user.selectOptions(screen.getByLabelText("Accessory"), "heart");

    expect(look()).toMatchObject({
      expression: "sleepy",
      shape: "sphere",
      accessory: "heart",
    });

    await user.selectOptions(screen.getByLabelText("Accessory"), "None");
    expect(look().accessory).toBeNull();
  });

  it("switches between a pose and an animation clip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KamijiHandEditor />);
    const motion = screen.getByLabelText("Pose or animation");

    await user.selectOptions(motion, "Peace");
    expect(look()).toMatchObject({ pose: "peace" });

    await user.selectOptions(motion, "Wave");
    expect(look()).toMatchObject({ pose: null, animation: "Wave" });
  });

  it("toggles the mouth and the outline", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KamijiHandEditor />);

    await user.click(screen.getByRole("switch", { name: "Mouth" }));
    await user.click(screen.getByRole("switch", { name: "Outline" }));

    expect(look()).toMatchObject({ mouth: true, outline: true });

    await user.click(screen.getByRole("switch", { name: "Mouth" }));
    expect(look().mouth).toBe(false);
  });

  it("resets everything to the default Hand", async () => {
    const user = userEvent.setup();
    useKamijiHandStore.getState().updateLook({ shape: "cube", outline: true });
    renderWithProviders(<KamijiHandEditor />);

    await user.click(screen.getByRole("button", { name: "Reset to default" }));

    expect(look()).toEqual(DEFAULT_KAMIJI_HAND_LOOK);
  });

  it("lets the preview be focused and turned from the keyboard", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KamijiHandEditor />);
    const preview = screen.getByRole("button", { name: /Hand preview/ });

    preview.focus();
    await user.keyboard("{ArrowRight}{ArrowDown}{Home}");

    expect(preview).toHaveFocus();
  });
});

describe("KamijiHandAvatar", () => {
  beforeEach(() => {
    localStorage.clear();
    useKamijiHandStore.getState().resetLook();
  });

  it("shows the saved Hand and follows later edits", async () => {
    const { container } = renderWithProviders(<KamijiHandAvatar size={40} />);
    await waitFor(() => expect(container.querySelector("canvas")).toBeNull());
    expect(container.querySelector("svg g")).toHaveAttribute(
      "fill",
      DEFAULT_KAMIJI_HAND_LOOK.color,
    );

    React.act(() => {
      useKamijiHandStore.getState().updateLook({ color: "#a77bff" });
    });

    await waitFor(() =>
      expect(container.querySelector("svg g")).toHaveAttribute(
        "fill",
        "#a77bff",
      ),
    );
  });
});

describe("KamijiHandEditorDialog", () => {
  it("is a named dialog that closes with Escape and the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<KamijiHandEditorDialog onClose={onClose} />);

    expect(
      screen.getByRole("dialog", { name: "Edit your Hand" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
