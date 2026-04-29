const rawPostModules = import.meta.glob("./*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

export const RAW_POSTS = Object.entries(rawPostModules)
  .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
  .map(([, post]) => post);
