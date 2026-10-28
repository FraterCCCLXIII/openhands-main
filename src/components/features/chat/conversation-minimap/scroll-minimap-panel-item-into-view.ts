/** Scroll `item` into the visible area of `container` without moving outer scrollers. */
export function scrollMinimapPanelItemIntoView(
  container: HTMLElement,
  item: HTMLElement,
): void {
  const scrollContainer = container;
  const containerRect = scrollContainer.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  if (itemRect.top < containerRect.top) {
    scrollContainer.scrollTop -= containerRect.top - itemRect.top;
    return;
  }

  if (itemRect.bottom > containerRect.bottom) {
    scrollContainer.scrollTop += itemRect.bottom - containerRect.bottom;
  }
}
