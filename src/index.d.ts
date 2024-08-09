// Allow for importing markdown files
declare module "*.md" {
  const content: string;
  export default content;
}
