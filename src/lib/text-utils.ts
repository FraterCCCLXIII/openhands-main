export const normalizeCaseInsensitiveText = (
  value: string | null | undefined,
) => (value ?? "").trim().toLowerCase();

const normalizeSearchValues = (values: Array<string | null | undefined>) =>
  values
    .map((value) => normalizeCaseInsensitiveText(value))
    .filter(Boolean);

export const matchesSearchQuery = (
  values: Array<string | null | undefined>,
  query: string,
) => {
  const normalizedQuery = normalizeCaseInsensitiveText(query);
  if (!normalizedQuery) {
    return true;
  }

  return normalizeSearchValues(values).some((value) =>
    value.includes(normalizedQuery),
  );
};

export const matchesExactSearchQuery = (
  values: Array<string | null | undefined>,
  query: string,
) => {
  const normalizedQuery = normalizeCaseInsensitiveText(query);
  if (!normalizedQuery) {
    return false;
  }

  return normalizeSearchValues(values).some((value) => value === normalizedQuery);
};
