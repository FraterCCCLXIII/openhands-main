export const SITE_ORIGIN = 'https://openhands.dev';

export const DEFAULT_SOCIAL_IMAGE =
  `${SITE_ORIGIN}/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png`;

type SocialPreviewMetaOptions = {
  title: string;
  description: string;
  pathname?: string;
  image?: string;
  type?: string;
  canonical?: boolean;
};

const canonicalUrl = (pathname = '/') => {
  if (!pathname || pathname === '/') return SITE_ORIGIN;
  return `${SITE_ORIGIN}${pathname}`;
};

export const createSocialPreviewMeta = ({
  title,
  description,
  pathname = '/',
  image = DEFAULT_SOCIAL_IMAGE,
  type = 'website',
  canonical = true,
}: SocialPreviewMetaOptions) => {
  const url = canonicalUrl(pathname);

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    ...(canonical ? [{ rel: 'canonical', href: url }] : []),
  ];
};
