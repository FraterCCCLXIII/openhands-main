export const SITE_ORIGIN = 'https://openhands.dev';

export const DEFAULT_SOCIAL_IMAGE =
  'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png';

export type SocialPreviewMetaEntry = Record<string, string>;

type SocialPreviewMetaOptions = {
  title: string;
  description: string;
  pathname?: string;
  image?: string;
  imageAlt?: string;
  imageType?: string;
  imageWidth?: string;
  imageHeight?: string;
  type?: string;
  siteName?: string;
  canonical?: boolean | string;
  socialTitle?: string;
  socialDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterCard?: string;
  extra?: SocialPreviewMetaEntry[];
};

export const canonicalUrl = (pathname = '/') => {
  if (!pathname || pathname === '/') return SITE_ORIGIN;
  if (/^https?:\/\//.test(pathname)) return pathname;

  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE_ORIGIN}${normalizedPathname}`;
};

export const createSocialPreviewMeta = ({
  title,
  description,
  pathname = '/',
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt,
  imageType = 'image/png',
  imageWidth = '1200',
  imageHeight = '630',
  type = 'website',
  siteName = 'OpenHands',
  canonical = true,
  socialTitle,
  socialDescription,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  twitterCard = 'summary_large_image',
  extra = [],
}: SocialPreviewMetaOptions): SocialPreviewMetaEntry[] => {
  const url = typeof canonical === 'string' ? canonical : canonicalUrl(pathname);
  const resolvedOgTitle = ogTitle ?? socialTitle ?? title;
  const resolvedOgDescription = ogDescription ?? socialDescription ?? description;
  const resolvedTwitterTitle = twitterTitle ?? socialTitle ?? resolvedOgTitle;
  const resolvedTwitterDescription =
    twitterDescription ?? socialDescription ?? resolvedOgDescription;
  const resolvedImageAlt = imageAlt ?? resolvedOgTitle;

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: resolvedOgTitle },
    { property: 'og:description', content: resolvedOgDescription },
    { property: 'og:image', content: image },
    { property: 'og:image:secure_url', content: image },
    { property: 'og:image:type', content: imageType },
    { property: 'og:image:width', content: imageWidth },
    { property: 'og:image:height', content: imageHeight },
    { property: 'og:image:alt', content: resolvedImageAlt },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: resolvedTwitterTitle },
    { name: 'twitter:description', content: resolvedTwitterDescription },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: resolvedImageAlt },
    ...(canonical ? [{ tagName: 'link' as const, rel: 'canonical', href: url }] : []),
    ...extra,
  ];
};
