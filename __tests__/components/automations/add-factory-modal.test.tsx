import * as vitestDemoOn from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddFactoryModal } from "#/components/features/automations/factory/add-factory-modal";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { FEED_TEAMMATES } from "#/utils/feed-team-demo";
import { renderWithProviders } from "../../../test-utils";

describe("AddFactoryModal", () => {
  beforeEach(() => useFeedFactoriesStore.setState({ custom: [] }));

  it("keeps Create disabled until the factory has a name", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddFactoryModal onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    expect(screen.getByTestId("add-factory-create")).toBeDisabled();
    await user.type(screen.getByTestId("add-factory-name"), "  ");
    expect(screen.getByTestId("add-factory-create")).toBeDisabled();
    await user.type(screen.getByTestId("add-factory-name"), "Billing");
    expect(screen.getByTestId("add-factory-create")).toBeEnabled();
  });

  it("saves the factory with its owner and reports its id", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    renderWithProviders(
      <AddFactoryModal onClose={vi.fn()} onCreated={onCreated} />,
    );

    await user.type(screen.getByTestId("add-factory-name"), " Billing ");
    await user.type(screen.getByTestId("add-factory-description"), "Invoices");
    await user.selectOptions(
      screen.getByTestId("add-factory-owner"),
      FEED_TEAMMATES[1].id,
    );
    await user.click(screen.getByTestId("add-factory-create"));

    const [saved] = useFeedFactoriesStore.getState().custom;
    expect(saved).toMatchObject({
      name: "Billing",
      description: "Invoices",
      ownerId: FEED_TEAMMATES[1].id,
    });
    expect(onCreated).toHaveBeenCalledWith(saved.id);
  });

  it("closes without saving on Cancel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <AddFactoryModal onClose={onClose} onCreated={vi.fn()} />,
    );

    await user.type(screen.getByTestId("add-factory-name"), "Billing");
    await user.click(screen.getByTestId("add-factory-cancel"));

    expect(onClose).toHaveBeenCalled();
    expect(useFeedFactoriesStore.getState().custom).toEqual([]);
  });
});

// These cover the simulated team, which is opt-in.
vitestDemoOn.beforeEach(() => window.history.pushState({}, "", "/?demoTeam=on"));
vitestDemoOn.afterEach(() => window.history.pushState({}, "", "/"));
