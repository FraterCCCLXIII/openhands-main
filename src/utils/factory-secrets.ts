/**
 * Factory vault scoping. The Agent Server secret store is flat (one name
 * space, no scope field), so a factory's secrets are told apart by a name
 * prefix. This module is the only place that builds or reads that prefix.
 *
 *   FACTORY_<factory slug>__<NAME>
 *
 * The slug is the factory id with every run of non-alphanumeric characters
 * collapsed to one underscore, so it never contains a double underscore and
 * the `__` terminator is unambiguous: the prefix of one factory is never a
 * prefix of another factory's secret names.
 */

/** Secret names must match the Agent Server rule: letter first, 1-64 chars. */
export const SECRET_NAME_MAX_LENGTH = 64;

const SCOPE_MARKER = "FACTORY_";
const SCOPE_TERMINATOR = "__";

/** What a person may type as a vault entry name (the prefix is added for them). */
const ENTRY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_]*$/;

const slugOf = (factoryId: string): string =>
  factoryId.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

/**
 * The name prefix of one factory's secrets, or null when the id has no
 * usable characters.
 */
export function factorySecretPrefix(factoryId: string): string | null {
  const slug = slugOf(factoryId);
  return slug ? `${SCOPE_MARKER}${slug}${SCOPE_TERMINATOR}` : null;
}

/** The longest entry name a factory can use before the full name is too long. */
export function maxFactorySecretEntryLength(factoryId: string): number {
  const prefix = factorySecretPrefix(factoryId);
  return prefix ? SECRET_NAME_MAX_LENGTH - prefix.length : 0;
}

/**
 * The stored secret name for an entry in a factory's vault, or null when the
 * entry name is not allowed or the combined name would be too long.
 */
export function buildFactorySecretName(
  factoryId: string,
  entryName: string,
): string | null {
  const prefix = factorySecretPrefix(factoryId);
  const entry = entryName.trim();
  if (!prefix || !ENTRY_NAME_PATTERN.test(entry)) return null;
  const full = `${prefix}${entry}`;
  return full.length <= SECRET_NAME_MAX_LENGTH ? full : null;
}

/** The entry name inside a factory's vault, or null for any other secret. */
export function parseFactorySecretName(
  factoryId: string,
  secretName: string,
): string | null {
  const prefix = factorySecretPrefix(factoryId);
  if (!prefix || !secretName.startsWith(prefix)) return null;
  const entry = secretName.slice(prefix.length);
  return entry || null;
}

/** Whether a secret name belongs to some factory's vault (any factory). */
export function isFactoryScopedSecretName(secretName: string): boolean {
  return secretName.startsWith(SCOPE_MARKER);
}
