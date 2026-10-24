export interface FeedStackGroup<T> {
  key: string;
  items: T[];
}

/**
 * Splits an ordered list into runs of neighbours that share a key. Only
 * neighbours group, so the list's order — activity, pins — is never changed.
 */
export function groupConsecutive<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
): Array<FeedStackGroup<T>> {
  const groups: Array<FeedStackGroup<T>> = [];
  items.forEach((item) => {
    const key = keyOf(item);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  });
  return groups;
}
