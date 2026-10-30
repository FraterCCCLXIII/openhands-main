import { I18nKey } from "#/i18n/declaration";

/** Picks the clearest message for a relay or key error; unknown errors keep their text. */
export function teamChatErrorKey(error: unknown): {
  key: I18nKey;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  if (/could not reach|closed the connection/i.test(message)) {
    return { key: I18nKey.TEAM_CHAT$ERR_RELAY, message };
  }
  if (
    /typo|not a valid key|invalid key|not a secret key|not a public key/i.test(
      message,
    )
  ) {
    return { key: I18nKey.TEAM_CHAT$ERR_KEY, message };
  }
  if (/invite/i.test(message)) {
    return { key: I18nKey.TEAM_CHAT$ERR_INVITE, message };
  }
  return { key: I18nKey.TEAM_CHAT$ERR_GENERIC, message };
}
