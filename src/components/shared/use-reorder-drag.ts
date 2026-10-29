import React from "react";

/**
 * Native drag-and-drop reordering for a list of ids. Attach `gripProps` to the
 * handle that starts a drag and `rowProps` to each row that can receive it.
 * `onMove` receives the dragged id and the index it should land at. `draggedId`
 * and `overId` let rows show the drag and the drop target while it is in flight.
 */
export function useReorderDrag<T extends string>(
  order: readonly T[],
  onMove: (id: T, index: number) => void,
) {
  const [draggedId, setDraggedId] = React.useState<T | null>(null);
  const [overId, setOverId] = React.useState<T | null>(null);

  const endDrag = () => {
    setDraggedId(null);
    setOverId(null);
  };

  const gripProps = (id: T) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      const { dataTransfer } = event;
      dataTransfer.effectAllowed = "move";
      setDraggedId(id);
    },
    onDragEnd: endDrag,
  });

  const rowProps = (id: T) => ({
    onDragOver: (event: React.DragEvent) => {
      if (!draggedId) return;
      event.preventDefault();
      if (overId !== id) setOverId(id);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedId && draggedId !== id) {
        onMove(draggedId, order.indexOf(id));
      }
      endDrag();
    },
  });

  return { draggedId, overId, gripProps, rowProps };
}
