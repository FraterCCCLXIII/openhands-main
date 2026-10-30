/**
 * Conversation drawer tab ids for Canvas Extension pages.
 *
 * A page is addressed as `extension:<extension name>:<page id>`. Both parts are
 * lowercase letters, digits and hyphens (manifest rules), so the colon is safe.
 */
export type ExtensionTabId = `extension:${string}:${string}`;

export function makeExtensionTabId(
  extensionName: string,
  pageId: string,
): ExtensionTabId {
  return `extension:${extensionName}:${pageId}`;
}

export function parseExtensionTabId(
  tab: string | null | undefined,
): { extensionName: string; pageId: string } | null {
  if (!tab) return null;
  const match = /^extension:([a-z0-9-]+):([a-z0-9-]+)$/.exec(tab);
  return match ? { extensionName: match[1], pageId: match[2] } : null;
}

export function isExtensionTabId(
  tab: string | null | undefined,
): tab is ExtensionTabId {
  return parseExtensionTabId(tab) !== null;
}
