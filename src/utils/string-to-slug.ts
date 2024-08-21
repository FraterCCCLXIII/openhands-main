export const stringToSlug = (str: string) => str
  .toLowerCase()
  .replace(/ /g, "-")
  .replace(/[^a-z0-9-]/g, ""); // remove non-alphanumeric characters
