/**
 * Trademark and copyright statement shown with the product names. The marks are
 * claimed with the TM sign; none is registered. This records the claim and the
 * attribution, and is not legal advice.
 */

/** The date of the statement, ISO. Bump it when the wording or the brands change. */
export const BRAND_NOTICE_DATE = "2026-10-30";

/** The copyright year, taken from the date of the statement. */
export const BRAND_NOTICE_YEAR = BRAND_NOTICE_DATE.slice(0, 4);

/** Brand names, as written on screen, each followed by the TM sign. */
export const BRAND_NOTICE_BRANDS = [
  "Tower",
  "Commons",
  "Kosmos",
  "Kamiji",
  "Bitkin",
  "Holons",
  "Hangout",
  "MESH",
  "DocTransit",
] as const;

/** Whom the marks and the copyright are attributed to. */
export const BRAND_NOTICE_OWNERS = [
  "Artec",
  "Paul Bloch",
  "Modern Telepathy Inc",
  "Automic Intelligence Holdings",
] as const;

const joinList = (items: readonly string[]) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** "October 30, 2026", always in English so the notice reads the same everywhere. */
export const formatBrandNoticeDate = (iso: string = BRAND_NOTICE_DATE) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export const brandNoticeMarks = () =>
  `${joinList(BRAND_NOTICE_BRANDS.map((b) => `${b}™`))} are trademarks of ${joinList(BRAND_NOTICE_OWNERS)}.`;

export const brandNoticeCopyright = () =>
  `© ${BRAND_NOTICE_YEAR} ${joinList(BRAND_NOTICE_OWNERS)}. All rights reserved.`;

export const brandNoticeDated = () =>
  `Notice dated ${formatBrandNoticeDate()}.`;
