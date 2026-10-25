import type { KamijiMochiId, KamijiPropName } from "./kamiji-catalog";

// Only the vendored subset of mochi is bundled; any other id fails to load and
// KamijiMochi falls back to its flat SVG.
const MOCHI_URLS = import.meta.glob<string>(
  "../../../assets/kamiji/mochi/*.glb",
  {
    query: "?url",
    import: "default",
    eager: true,
  },
);
const PROP_URLS = import.meta.glob<string>(
  "../../../assets/kamiji/props/*.glb",
  {
    query: "?url",
    import: "default",
    eager: true,
  },
);

const find = (urls: Record<string, string>, file: string): string =>
  Object.entries(urls).find(([path]) => path.endsWith(`/${file}`))?.[1] ?? "";

export function getMochiUrl(id: KamijiMochiId): string {
  return find(MOCHI_URLS, `${id}.glb`);
}

export function getPropUrl(name: KamijiPropName): string {
  return find(PROP_URLS, `${name}.glb`);
}
