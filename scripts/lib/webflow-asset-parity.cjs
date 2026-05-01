function normalizeFilename(filename) {
  return filename
    .replace(/^(?:[0-9a-f]{20,}_)+/i, '')
    .replace(/-p-\d+(?=\.[^.]+$)/i, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeAssetIdentifier(input, origin) {
  if (!input || input === 'none') return null;

  const trimmed = String(input).trim().replace(/^['\"]|['\"]$/g, '');
  if (!trimmed || trimmed === 'none' || trimmed.startsWith('data:')) return null;

  let pathname = trimmed;
  try {
    pathname = decodeURIComponent(new URL(trimmed, origin).pathname);
  } catch {
    try {
      pathname = decodeURIComponent(trimmed);
    } catch {
      pathname = trimmed;
    }
  }

  const filename = pathname.split('/').filter(Boolean).pop();
  if (!filename) return null;
  return normalizeFilename(filename);
}

function extractAssetIdentifiers(value, origin) {
  if (!value || value === 'none') return [];

  const matches = [...String(value).matchAll(/url\(([^)]+)\)/g)]
    .map((match) => normalizeAssetIdentifier(match[1], origin))
    .filter(Boolean);

  if (matches.length > 0) return matches;

  const identifier = normalizeAssetIdentifier(value, origin);
  return identifier ? [identifier] : [];
}

function backgroundImagesMatch(liveValue, testValue, liveOrigin, testOrigin) {
  if (liveValue === testValue) return true;
  if (!liveValue || !testValue) return false;
  if (liveValue === 'none' || testValue === 'none') return liveValue === testValue;

  const liveIds = extractAssetIdentifiers(liveValue, liveOrigin);
  const testIds = extractAssetIdentifiers(testValue, testOrigin);

  if (liveIds.length === 0 || testIds.length === 0) return false;
  if (liveIds.length !== testIds.length) return false;

  return liveIds.every((identifier, index) => identifier === testIds[index]);
}

module.exports = {
  backgroundImagesMatch,
  extractAssetIdentifiers,
  normalizeAssetIdentifier,
};
