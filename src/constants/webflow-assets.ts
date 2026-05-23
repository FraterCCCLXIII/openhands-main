export interface ResponsiveImageAsset {
  src: string;
  srcSet: string;
  alt: string;
  width?: number;
  height?: number;
}

export const webflowPngSrcSet = (basePath: string, renderedWidth = 978) => {
  const extensionIndex = basePath.lastIndexOf('.png');
  const base = basePath.slice(0, extensionIndex);
  return `${base}-p-500.png 500w, ${base}-p-800.png 800w, ${basePath} ${renderedWidth}w`;
};

export const ASCII_HOLE_ALT = 'ASCII art depicting a large black hole with light and particles swirling around it.';

export const ASCII_HOLE_IMAGE: ResponsiveImageAsset = {
  src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png',
  srcSet: [
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-500.png 500w',
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-800.png 800w',
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-1080.png 1080w',
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png 1440w',
  ].join(', '),
  alt: ASCII_HOLE_ALT,
  width: 1440,
  height: 800,
};

export const ASCII_HOLE_IMAGE_1080: ResponsiveImageAsset = {
  ...ASCII_HOLE_IMAGE,
  src: '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-1080.png',
  srcSet: [
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-800.png 800w',
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole-p-1080.png 1080w',
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png 1440w',
  ].join(', '),
};

export const ASCII_HOLE_BACKGROUND_IMAGE = `url('${ASCII_HOLE_IMAGE.src}')`;

export const ASCII_ACCENT_15_IMAGE = {
  src: '/assets/webflow/backgrounds/690b50c95a72e7b17a1412a8_09a6ecb11584c3309a64a00d57130313_ascii-art_(15)_1.svg',
  alt: 'asci art',
} as const;

export const ENTERPRISE_ASCII_HOLE_IMAGE: ResponsiveImageAsset = {
  ...ASCII_HOLE_IMAGE,
  srcSet: [
    '/assets/webflow/enterprise/690b397ae76441160bed52b6_asci-art-hole-p-500.png 500w',
    '/assets/webflow/enterprise/690b397ae76441160bed52b6_asci-art-hole-p-800.png 800w',
    '/assets/webflow/enterprise/690b397ae76441160bed52b6_asci-art-hole-p-1080.png 1080w',
    '/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png 1440w',
  ].join(', '),
};

export const ENTERPRISE_CONTROL_PLANE_IMAGE: ResponsiveImageAsset = {
  src: '/assets/webflow/enterprise/69fb21f8dc8c20b014d24bad_9761f727961757aba10787e99f6f05dd_control-plane-p-1600.png',
  srcSet: [
    '/assets/webflow/enterprise/69fb21f8dc8c20b014d24bad_9761f727961757aba10787e99f6f05dd_control-plane-p-500.png 500w',
    '/assets/webflow/enterprise/69fb21f8dc8c20b014d24bad_9761f727961757aba10787e99f6f05dd_control-plane-p-800.png 800w',
    '/assets/webflow/enterprise/69fb21f8dc8c20b014d24bad_9761f727961757aba10787e99f6f05dd_control-plane-p-1080.png 1080w',
    '/assets/webflow/enterprise/69fb21f8dc8c20b014d24bad_9761f727961757aba10787e99f6f05dd_control-plane-p-1600.png 1600w',
  ].join(', '),
  alt: '',
};

export const ENTERPRISE_STEPS_IMAGE: ResponsiveImageAsset = {
  src: '/assets/webflow/enterprise/steps.png',
  srcSet: [
    '/assets/webflow/enterprise/69fb2416b628253a2db6a017_947e9b2e2e6d72c882da1634fe57f949_steps-p-500.png 500w',
    '/assets/webflow/enterprise/steps.png 932w',
  ].join(', '),
  alt: '',
};

export const C3AI_AUTHOR_IMAGE = '/assets/webflow/enterprise/image96x96.png';
export const C3AI_LOGO_IMAGE = '/assets/webflow/enterprise/c3ailogo.svg';
