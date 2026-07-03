function normalizeIntegrationLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_.-]+/g, "");
}

export function isRedundantIntegrationCardLabel(
  label: string,
  ...referenceLabels: Array<string | null | undefined>
): boolean {
  const normalizedLabel = normalizeIntegrationLabel(label);
  if (!normalizedLabel) {
    return true;
  }

  return referenceLabels.some((referenceLabel) => {
    if (!referenceLabel) {
      return false;
    }

    const normalizedReference = normalizeIntegrationLabel(referenceLabel);
    return (
      normalizedLabel === normalizedReference ||
      normalizedReference.includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedReference)
    );
  });
}
