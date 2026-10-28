export const KANBAN_STORAGE_KEY = "kanban-board";

export type KanbanColumnId = "todo" | "in_progress" | "done";

export interface KanbanCard {
  id: string;
  title: string;
  column: KanbanColumnId;
}

export const KANBAN_COLUMNS: readonly KanbanColumnId[] = [
  "todo",
  "in_progress",
  "done",
];
