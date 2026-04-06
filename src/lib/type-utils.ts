export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const readOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const readOptionalTrimmedString = (value: unknown): string | undefined => {
  const stringValue = readOptionalString(value)?.trim();
  return stringValue && stringValue.length > 0 ? stringValue : undefined;
};

export const getRecordValue = (
  record: Record<string, unknown>,
  key: string,
): unknown => record[key];

export const getOptionalString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => readOptionalString(getRecordValue(record, key));

export const getOptionalTrimmedString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => readOptionalTrimmedString(getRecordValue(record, key));
