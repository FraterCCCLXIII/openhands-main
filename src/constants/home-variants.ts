export const HOME_VARIANT_STORAGE_KEY = 'openhands-homepage-variant';

export type HomeVariantId = 'v1' | 'v2' | 'v3';

export const DEFAULT_HOME_VARIANT: HomeVariantId = 'v2';

export type HomeVariantOption = {
  id: HomeVariantId;
  label: string;
  description: string;
};

export const HOME_VARIANT_OPTIONS: readonly HomeVariantOption[] = [
  {
    id: 'v1',
    label: 'Version 1',
    description: 'Workflow carousel, logos above preview',
  },
  {
    id: 'v2',
    label: 'Version 2',
    description: 'Product preview first, logos below',
  },
  {
    id: 'v3',
    label: 'Version 3',
    description: 'Version 2 layout with compact header nav',
  },
] as const;

export const HOME_VARIANT_SWITCHER_LABEL = 'Homepage layout variants';

export const HOME_V3_NAV_LINK_CLASS = 'text-sm font-normal leading-[19.6px]';
export const HOME_V3_NAV_LINK_GAP = '1.1cqw';
export const HOME_V3_NAV_CTA_PADDING = '0.65em 1.35em';
export const HOME_V3_NAV_CTA_FONT_SIZE = '14px';
export const HOME_V3_NAV_DROPDOWN_ICON_SIZE = '16px';

export function isHomeVariantId(value: string | null): value is HomeVariantId {
  return value === 'v1' || value === 'v2' || value === 'v3';
}

export function usesVersion2HomeLayout(variant: HomeVariantId): boolean {
  return variant === 'v2' || variant === 'v3';
}

export function usesCompactHomeHeader(variant: HomeVariantId): boolean {
  return variant === 'v3';
}

export const HOME_V1_HERO_CONTENT_PADDING = {
  top: 104,
  bottom: 80,
} as const;

export const HOME_V2_HERO_CONTENT_PADDING = {
  top: 72,
  bottom: 56,
} as const;

export function getHomeHeroContentPadding(variant: HomeVariantId) {
  return usesVersion2HomeLayout(variant) ? HOME_V2_HERO_CONTENT_PADDING : HOME_V1_HERO_CONTENT_PADDING;
}

export function readStoredHomeVariant(): HomeVariantId {
  if (typeof window === 'undefined') return DEFAULT_HOME_VARIANT;

  try {
    const stored = window.localStorage.getItem(HOME_VARIANT_STORAGE_KEY);
    return isHomeVariantId(stored) ? stored : DEFAULT_HOME_VARIANT;
  } catch {
    return DEFAULT_HOME_VARIANT;
  }
}

export function writeStoredHomeVariant(variant: HomeVariantId): void {
  try {
    window.localStorage.setItem(HOME_VARIANT_STORAGE_KEY, variant);
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}
