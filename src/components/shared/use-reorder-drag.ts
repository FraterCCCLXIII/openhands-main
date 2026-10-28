import React from "react";

/**
 * Native drag-and-drop reordering for a list of ids. Attach `gripProps` to the
 * handle that starts a drag and `rowProps` to each row that can receive it.
 * `onMove` receives the dragged id and the index it should land at.
 */
export function useReorderDrag<T extends string>(
  order: readonly T[],
  onMove: (id: T, index: number) => void,
) {
  const [draggedId, setDraggedId] = React.useState<T | null>(null);

  const gripProps = (id: T) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      const { dataTransfer } = event;
      dataTransfer.effectAllowed = "move";
      setDraggedId(id);
    },
    onDragEnd: () => setDraggedId(null),
  });

  const rowProps = (id: T) => ({
    onDragOver: (event: React.DragEvent) => {
      if (draggedId) event.preventDefault();
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) return;
      onMove(draggedId, order.indexOf(id));
      setDraggedId(null);
    },
  });

  return { draggedId, gripProps, rowProps };
}
