/** Server/runtime flag: local dev bypasses OpenHands Cloud session checks. */
export function isAuthDisabled(): boolean {
  return (
    process.env.DISABLE_AUTH === "true" ||
    process.env.INTHUB_DISABLE_AUTH === "true"
  );
}
