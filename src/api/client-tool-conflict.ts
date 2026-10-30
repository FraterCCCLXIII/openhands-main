import { isHttpError } from "@openhands/typescript-client";

/**
 * The Agent Server keeps one parameters schema per client-tool *name* for the
 * life of its process, and it re-registers the stored client tools of every
 * saved conversation it resumes. A conversation saved by an older Canvas build
 * pins the schema of the tool names it used; Canvas gives a changed schema a
 * new versioned name (see constants/canvas-ui.ts) so that normally cannot
 * happen, but if it does, a new conversation carrying the tool is rejected with a 422
 * (`ClientToolSchemaConflictError`) naming the tool. The body carries no
 * schema, so the registered one cannot be discovered; the only recovery is to
 * start the conversation without that tool.
 */
const CLIENT_TOOL_CONFLICT_PATTERN =
  /Client tool '([^']+)' is already registered with a different/;

/** The conflicting client tool's name, or null when `error` is not that error. */
export function getClientToolConflictName(error: unknown): string | null {
  if (!isHttpError(error) || error.status !== 422) return null;
  const detail = error.detail ?? error.message;
  return CLIENT_TOOL_CONFLICT_PATTERN.exec(detail)?.[1] ?? null;
}
