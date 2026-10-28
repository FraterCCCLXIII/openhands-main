import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import {
  KANBAN_COLUMNS,
  type KanbanCard,
  type KanbanColumnId,
} from "#/kanban/constants";
import { useKanbanStore } from "#/stores/kanban-store";

const COLUMN_LABEL_KEYS: Record<KanbanColumnId, I18nKey> = {
  todo: I18nKey.KANBAN$COLUMN_TODO,
  in_progress: I18nKey.KANBAN$COLUMN_IN_PROGRESS,
  done: I18nKey.KANBAN$COLUMN_DONE,
};

interface KanbanCardItemProps {
  card: KanbanCard;
  onDragStart: (id: string) => void;
}

function KanbanCardItem({ card, onDragStart }: KanbanCardItemProps) {
  const { t } = useTranslation("openhands");
  const moveCard = useKanbanStore((state) => state.moveCard);
  const deleteCard = useKanbanStore((state) => state.deleteCard);
  const index = KANBAN_COLUMNS.indexOf(card.column);
  const previous = KANBAN_COLUMNS[index - 1];
  const next = KANBAN_COLUMNS[index + 1];

  const iconButtonClass =
    "rounded px-2 py-0.5 text-xs text-muted hover:bg-interactive-hover disabled:opacity-30";

  return (
    <li
      draggable
      onDragStart={() => onDragStart(card.id)}
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3"
    >
      <span className="text-sm font-medium text-content">{card.title}</span>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!previous}
            aria-label={t(I18nKey.KANBAN$MOVE_LEFT, { title: card.title })}
            onClick={() => previous && moveCard(card.id, previous)}
            className={iconButtonClass}
          >
            ←
          </button>
          <button
            type="button"
            disabled={!next}
            aria-label={t(I18nKey.KANBAN$MOVE_RIGHT, { title: card.title })}
            onClick={() => next && moveCard(card.id, next)}
            className={iconButtonClass}
          >
            →
          </button>
        </div>
        <button
          type="button"
          aria-label={t(I18nKey.KANBAN$DELETE_CARD, { title: card.title })}
          onClick={() => deleteCard(card.id)}
          className={iconButtonClass}
        >
          {t(I18nKey.KANBAN$DELETE)}
        </button>
      </div>
    </li>
  );
}

interface KanbanColumnProps {
  columnId: KanbanColumnId;
  cards: KanbanCard[];
  onDragStart: (id: string) => void;
  onDrop: (column: KanbanColumnId) => void;
}

function KanbanColumn({
  columnId,
  cards,
  onDragStart,
  onDrop,
}: KanbanColumnProps) {
  const { t } = useTranslation("openhands");
  const addCard = useKanbanStore((state) => state.addCard);
  const [title, setTitle] = useState("");
  const label = t(COLUMN_LABEL_KEYS[columnId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (columnId !== "todo") return;
    addCard(title);
    setTitle("");
  };

  return (
    <section
      aria-label={label}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(columnId)}
      className="flex min-h-64 w-72 shrink-0 flex-col gap-3 rounded-lg bg-surface p-3"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content">{label}</h2>
        <span className="text-xs text-muted">{cards.length}</span>
      </header>
      {columnId === "todo" && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t(I18nKey.KANBAN$ADD_CARD_PLACEHOLDER)}
            aria-label={t(I18nKey.KANBAN$ADD_CARD_PLACEHOLDER)}
            className="w-full rounded border border-border bg-transparent px-2 py-1 text-sm text-content"
          />
        </form>
      )}
      <ul className="flex flex-col gap-2">
        {cards.map((card) => (
          <KanbanCardItem key={card.id} card={card} onDragStart={onDragStart} />
        ))}
      </ul>
      {cards.length === 0 && (
        <p className="text-xs text-muted">{t(I18nKey.KANBAN$EMPTY_COLUMN)}</p>
      )}
    </section>
  );
}

export function KanbanBoard() {
  const { t } = useTranslation("openhands");
  const cards = useKanbanStore((state) => state.cards);
  const moveCard = useKanbanStore((state) => state.moveCard);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDrop = (column: KanbanColumnId) => {
    if (draggedId) moveCard(draggedId, column);
    setDraggedId(null);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-6">
      <h1 className="font-inter text-[22px] font-normal text-content">
        {t(I18nKey.KANBAN$TITLE)}
      </h1>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((columnId) => (
          <KanbanColumn
            key={columnId}
            columnId={columnId}
            cards={cards.filter((card) => card.column === columnId)}
            onDragStart={setDraggedId}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
