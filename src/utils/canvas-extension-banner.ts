const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`;

/** Free-to-use Pexels photos behind the Apps cards, matched to each built-in app. */
const BANNERS_BY_EXTENSION: Record<string, string> = {
  "connectome-memory": pexels(8180039),
  "kosmos-roadmap": pexels(3855633),
  "projects-hub": pexels(13352299),
  "learning-center": pexels(590493),
  "marketing-production": pexels(20257729),
  "run-timeline": pexels(1054391),
  hangout: pexels(105813),
  meet: pexels(11297768),
};

const FALLBACK_BANNERS = Object.values(BANNERS_BY_EXTENSION);

/** The card background for an app: its own photo, or a stable pick for apps added later. */
export function canvasExtensionBannerUrl(name: string): string {
  const known = BANNERS_BY_EXTENSION[name];
  if (known) return known;
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FALLBACK_BANNERS[hash % FALLBACK_BANNERS.length];
}
