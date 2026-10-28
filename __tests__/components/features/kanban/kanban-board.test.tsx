import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "#/components/features/kanban/kanban-board";
import { KANBAN_STORAGE_KEY } from "#/kanban/constants";
import { useKanbanStore } from "#/stores/kanban-store";
import { renderWithProviders } from "../../../../test-utils";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: { title?: string }) => {
      const translations: Record<string, string> = {
        KANBAN$TITLE: "Kanban",
        KANBAN$COLUMN_TODO: "To do",
        KANBAN$COLUMN_IN_PROGRESS: "In progress",
        KANBAN$COLUMN_DONE: "Done",
        KANBAN$ADD_CARD_PLACEHOLDER: "Add a card",
        KANBAN$MOVE_LEFT: "Move {{title}} left",
        KANBAN$MOVE_RIGHT: "Move {{title}} right",
        KANBAN$DELETE: "Delete",
        KANBAN$DELETE_CARD: "Delete {{title}}",
        KANBAN$EMPTY_COLUMN: "No cards",
      };
      return (translations[key] ?? key).replace(
        "{{title}}",
        options?.title ?? "",
      );
    },
  }),
}));

function column(name: string) {
  return screen.getByRole("region", { name });
}

describe("KanbanBoard", () => {
  beforeEach(() => {
    localStorage.clear();
    useKanbanStore.setState({ cards: [] });
  });

  it("adds a card to the To do column", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<KanbanBoard />);

    // Act
    await user.type(
      within(column("To do")).getByRole("textbox"),
      "Write release notes{Enter}",
    );

    // Assert
    expect(
      within(column("To do")).getByText("Write release notes"),
    ).toBeInTheDocument();
    expect(useKanbanStore.getState().cards).toEqual([
      expect.objectContaining({ title: "Write release notes", column: "todo" }),
    ]);
  });

  it("ignores a blank card title", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<KanbanBoard />);

    // Act
    await user.type(within(column("To do")).getByRole("textbox"), "   {Enter}");

    // Assert
    expect(useKanbanStore.getState().cards).toHaveLength(0);
  });

  it("moves a card to the next column with its move button", async () => {
    // Arrange
    const user = userEvent.setup();
    useKanbanStore.setState({
      cards: [{ id: "c1", title: "Fix login", column: "todo" }],
    });
    renderWithProviders(<KanbanBoard />);

    // Act
    await user.click(
      screen.getByRole("button", { name: "Move Fix login right" }),
    );

    // Assert
    expect(
      within(column("In progress")).getByText("Fix login"),
    ).toBeInTheDocument();
    expect(useKanbanStore.getState().cards[0].column).toBe("in_progress");
  });

  it("moves a card by dragging it onto another column", () => {
    // Arrange
    useKanbanStore.setState({
      cards: [{ id: "c1", title: "Fix login", column: "todo" }],
    });
    renderWithProviders(<KanbanBoard />);

    // Act
    const card = screen.getByText("Fix login").closest("li") as HTMLElement;
    fireEvent.dragStart(card);
    fireEvent.dragOver(column("Done"));
    fireEvent.drop(column("Done"));

    // Assert
    expect(within(column("Done")).getByText("Fix login")).toBeInTheDocument();
  });

  it("deletes a card", async () => {
    // Arrange
    const user = userEvent.setup();
    useKanbanStore.setState({
      cards: [{ id: "c1", title: "Old idea", column: "done" }],
    });
    renderWithProviders(<KanbanBoard />);

    // Act
    await user.click(screen.getByRole("button", { name: "Delete Old idea" }));

    // Assert
    expect(screen.queryByText("Old idea")).not.toBeInTheDocument();
    expect(useKanbanStore.getState().cards).toHaveLength(0);
  });

  it("keeps cards after the board remounts", async () => {
    // Arrange
    const user = userEvent.setup();
    const first = renderWithProviders(<KanbanBoard />);
    await user.type(
      within(column("To do")).getByRole("textbox"),
      "Survive reload{Enter}",
    );
    first.unmount();
    const saved = localStorage.getItem(KANBAN_STORAGE_KEY);
    useKanbanStore.setState({ cards: [] });
    localStorage.setItem(KANBAN_STORAGE_KEY, saved as string);

    // Act
    await useKanbanStore.persist.rehydrate();
    renderWithProviders(<KanbanBoard />);

    // Assert
    expect(
      within(column("To do")).getByText("Survive reload"),
    ).toBeInTheDocument();
  });
});
